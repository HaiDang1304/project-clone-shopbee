function registerOrderRoutes(router, context) {
  const {
    query,
    transaction,
    asyncHandler,
    throwStatus,
    toPositiveId,
    normalizeSelectedOptions,
    toOrder,
    toReview,
  } = context

  router.get(
    '/orders',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const orders = await query(
        `SELECT
           id,
           status,
           items_total AS itemsTotal,
           shipping_fee AS shippingFee,
           discount_total AS discountTotal,
           grand_total AS grandTotal,
           payment_method AS paymentMethod,
           paid_at AS paidAt,
           shipping_full_name AS shippingFullName,
           shipping_phone AS shippingPhone,
           shipping_line1 AS shippingLine1,
           shipping_ward AS shippingWard,
           shipping_province AS shippingProvince,
           shipping_country AS shippingCountry,
           shipping_postal_code AS shippingPostalCode,
           note,
           created_at AS createdAt,
           updated_at AS updatedAt
         FROM orders
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId],
      )

      if (!orders.length) return res.json({ ok: true, data: [] })

      const orderIds = orders.map((order) => Number(order.id))
      const placeholders = orderIds.map(() => '?').join(', ')
      const items = await query(
        `SELECT
           oi.id,
           oi.order_id AS orderId,
           oi.product_id AS productId,
           oi.shop_id AS shopId,
           s.name AS shopName,
           oi.name,
           oi.image_url AS imageUrl,
           oi.selected_options AS selectedOptions,
           oi.unit_price AS unitPrice,
           oi.quantity,
           oi.line_total AS lineTotal
         FROM order_items oi
         LEFT JOIN shops s ON s.id = oi.shop_id
         WHERE oi.order_id IN (${placeholders})
         ORDER BY oi.id ASC`,
        orderIds,
      )

      const itemsByOrder = new Map()
      items.forEach((item) => {
        const orderItems = itemsByOrder.get(Number(item.orderId)) || []
        orderItems.push({
          id: item.id,
          productId: item.productId,
          shopId: item.shopId,
          shopName: item.shopName || '',
          name: item.name,
          imageUrl: item.imageUrl || '',
          variantId: null,
          variantSku: '',
          selectedOptions: normalizeSelectedOptions(item.selectedOptions),
          unitPrice: Number(item.unitPrice || 0),
          quantity: Number(item.quantity || 0),
          lineTotal: Number(item.lineTotal || 0),
        })
        itemsByOrder.set(Number(item.orderId), orderItems)
      })

      return res.json({
        ok: true,
        data: orders.map((order) => toOrder(order, itemsByOrder.get(Number(order.id)) || [])),
      })
    }),
  )

  router.post(
    '/reviews',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const orderId = toPositiveId(req.body?.orderId)
      const productId = toPositiveId(req.body?.productId)
      const rating = Number(req.body?.rating)
      const comment = String(req.body?.comment || '').trim()

      if (!orderId) return res.status(400).json({ ok: false, message: 'Đơn hàng không hợp lệ' })
      if (!productId) return res.status(400).json({ ok: false, message: 'Sản phẩm không hợp lệ' })
      if (!Number.isSafeInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ ok: false, message: 'Vui lòng chọn số sao từ 1 đến 5' })
      }
      if (comment.length > 1000) {
        return res.status(400).json({ ok: false, message: 'Góp ý tối đa 1000 ký tự' })
      }

      const review = await transaction(async (connection) => {
        const [orderRows] = await connection.execute(
          `SELECT o.id, o.status, oi.product_id AS productId, p.shop_id AS shopId
           FROM orders o
           JOIN order_items oi ON oi.order_id = o.id
           JOIN products p ON p.id = oi.product_id
           WHERE o.id = ? AND o.user_id = ? AND oi.product_id = ?
           LIMIT 1`,
          [orderId, userId, productId],
        )
        const order = orderRows[0]

        if (!order) throwStatus('Không tìm thấy sản phẩm trong đơn hàng của bạn', 404)
        if (order.status !== 'delivered') {
          throwStatus('Bạn chỉ có thể đánh giá sau khi đơn hàng đã giao thành công')
        }

        await connection.execute(
          `INSERT INTO reviews (product_id, user_id, order_id, rating, comment, is_visible)
           VALUES (?, ?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE
             order_id = VALUES(order_id),
             rating = VALUES(rating),
             comment = VALUES(comment),
             is_visible = 1,
             updated_at = NOW()`,
          [productId, userId, orderId, rating, comment || null],
        )

        await connection.execute(
          `UPDATE products p
           SET rating_avg = COALESCE((
                 SELECT ROUND(AVG(r.rating), 2)
                 FROM reviews r
                 WHERE r.product_id = p.id AND r.is_visible = 1
               ), 0),
               rating_count = (
                 SELECT COUNT(*)
                 FROM reviews r
                 WHERE r.product_id = p.id AND r.is_visible = 1
               ),
               updated_at = NOW()
           WHERE p.id = ?`,
          [productId],
        )

        await connection.execute(
          `UPDATE shops s
           SET rating_avg = COALESCE((
                 SELECT ROUND(AVG(r.rating), 2)
                 FROM reviews r
                 JOIN products p ON p.id = r.product_id
                 WHERE p.shop_id = s.id AND r.is_visible = 1
               ), 0),
               rating_count = (
                 SELECT COUNT(*)
                 FROM reviews r
                 JOIN products p ON p.id = r.product_id
                 WHERE p.shop_id = s.id AND r.is_visible = 1
               ),
               updated_at = NOW()
           WHERE s.id = ?`,
          [order.shopId],
        )

        const [reviewRows] = await connection.execute(
          `SELECT r.id, r.product_id, r.user_id, r.order_id, r.rating, r.comment,
                  r.created_at, r.updated_at, u.name AS user_name
           FROM reviews r
           JOIN users u ON u.id = r.user_id
           WHERE r.product_id = ? AND r.user_id = ?
           LIMIT 1`,
          [productId, userId],
        )

        return toReview(reviewRows[0])
      })

      return res.status(201).json({ ok: true, data: review, message: 'Đã lưu đánh giá của bạn.' })
    }),
  )
}

module.exports = registerOrderRoutes
