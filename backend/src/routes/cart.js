const express = require('express')

const { query, transaction } = require('../config/db')
const { requireAuth } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/error')

const router = express.Router()

async function getOrCreateCart(userId, connection) {
  const [carts] = await connection.execute('SELECT id FROM carts WHERE user_id = ? LIMIT 1', [userId])
  if (carts[0]) return carts[0]

  const [result] = await connection.execute('INSERT INTO carts (user_id) VALUES (?)', [userId])
  return { id: result.insertId }
}

async function readCart(userId) {
  const carts = await query('SELECT id FROM carts WHERE user_id = ? LIMIT 1', [userId])
  if (!carts[0]) return { id: null, items: [] }

  const items = await query(
    `SELECT
       ci.id,
       ci.product_id AS productId,
       ci.variant_id AS variantId,
       ci.quantity,
       p.name,
       p.slug,
       COALESCE(pv.price, p.price) AS unitPrice,
       COALESCE(pv.image_url, p.thumbnail_url,
         (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1)
       ) AS imageUrl,
       pv.name AS variantName,
       pv.sku AS variantSku
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     LEFT JOIN product_variants pv ON pv.id = ci.variant_id
     WHERE ci.cart_id = ?
     ORDER BY ci.updated_at DESC`,
    [carts[0].id],
  )

  return {
    id: carts[0].id,
    items,
    totals: {
      quantity: items.reduce((sum, item) => sum + Number(item.quantity), 0),
      amount: items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0),
    },
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
    const quantity = Math.max(1, Number.parseInt(req.body?.quantity || 1, 10))

    if (!productId) return res.status(400).json({ ok: false, message: 'Thiếu productId' })

    await transaction(async (connection) => {
      const [products] = await connection.execute('SELECT id FROM products WHERE id = ? AND is_active = 1 LIMIT 1', [productId])
      if (!products[0]) {
        const err = new Error('Sản phẩm không tồn tại')
        err.status = 404
        throw err
      }

      if (variantId) {
        const [variants] = await connection.execute(
          'SELECT id FROM product_variants WHERE id = ? AND product_id = ? LIMIT 1',
          [variantId, productId],
        )
        if (!variants[0]) {
          const err = new Error('Phiên bản sản phẩm không tồn tại')
          err.status = 404
          throw err
        }
      }

      const cart = await getOrCreateCart(userId, connection)
      const [existing] = await connection.execute(
        `SELECT id, quantity FROM cart_items
         WHERE cart_id = ? AND product_id = ? AND ${variantId ? 'variant_id = ?' : 'variant_id IS NULL'}
         LIMIT 1`,
        variantId ? [cart.id, productId, variantId] : [cart.id, productId],
      )

      if (existing[0]) {
        await connection.execute('UPDATE cart_items SET quantity = quantity + ?, updated_at = NOW() WHERE id = ?', [
          quantity,
          existing[0].id,
        ])
      } else {
        await connection.execute(
          'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
          [cart.id, productId, variantId, quantity],
        )
      }
    })

    const cart = await readCart(userId)
    res.status(201).json({ ok: true, data: cart })
  }),
)

router.patch(
  '/items/:itemId',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const itemId = Number(req.params.itemId)
    const quantity = Number.parseInt(req.body?.quantity, 10)

    if (!itemId) return res.status(400).json({ ok: false, message: 'Thiếu itemId' })
    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ ok: false, message: 'Số lượng không hợp lệ' })
    }

    await query(
      `UPDATE cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       SET ci.quantity = ?, ci.updated_at = NOW()
       WHERE ci.id = ? AND c.user_id = ?`,
      [quantity, itemId, userId],
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
