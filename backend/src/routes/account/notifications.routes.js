function registerNotificationRoutes(router, context) {
  const {
    query,
    asyncHandler,
    toPositiveId,
    toNotification,
  } = context

  router.get(
    '/notifications',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const [notifications, unreadRows] = await Promise.all([
        query(
          `SELECT
             id,
             type,
             title,
             message,
             action_url AS actionUrl,
             order_id AS orderId,
             product_id AS productId,
             metadata,
             read_at AS readAt,
             created_at AS createdAt
           FROM notifications
           WHERE user_id = ?
           ORDER BY created_at DESC, id DESC
           LIMIT 40`,
          [userId],
        ),
        query('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL', [userId]),
      ])

      return res.json({
        ok: true,
        data: {
          items: notifications.map(toNotification),
          unreadCount: Number(unreadRows[0]?.count || 0),
        },
      })
    }),
  )

  router.patch(
    '/notifications/read-all',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      await query('UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE user_id = ?', [userId])
      return res.json({ ok: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc.' })
    }),
  )

  router.patch(
    '/notifications/:notificationId/read',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const notificationId = toPositiveId(req.params.notificationId)

      if (!notificationId) {
        return res.status(400).json({ ok: false, message: 'Thông báo không hợp lệ' })
      }

      const result = await query(
        'UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = ? AND user_id = ?',
        [notificationId, userId],
      )

      if (!result.affectedRows) return res.status(404).json({ ok: false, message: 'Không tìm thấy thông báo' })
      return res.json({ ok: true, message: 'Đã đọc thông báo.' })
    }),
  )
}

module.exports = registerNotificationRoutes
