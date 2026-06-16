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
  const flashSaleRunning =
    Number(row.flash_sale_active) === 1 &&
    (!row.flash_sale_start_at || new Date(row.flash_sale_start_at) <= new Date()) &&
    (!row.flash_sale_end_at || new Date(row.flash_sale_end_at) >= new Date()) &&
    Number(row.flash_sale_stock || 0) > Number(row.flash_sale_sold || 0) &&
    Number(row.flash_sale_price || 0) > 0
  const basePrice = Number(row.price)
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: flashSaleRunning ? Number(row.flash_sale_price) : basePrice,
    originalPrice: flashSaleRunning ? basePrice : row.original_price == null ? null : Number(row.original_price),
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
      salePrice: row.flash_sale_price == null ? null : Number(row.flash_sale_price),
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
          productCount: row.shop_product_count || 0,
          soldCount: row.shop_sold_count || 0,
        }
      : null,
  }
}

function toPositiveInt(value, fallback, max) {
  const number = Number.parseInt(value, 10)
  if (!Number.isFinite(number) || number < 1) return fallback
  return Math.min(number, max)
}

function toNumberFilter(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function toIdList(value) {
  const source = Array.isArray(value) ? value : String(value || '').split(',')
  return [...new Set(source.map((item) => Number(item)).filter((item) => Number.isSafeInteger(item) && item > 0))]
}

function productSaleActiveSql() {
  return `(p.flash_sale_active = 1
    AND (p.flash_sale_start_at IS NULL OR p.flash_sale_start_at <= NOW())
    AND (p.flash_sale_end_at IS NULL OR p.flash_sale_end_at >= NOW())
    AND p.flash_sale_stock > p.flash_sale_sold
    AND p.flash_sale_price IS NOT NULL
    AND p.flash_sale_price > 0)`
}

function productEffectivePriceSql() {
  const saleActive = productSaleActiveSql()
  return `(CASE WHEN ${saleActive} THEN p.flash_sale_price ELSE p.price END)`
}

function buildProductFilters(queryParams, { includeShop = true } = {}) {
  const where = ['p.is_active = 1', 's.is_active = 1', "u.role = 'seller'", 'u.is_active = 1']
  const params = []
  const effectivePrice = productEffectivePriceSql()

  if (queryParams.search) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)')
    const term = `%${String(queryParams.search).trim()}%`
    params.push(term, term)
  }

  if (queryParams.category) {
    where.push('(c.slug = ? OR c.id = ?)')
    params.push(String(queryParams.category), Number(queryParams.category) || 0)
  }

  const minRating = toNumberFilter(queryParams.minRating || queryParams.rating)
  if (minRating !== null) {
    where.push('p.rating_avg >= ?')
    params.push(Math.min(5, minRating))
  }

  const minPrice = toNumberFilter(queryParams.minPrice)
  if (minPrice !== null) {
    where.push(`${effectivePrice} >= ?`)
    params.push(minPrice)
  }

  const maxPrice = toNumberFilter(queryParams.maxPrice)
  if (maxPrice !== null) {
    where.push(`${effectivePrice} <= ?`)
    params.push(maxPrice)
  }

  const promotionOnly = ['true', '1', 'yes'].includes(String(queryParams.promotion || queryParams.onSale || '').toLowerCase())
  if (promotionOnly) {
    where.push(`(${productSaleActiveSql()} OR (p.original_price IS NOT NULL AND p.original_price > p.price))`)
  }

  if (String(queryParams.flashSale || '').toLowerCase() === 'true') {
    where.push(productSaleActiveSql())
  }

  if (includeShop) {
    const shopIds = toIdList(queryParams.shopId || queryParams.shopIds || queryParams.brand)
    if (shopIds.length) {
      where.push(`s.id IN (${shopIds.map(() => '?').join(', ')})`)
      params.push(...shopIds)
    }
  }

  return { where, params }
}

function orderBySql(sort) {
  if (sort === 'sold' || sort === 'best_selling') return 'p.sold_count DESC, p.created_at DESC'
  if (sort === 'rating') return 'p.rating_avg DESC, p.rating_count DESC, p.created_at DESC'
  if (sort === 'price_asc') return `${productEffectivePriceSql()} ASC, p.created_at DESC`
  if (sort === 'price_desc') return `${productEffectivePriceSql()} DESC, p.created_at DESC`
  return 'p.created_at DESC'
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = toPositiveInt(req.query.page, 1, 100000)
    const limit = toPositiveInt(req.query.limit, 24, 100)
    const offset = (page - 1) * limit

    const { where, params } = buildProductFilters(req.query)
    const facetFilters = buildProductFilters(req.query, { includeShop: false })

    const [rows, countRows, shopRows] = await Promise.all([
      query(
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
       ORDER BY ${orderBySql(String(req.query.sort || 'newest'))}
       LIMIT ${limit} OFFSET ${offset}`,
      params,
      ),
      query(
        `SELECT COUNT(*) AS total
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         JOIN shops s ON s.id = p.shop_id
         JOIN users u ON u.id = s.owner_id
         WHERE ${where.join(' AND ')}`,
        params,
      ),
      query(
        `SELECT s.id, s.name, s.slug, COUNT(*) AS product_count
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         JOIN shops s ON s.id = p.shop_id
         JOIN users u ON u.id = s.owner_id
         WHERE ${facetFilters.where.join(' AND ')}
         GROUP BY s.id, s.name, s.slug
         ORDER BY product_count DESC, s.name ASC
         LIMIT 20`,
        facetFilters.params,
      ),
    ])

    res.json({
      ok: true,
      data: rows.map(mapProduct),
      pagination: { page, limit, total: Number(countRows[0]?.total || 0) },
      filters: {
        shops: shopRows.map((row) => ({
          id: Number(row.id),
          name: row.name,
          slug: row.slug,
          productCount: Number(row.product_count || 0),
        })),
      },
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
          s.follower_count AS shop_follower_count,
          shop_summary.product_count AS shop_product_count,
          shop_summary.sold_count AS shop_sold_count
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        JOIN shops s ON s.id = p.shop_id
        JOIN users u ON u.id = s.owner_id
        LEFT JOIN (
          SELECT shop_id, COUNT(*) AS product_count, COALESCE(SUM(sold_count), 0) AS sold_count
          FROM products
          WHERE is_active = 1 AND status = 'active'
          GROUP BY shop_id
        ) shop_summary ON shop_summary.shop_id = s.id
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
