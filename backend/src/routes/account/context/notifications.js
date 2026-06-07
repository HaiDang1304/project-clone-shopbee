const { safeParseJson } = require('./common')

function toNotification(row) {
  return {
    id: Number(row.id),
    type: row.type,
    title: row.title,
    message: row.message,
    actionUrl: row.actionUrl || '',
    orderId: row.orderId == null ? null : Number(row.orderId),
    productId: row.productId == null ? null : Number(row.productId),
    metadata: safeParseJson(row.metadata, {}) || {},
    readAt: row.readAt || null,
    isRead: Boolean(row.readAt),
    createdAt: row.createdAt,
  }
}

module.exports = {
  toNotification,
}
