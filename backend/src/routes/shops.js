const express = require('express')

const { query } = require('../config/db')
const { asyncHandler } = require('../middleware/error')

const router = express.Router()

function toPositiveInt(value, fallback, max) {
  const number = Number.parseInt(value, 10)
  if (!Number.isFinite(number) || number < 1) return fallback
  return Math.min(number, max)
}

function toNumberFilter(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
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
  return `(CASE WHEN ${productSaleActiveSql()} THEN p.flash_sale_price ELSE p.price END)`
}

function orderBySql(sort) {
  if (sort === 'sold' || sort === 'best_selling') return 'p.sold_count DESC, p.created_at DESC'
  if (sort === 'rating') return 'p.rating_avg DESC, p.rating_count DESC, p.created_at DESC'
  if (sort === 'price_asc') return `${productEffectivePriceSql()} ASC, p.created_at DESC`
  if (sort === 'price_desc') return `${productEffectivePriceSql()} DESC, p.created_at DESC`
  return 'p.created_at DESC'
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
    thumbnailUrl: row.thumbnail_url || row.image_url || null,
    imageUrl: row.image_url || row.thumbnail_url || null,
    ratingAvg: Number(row.rating_avg || 0),
    ratingCount: row.rating_count,
    soldCount: row.sold_count,
    flashSale: {
      isActive: flashSaleRunning,
      discountPercent: row.flash_sale_discount_percent,
      salePrice: row.flash_sale_price == null ? null : Number(row.flash_sale_price),
    },
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        }
      : null,
  }
}

router.get(
  '/:idOrSlug',
  asyncHandler(async (req, res) => {
    const idOrSlug = String(req.params.idOrSlug)
    const isNumericId = /^[0-9]+$/.test(idOrSlug)
    const page = toPositiveInt(req.query.page, 1, 100000)
    const limit = toPositiveInt(req.query.limit, 24, 100)
    const offset = (page - 1) * limit

    const shopRows = await query(
      `SELECT
         s.id,
         s.owner_id AS ownerId,
         s.name,
         s.slug,
         s.avatar_url AS avatarUrl,
         s.cover_url AS coverUrl,
         s.description,
         s.address_line1 AS addressLine1,
         s.ward,
         s.province,
         s.rating_avg AS ratingAvg,
         s.rating_count AS ratingCount,
         s.follower_count AS followerCount,
         s.created_at AS createdAt,
         COUNT(DISTINCT p.id) AS productCount,
         COALESCE(SUM(p.sold_count), 0) AS soldCount
       FROM shops s
       LEFT JOIN products p ON p.shop_id = s.id AND p.is_active = 1 AND p.status = 'active'
       JOIN users u ON u.id = s.owner_id
       WHERE s.is_active = 1 AND u.is_active = 1 AND u.role = 'seller' AND ${isNumericId ? 's.id = ?' : 's.slug = ?'}
       GROUP BY
         s.id,
         s.owner_id,
         s.name,
         s.slug,
         s.avatar_url,
         s.cover_url,
         s.description,
         s.address_line1,
         s.ward,
         s.province,
         s.rating_avg,
         s.rating_count,
         s.follower_count,
         s.created_at
       LIMIT 1`,
      [isNumericId ? Number(idOrSlug) : idOrSlug],
    )

    const shop = shopRows[0]
    if (!shop) return res.status(404).json({ ok: false, message: 'Không tìm thấy shop' })

    const where = ['p.shop_id = ?', 'p.is_active = 1', "p.status = 'active'"]
    const params = [shop.id]

    if (req.query.search) {
      where.push('(p.name LIKE ? OR p.description LIKE ?)')
      const term = `%${String(req.query.search).trim()}%`
      params.push(term, term)
    }

    if (req.query.category) {
      where.push('(c.slug = ? OR c.id = ?)')
      params.push(String(req.query.category), Number(req.query.category) || 0)
    }

    const minPrice = toNumberFilter(req.query.minPrice)
    if (minPrice !== null) {
      where.push(`${productEffectivePriceSql()} >= ?`)
      params.push(minPrice)
    }

    const maxPrice = toNumberFilter(req.query.maxPrice)
    if (maxPrice !== null) {
      where.push(`${productEffectivePriceSql()} <= ?`)
      params.push(maxPrice)
    }

    if (String(req.query.promotion || '').toLowerCase() === 'true') {
      where.push(`(${productSaleActiveSql()} OR (p.original_price IS NOT NULL AND p.original_price > p.price))`)
    }

    const [products, countRows, categoryRows] = await Promise.all([
      query(
        `SELECT
           p.*,
           c.name AS category_name,
           c.slug AS category_slug,
           (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE ${where.join(' AND ')}
         ORDER BY ${orderBySql(String(req.query.sort || 'newest'))}
         LIMIT ${limit} OFFSET ${offset}`,
        params,
      ),
      query(
        `SELECT COUNT(*) AS total
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE ${where.join(' AND ')}`,
        params,
      ),
      query(
        `SELECT c.id, c.name, c.slug, COUNT(*) AS productCount
         FROM products p
         JOIN categories c ON c.id = p.category_id
         WHERE p.shop_id = ? AND p.is_active = 1 AND p.status = 'active'
         GROUP BY c.id, c.name, c.slug
         ORDER BY productCount DESC, c.name ASC`,
        [shop.id],
      ),
    ])

    res.json({
      ok: true,
      data: {
        shop: {
          ...shop,
          id: Number(shop.id),
          ownerId: Number(shop.ownerId),
          ratingAvg: Number(shop.ratingAvg || 0),
          ratingCount: Number(shop.ratingCount || 0),
          followerCount: Number(shop.followerCount || 0),
          productCount: Number(shop.productCount || 0),
          soldCount: Number(shop.soldCount || 0),
        },
        products: products.map(mapProduct),
        pagination: { page, limit, total: Number(countRows[0]?.total || 0) },
        filters: {
          categories: categoryRows.map((row) => ({
            id: Number(row.id),
            name: row.name,
            slug: row.slug,
            productCount: Number(row.productCount || 0),
          })),
        },
      },
    })
  }),
)

module.exports = router
