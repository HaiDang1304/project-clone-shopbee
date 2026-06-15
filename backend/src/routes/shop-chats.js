const express = require('express')

const { query, transaction } = require('../config/db')
const { requireAuth } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/error')

const router = express.Router()

router.use(requireAuth)

function mapConversation(row) {
  return {
    id: Number(row.id),
    shopId: Number(row.shop_id),
    shopName: row.shop_name,
    shopSlug: row.shop_slug,
    shopAvatarUrl: row.shop_avatar_url,
    customerId: Number(row.customer_id),
    sellerId: Number(row.seller_id),
    customerName: row.customer_name || null,
    customerAvatarUrl: row.customer_avatar_url || null,
    productId: row.product_id == null ? null : Number(row.product_id),
    productName: row.product_name || null,
    productSlug: row.product_slug || null,
    lastMessage: row.last_message || null,
    lastMessageAt: row.last_message_at,
  }
}

function mapMessage(row, userId) {
  return {
    id: Number(row.id),
    conversationId: Number(row.conversation_id),
    senderId: Number(row.sender_id),
    senderName: row.sender_name,
    mine: Number(row.sender_id) === Number(userId),
    message: row.message,
    createdAt: row.created_at,
  }
}

async function getConversationForUser(conversationId, userId) {
  const rows = await query(
    `SELECT
       sc.*,
       s.name AS shop_name,
       s.slug AS shop_slug,
       s.avatar_url AS shop_avatar_url,
       cu.name AS customer_name,
       cu.avatar_url AS customer_avatar_url,
       p.name AS product_name,
       p.slug AS product_slug
     FROM shop_conversations sc
     JOIN shops s ON s.id = sc.shop_id
     JOIN users cu ON cu.id = sc.customer_id
     LEFT JOIN products p ON p.id = sc.product_id
     WHERE sc.id = ? AND (sc.customer_id = ? OR sc.seller_id = ?)
     LIMIT 1`,
    [conversationId, userId, userId],
  )

  return rows[0] || null
}

router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const rows = await query(
      `SELECT
         sc.*,
         s.name AS shop_name,
         s.slug AS shop_slug,
         s.avatar_url AS shop_avatar_url,
         cu.name AS customer_name,
         cu.avatar_url AS customer_avatar_url,
         p.name AS product_name,
         p.slug AS product_slug,
         lm.message AS last_message
       FROM shop_conversations sc
       JOIN shops s ON s.id = sc.shop_id
       JOIN users cu ON cu.id = sc.customer_id
       LEFT JOIN products p ON p.id = sc.product_id
       LEFT JOIN shop_messages lm ON lm.id = (
         SELECT sm.id
         FROM shop_messages sm
         WHERE sm.conversation_id = sc.id
         ORDER BY sm.created_at DESC, sm.id DESC
         LIMIT 1
       )
       WHERE sc.customer_id = ? OR sc.seller_id = ?
       ORDER BY COALESCE(sc.last_message_at, sc.updated_at, sc.created_at) DESC, sc.id DESC
       LIMIT 100`,
      [userId, userId],
    )

    res.json({ ok: true, data: rows.map(mapConversation) })
  }),
)

