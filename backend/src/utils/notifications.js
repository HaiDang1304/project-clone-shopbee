const { query } = require('../config/db')

async function createNotification({
  connection = null,
  userId,
  type = 'system',
  title,
  message,
  actionUrl = '',
  orderId = null,
  productId = null,
  metadata = null,
}) {
  if (!userId || !title || !message) return null

  const params = [
    userId,
    type,
    title,
    message,
    actionUrl || null,
    orderId || null,
    productId || null,
    metadata ? JSON.stringify(metadata) : null,
  ]

  const sql = `INSERT INTO notifications
     (user_id, type, title, message, action_url, order_id, product_id, metadata)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

  if (connection) {
    const [result] = await connection.execute(sql, params)
    return result.insertId
  }

  await query(sql, params)
  return null
}

module.exports = {
  createNotification,
}
