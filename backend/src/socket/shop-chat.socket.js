const jwt = require('jsonwebtoken')
const { Server } = require('socket.io')

const { query } = require('../config/db')

const mysqlDateTimeFormat = '%Y-%m-%dT%H:%i:%s'

function userRoom(userId) {
  return `user:${userId}`
}

function conversationRoom(conversationId) {
  return `shop-conversation:${conversationId}`
}

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

async function readActiveUser(token) {
  if (!token) return null
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('Missing JWT_SECRET in environment')

  const decoded = jwt.verify(token, secret)
  const rows = await query('SELECT id, role, is_active FROM users WHERE id = ? LIMIT 1', [Number(decoded.sub)])
  const user = rows[0]
  if (!user || !Number(user.is_active)) return null

  return {
    ...decoded,
    sub: String(user.id),
    role: user.role,
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
       p.slug AS product_slug,
       lm.message AS last_message,
       DATE_FORMAT(sc.last_message_at, '${mysqlDateTimeFormat}') AS last_message_at
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
     WHERE sc.id = ? AND (sc.customer_id = ? OR sc.seller_id = ?)
     LIMIT 1`,
    [conversationId, userId, userId],
  )

  return rows[0] || null
}

async function readMessage(messageId, userId) {
  const rows = await query(
    `SELECT sm.*, u.name AS sender_name, DATE_FORMAT(sm.created_at, '${mysqlDateTimeFormat}') AS created_at
     FROM shop_messages sm
     JOIN users u ON u.id = sm.sender_id
     WHERE sm.id = ?
     LIMIT 1`,
    [messageId],
  )

  return rows[0] ? mapMessage(rows[0], userId) : null
}

function emitConversationUpdate(io, conversation, message) {
  const payload = {
    conversation,
    message,
  }

  io.to(userRoom(conversation.customerId)).emit('shop-chat:conversation-updated', payload)
  io.to(userRoom(conversation.sellerId)).emit('shop-chat:conversation-updated', payload)
}

function initShopChatSocket(server, corsOptions = {}) {
  const io = new Server(server, {
    cors: corsOptions,
  })

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        String(socket.handshake.headers.authorization || '').replace(/^Bearer\s+/i, '')
      const user = await readActiveUser(token)
      if (!user) return next(new Error('Cần đăng nhập'))

      socket.user = user
      socket.join(userRoom(user.sub))
      return next()
    } catch {
      return next(new Error('Token không hợp lệ hoặc đã hết hạn'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('shop-chat:join', async (payload = {}, ack) => {
      try {
        const conversationId = Number(payload.conversationId)
        const userId = Number(socket.user.sub)
        const conversation = await getConversationForUser(conversationId, userId)
        if (!conversation) throw new Error('Không tìm thấy cuộc trò chuyện')

        socket.join(conversationRoom(conversationId))
        ack?.({ ok: true, data: { conversation: mapConversation(conversation) } })
      } catch (err) {
        ack?.({ ok: false, message: err.message || 'Không thể tham gia cuộc trò chuyện' })
      }
    })

    socket.on('shop-chat:leave', (payload = {}) => {
      const conversationId = Number(payload.conversationId)
      if (Number.isSafeInteger(conversationId) && conversationId > 0) {
        socket.leave(conversationRoom(conversationId))
      }
    })

    socket.on('shop-chat:send', async (payload = {}, ack) => {
      try {
        const conversationId = Number(payload.conversationId)
        const userId = Number(socket.user.sub)
        const messageText = String(payload.message || '').trim()
        const conversationRow = await getConversationForUser(conversationId, userId)

        if (!conversationRow) throw new Error('Không tìm thấy cuộc trò chuyện')
        if (!messageText) throw new Error('Tin nhắn không được để trống')
        if (messageText.length > 2000) throw new Error('Tin nhắn quá dài')

        const result = await query('INSERT INTO shop_messages (conversation_id, sender_id, message) VALUES (?, ?, ?)', [
          conversationId,
          userId,
          messageText,
        ])
        await query('UPDATE shop_conversations SET last_message_at = NOW() WHERE id = ?', [conversationId])

        const [message, nextConversationRow] = await Promise.all([
          readMessage(result.insertId, userId),
          getConversationForUser(conversationId, userId),
        ])
        const conversation = mapConversation(nextConversationRow || conversationRow)

        io.to(conversationRoom(conversationId)).emit('shop-chat:message', {
          conversationId,
          message,
          conversation,
        })
        emitConversationUpdate(io, conversation, message)

        ack?.({ ok: true, data: { message, conversation } })
      } catch (err) {
        ack?.({ ok: false, message: err.message || 'Không gửi được tin nhắn' })
      }
    })
  })

  return io
}

module.exports = { initShopChatSocket }