router.post(
  '/shops/:shopId/conversations',
  asyncHandler(async (req, res) => {
    const shopId = Number(req.params.shopId)
    const customerId = Number(req.user.sub)
    const productId = req.body?.productId ? Number(req.body.productId) : null
    const firstMessage = String(req.body?.message || '').trim()

    const shopRows = await query(
      `SELECT s.id, s.owner_id
       FROM shops s
       JOIN users u ON u.id = s.owner_id
       WHERE s.id = ? AND s.is_active = 1 AND u.is_active = 1 AND u.role = 'seller'
       LIMIT 1`,
      [shopId],
    )
    const shop = shopRows[0]

    if (!shop) return res.status(404).json({ ok: false, message: 'Không tìm thấy shop' })
    if (Number(shop.owner_id) === customerId) {
      return res.status(400).json({ ok: false, message: 'Bạn không thể chat với chính shop của mình' })
    }

    const result = await transaction(async (connection) => {
      let [conversationRows] = await connection.execute(
        'SELECT id FROM shop_conversations WHERE customer_id = ? AND shop_id = ? LIMIT 1',
        [customerId, shopId],
      )
      let conversationId = conversationRows[0]?.id

      if (!conversationId) {
        const [created] = await connection.execute(
          `INSERT INTO shop_conversations (shop_id, customer_id, seller_id, product_id, last_message_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [shopId, customerId, Number(shop.owner_id), productId],
        )
        conversationId = created.insertId
      } else if (productId) {
        await connection.execute('UPDATE shop_conversations SET product_id = ?, updated_at = NOW() WHERE id = ?', [
          productId,
          conversationId,
        ])
      }

      if (firstMessage) {
        await connection.execute(
          'INSERT INTO shop_messages (conversation_id, sender_id, message) VALUES (?, ?, ?)',
          [conversationId, customerId, firstMessage],
        )
        await connection.execute('UPDATE shop_conversations SET last_message_at = NOW() WHERE id = ?', [conversationId])
      }

      return conversationId
    })

    const conversation = await getConversationForUser(result, customerId)
    const messages = await query(
      `SELECT sm.*, u.name AS sender_name
       FROM shop_messages sm
       JOIN users u ON u.id = sm.sender_id
       WHERE sm.conversation_id = ?
       ORDER BY sm.created_at ASC, sm.id ASC
       LIMIT 100`,
      [result],
    )

    res.json({
      ok: true,
      data: {
        conversation: mapConversation(conversation),
        messages: messages.map((message) => mapMessage(message, customerId)),
      },
    })
  }),
)

router.get(
  '/conversations/:conversationId/messages',
  asyncHandler(async (req, res) => {
    const conversationId = Number(req.params.conversationId)
    const userId = Number(req.user.sub)
    const conversation = await getConversationForUser(conversationId, userId)

    if (!conversation) return res.status(404).json({ ok: false, message: 'Không tìm thấy cuộc trò chuyện' })

    const messages = await query(
      `SELECT sm.*, u.name AS sender_name
       FROM shop_messages sm
       JOIN users u ON u.id = sm.sender_id
       WHERE sm.conversation_id = ?
       ORDER BY sm.created_at ASC, sm.id ASC
       LIMIT 100`,
      [conversationId],
    )

    res.json({
      ok: true,
      data: {
        conversation: mapConversation(conversation),
        messages: messages.map((message) => mapMessage(message, userId)),
      },
    })
  }),
)

router.post(
  '/conversations/:conversationId/messages',
  asyncHandler(async (req, res) => {
    const conversationId = Number(req.params.conversationId)
    const userId = Number(req.user.sub)
    const message = String(req.body?.message || '').trim()
    const conversation = await getConversationForUser(conversationId, userId)

    if (!conversation) return res.status(404).json({ ok: false, message: 'Không tìm thấy cuộc trò chuyện' })
    if (!message) return res.status(400).json({ ok: false, message: 'Tin nhắn không được để trống' })
    if (message.length > 2000) return res.status(400).json({ ok: false, message: 'Tin nhắn quá dài' })

    const result = await query('INSERT INTO shop_messages (conversation_id, sender_id, message) VALUES (?, ?, ?)', [
      conversationId,
      userId,
      message,
    ])
    await query('UPDATE shop_conversations SET last_message_at = NOW() WHERE id = ?', [conversationId])

    const rows = await query(
      `SELECT sm.*, u.name AS sender_name
       FROM shop_messages sm
       JOIN users u ON u.id = sm.sender_id
       WHERE sm.id = ?
       LIMIT 1`,
      [result.insertId],
    )

    res.json({ ok: true, data: mapMessage(rows[0], userId) })
  }),
)

module.exports = router
