const express = require('express')

const { query, transaction } = require('../config/db')
const { requireAuth } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/error')

const router = express.Router()

function safeParseJson(value, fallback) {
  if (!value) return fallback
  if (typeof value === 'object') return value

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeSelectedOptions(value) {
  const source = safeParseJson(value, {})
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {}

  return Object.entries(source)
    .map(([name, selectedValue]) => [String(name || '').trim(), String(selectedValue || '').trim()])
    .filter(([name, selectedValue]) => name && selectedValue)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((result, [name, selectedValue]) => {
      result[name] = selectedValue
      return result
    }, {})
}

function canonicalSelectedOptions(value) {
  return JSON.stringify(normalizeSelectedOptions(value))
}

function optionsEqual(left, right) {
  return canonicalSelectedOptions(left) === canonicalSelectedOptions(right)
}

function toCartItem(row) {
  const selectedOptions = normalizeSelectedOptions(row.selectedOptions)
  const variantAttributes = normalizeSelectedOptions(row.variantAttributes)
  const displayOptions = Object.keys(selectedOptions).length ? selectedOptions : variantAttributes
  const unitPrice = Number(row.unitPrice || 0)
  const quantity = Number(row.quantity || 0)

  return {
    id: Number(row.id),
    productId: Number(row.productId),
    variantId: row.variantId == null ? null : Number(row.variantId),
    quantity,
    name: row.name,
    slug: row.slug,
    unitPrice,
    imageUrl: row.imageUrl || '',
    selectedOptions: displayOptions,
    variantName: row.variantName || '',
    variantSku: row.variantSku || '',
    stock: Number(row.stock || 0),
    weightGrams: row.weightGrams == null ? null : Number(row.weightGrams),
    lineTotal: unitPrice * quantity,
    shop: row.shopId
      ? {
          id: Number(row.shopId),
          name: row.shopName || '',
          slug: row.shopSlug || '',
        }
      : null,
    category: row.categoryId
      ? {
          id: Number(row.categoryId),
          name: row.categoryName || '',
          slug: row.categorySlug || '',
        }
      : null,
  }
}

function throwStatus(message, status = 400) {
  const err = new Error(message)
  err.status = status
  throw err
}

async function getOrCreateCart(userId, connection) {
  const [carts] = await connection.execute('SELECT id FROM carts WHERE user_id = ? LIMIT 1', [userId])
  if (carts[0]) return carts[0]

  const [result] = await connection.execute('INSERT INTO carts (user_id) VALUES (?)', [userId])
  return { id: result.insertId }
}

async function readCart(userId) {
  const carts = await query('SELECT id FROM carts WHERE user_id = ? LIMIT 1', [userId])
  if (!carts[0]) return { id: null, items: [], totals: { quantity: 0, amount: 0 } }

  const rows = await query(
    `SELECT
       ci.id,
       ci.product_id AS productId,
       ci.variant_id AS variantId,
       ci.selected_options AS selectedOptions,
       ci.quantity,
       p.name,
       p.slug,
       COALESCE(pv.price, p.price) AS unitPrice,
       COALESCE(pv.stock, p.stock) AS stock,
       p.weight_grams AS weightGrams,
       COALESCE(pv.image_url, p.thumbnail_url,
         (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1)
       ) AS imageUrl,
       pv.name AS variantName,
       pv.sku AS variantSku,
       pv.attributes AS variantAttributes,
       s.id AS shopId,
       s.name AS shopName,
       s.slug AS shopSlug,
       c.id AS categoryId,
       c.name AS categoryName,
       c.slug AS categorySlug
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     LEFT JOIN product_variants pv ON pv.id = ci.variant_id
     LEFT JOIN shops s ON s.id = p.shop_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE ci.cart_id = ?
     ORDER BY ci.updated_at DESC, ci.id DESC`,
    [carts[0].id],
  )

  const items = rows.map(toCartItem)

  return {
    id: Number(carts[0].id),
    items,
    totals: {
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      amount: items.reduce((sum, item) => sum + item.lineTotal, 0),
    },
  }
}

async function readSellableProduct(connection, productId, variantId) {
  const [rows] = await connection.execute(
    `SELECT
       p.id,
       p.is_active AS isActive,
       p.status,
       p.stock AS productStock,
       p.weight_grams AS weightGrams,
       pv.id AS variantId,
       pv.stock AS variantStock
     FROM products p
     LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.id = ?
     WHERE p.id = ?
     LIMIT 1`,
    [variantId || 0, productId],
  )

  const product = rows[0]
  if (!product || Number(product.isActive) !== 1 || product.status !== 'active') {
    throwStatus('Sản phẩm không tồn tại hoặc đã ngừng bán', 404)
  }

  if (variantId && !product.variantId) {
    throwStatus('Phiên bản sản phẩm không tồn tại', 404)
  }

  return {
    id: Number(product.id),
    stock: Number(variantId ? product.variantStock : product.productStock),
  }
}

router.use(requireAuth)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await readCart(Number(req.user.sub))
    res.json({ ok: true, data: cart })
  }),
)

