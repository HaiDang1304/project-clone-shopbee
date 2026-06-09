const express = require('express')

const { query } = require('../config/db')
const { asyncHandler } = require('../middleware/error')

const router = express.Router()

function safeParseJson(value, fallback) {
  if (!value) return fallback
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeProductOptionValues(values) {
  const source = Array.isArray(values) ? values : [values]
  const seen = new Set()
  const result = []

  source
    .flatMap((value) => String(value || '').split(/[,;\n]+/))
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      result.push(value)
    })

  return result
}

function normalizeProductOptions(value) {
  const options = Array.isArray(value) ? value : safeParseJson(value, [])
  if (!Array.isArray(options)) return []

  return options
    .map((option) => ({
      name: String(option?.name || '').trim(),
      values: normalizeProductOptionValues(option?.values),
    }))
    .filter((option) => option.name && option.values.length)
}

function mapProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    originalPrice: row.original_price == null ? null : Number(row.original_price),
    stock: row.stock,
    weightGrams: row.weight_grams == null ? null : Number(row.weight_grams),
    thumbnailUrl: row.thumbnail_url || row.image_url || null,
    imageUrl: row.image_url || row.thumbnail_url || null,
    status: row.status || (Number(row.is_active) === 1 ? 'active' : 'hidden'),
    productOptions: normalizeProductOptions(row.product_options),
    ratingAvg: Number(row.rating_avg || 0),
    ratingCount: row.rating_count,
    soldCount: row.sold_count,
    flashSale: {
      isActive: Boolean(row.flash_sale_active),
      discountPercent: row.flash_sale_discount_percent,
      startAt: row.flash_sale_start_at,
      endAt: row.flash_sale_end_at,
      soldInEvent: row.flash_sale_sold,
      eventStock: row.flash_sale_stock,
    },
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        }
      : null,
      shop: row.shop_id
      ? {
          id: row.shop_id,
          name: row.shop_name,
          slug: row.shop_slug,
          avatarUrl: row.shop_avatar_url,
          ratingAvg: Number(row.shop_rating_avg || 0),
          ratingCount: row.shop_rating_count || 0,
          followerCount: row.shop_follower_count || 0,
        }
      : null,
  }
}

function toPositiveInt(value, fallback, max) {
  const number = Number.parseInt(value, 10)
  if (!Number.isFinite(number) || number < 1) return fallback
  return Math.min(number, max)
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = toPositiveInt(req.query.page, 1, 100000)
    const limit = toPositiveInt(req.query.limit, 24, 100)
    const offset = (page - 1) * limit

    const where = ['p.is_active = 1', 's.is_active = 1', "u.role = 'seller'", 'u.is_active = 1']
    const params = []

    if (req.query.search) {
      where.push('(p.name LIKE ? OR p.description LIKE ?)')
      const term = `%${String(req.query.search).trim()}%`
      params.push(term, term)
    }

    if (req.query.category) {
      where.push('(c.slug = ? OR c.id = ?)')
      params.push(String(req.query.category), Number(req.query.category) || 0)
    }

    if (String(req.query.flashSale || '').toLowerCase() === 'true') {
      where.push('p.flash_sale_active = 1')
      where.push('(p.flash_sale_start_at IS NULL OR p.flash_sale_start_at <= NOW())')
      where.push('(p.flash_sale_end_at IS NULL OR p.flash_sale_end_at >= NOW())')
    }

    const rows = await query(
      `SELECT
         p.*,
         c.name AS category_name,
         c.slug AS category_slug,
         s.name AS shop_name,
         s.slug AS shop_slug,
         s.avatar_url AS shop_avatar_url,
         s.rating_avg AS shop_rating_avg,
         s.rating_count AS shop_rating_count,
         s.follower_count AS shop_follower_count,
         (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       JOIN shops s ON s.id = p.shop_id
       JOIN users u ON u.id = s.owner_id
       WHERE ${where.join(' AND ')}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    )

    res.json({
      ok: true,
      data: rows.map(mapProduct),
      pagination: { page, limit },
    })
  }),
)

router.get(
  '/:idOrSlug',
  asyncHandler(async (req, res) => {
    const idOrSlug = String(req.params.idOrSlug)
    const isNumericId = /^[0-9]+$/.test(idOrSlug)

    const rows = await query(
      `SELECT
         p.*,
         c.name AS category_name,
         c.slug AS category_slug,
         s.name AS shop_name,
         s.slug AS shop_slug,
         s.avatar_url AS shop_avatar_url,
         s.rating_avg AS shop_rating_avg,
         s.rating_count AS shop_rating_count,
         s.follower_count AS shop_follower_count
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       JOIN shops s ON s.id = p.shop_id
       JOIN users u ON u.id = s.owner_id
        WHERE p.is_active = 1 AND s.is_active = 1 AND u.role = 'seller' AND u.is_active = 1 AND ${isNumericId ? 'p.id = ?' : 'p.slug = ?'}
       LIMIT 1`,
      [isNumericId ? Number(idOrSlug) : idOrSlug],
    )

    if (!rows[0]) return res.status(404).json({ ok: false, message: 'Không tìm thấy sản phẩm' })
    const product = mapProduct(rows[0])

    const [images, tags, reviews] = await Promise.all([
      query(
        `SELECT id, image_url AS imageUrl, alt_text AS altText, sort_order AS sortOrder
         FROM product_images
         WHERE product_id = ?
         ORDER BY sort_order ASC, id ASC`,
        [product.id],
      ),
      query('SELECT tag FROM product_tags WHERE product_id = ? ORDER BY tag ASC', [product.id]),
      query(
        `SELECT r.id, r.rating, r.comment, r.created_at AS createdAt, u.name AS userName, u.avatar_url AS userAvatarUrl
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.product_id = ? AND r.is_visible = 1
         ORDER BY r.created_at DESC
         LIMIT 20`,
        [product.id],
      ),
    ])

    res.json({
      ok: true,
      data: {
        ...product,
        images,
        variants: [],
        tags: tags.map((row) => row.tag),
        reviews,
      },
    })
  }),
)

module.exports = router