router.post(
  '/items',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const productId = Number(req.body?.productId)
    const variantId = req.body?.variantId == null ? null : Number(req.body.variantId)
    const quantity = Number.parseInt(req.body?.quantity || 1, 10)
    const selectedOptions = normalizeSelectedOptions(req.body?.selectedOptions)

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({ ok: false, message: 'Thiếu productId' })
    }

    if (variantId !== null && (!Number.isSafeInteger(variantId) || variantId <= 0)) {
      return res.status(400).json({ ok: false, message: 'Phiên bản sản phẩm không hợp lệ' })
    }

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      return res.status(400).json({ ok: false, message: 'Số lượng không hợp lệ' })
    }

    await transaction(async (connection) => {
      const product = await readSellableProduct(connection, productId, variantId)
      if (quantity > product.stock) throwStatus('Số lượng vượt quá tồn kho')

      const cart = await getOrCreateCart(userId, connection)
      const [candidates] = await connection.execute(
        `SELECT id, quantity, selected_options AS selectedOptions
         FROM cart_items
         WHERE cart_id = ? AND product_id = ? AND ${variantId ? 'variant_id = ?' : 'variant_id IS NULL'}`,
        variantId ? [cart.id, productId, variantId] : [cart.id, productId],
      )
      const existing = candidates.find((item) => optionsEqual(item.selectedOptions, selectedOptions))
      const nextQuantity = Number(existing?.quantity || 0) + quantity

      if (nextQuantity > product.stock) throwStatus('Số lượng vượt quá tồn kho')

      if (existing) {
        await connection.execute('UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?', [
          nextQuantity,
          existing.id,
        ])
      } else {
        await connection.execute(
          `INSERT INTO cart_items (cart_id, product_id, variant_id, selected_options, quantity)
           VALUES (?, ?, ?, ?, ?)`,
          [cart.id, productId, variantId, JSON.stringify(selectedOptions), quantity],
        )
      }

      await connection.execute('UPDATE carts SET updated_at = NOW() WHERE id = ?', [cart.id])
    })

    const cart = await readCart(userId)
    res.status(201).json({ ok: true, data: cart, message: 'Đã thêm sản phẩm vào giỏ hàng' })
  }),
)

router.patch(
  '/items/:itemId',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const itemId = Number(req.params.itemId)
    const quantity = Number.parseInt(req.body?.quantity, 10)

    if (!Number.isSafeInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ ok: false, message: 'Thiếu itemId' })
    }

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      return res.status(400).json({ ok: false, message: 'Số lượng không hợp lệ' })
    }

    await transaction(async (connection) => {
      const [rows] = await connection.execute(
        `SELECT
           ci.id,
           ci.cart_id AS cartId,
           COALESCE(pv.stock, p.stock) AS stock,
           p.is_active AS isActive,
           p.status
         FROM cart_items ci
         JOIN carts c ON c.id = ci.cart_id
         JOIN products p ON p.id = ci.product_id
         LEFT JOIN product_variants pv ON pv.id = ci.variant_id
         WHERE ci.id = ? AND c.user_id = ?
         LIMIT 1`,
        [itemId, userId],
      )

      const item = rows[0]
      if (!item) throwStatus('Không tìm thấy sản phẩm trong giỏ hàng', 404)
      if (Number(item.isActive) !== 1 || item.status !== 'active') throwStatus('Sản phẩm đã ngừng bán')
      if (quantity > Number(item.stock || 0)) throwStatus('Số lượng vượt quá tồn kho')

      await connection.execute('UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?', [
        quantity,
        itemId,
      ])
      await connection.execute('UPDATE carts SET updated_at = NOW() WHERE id = ?', [item.cartId])
    })

    const cart = await readCart(userId)
    res.json({ ok: true, data: cart })
  }),
)

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)

    await query(
      `DELETE ci FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       WHERE c.user_id = ?`,
      [userId],
    )

    const cart = await readCart(userId)
    res.json({ ok: true, data: cart })
  }),
)

router.delete(
  '/items/:itemId',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const itemId = Number(req.params.itemId)

    await query(
      `DELETE ci FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       WHERE ci.id = ? AND c.user_id = ?`,
      [itemId, userId],
    )

    const cart = await readCart(userId)
    res.json({ ok: true, data: cart })
  }),
)

module.exports = router
