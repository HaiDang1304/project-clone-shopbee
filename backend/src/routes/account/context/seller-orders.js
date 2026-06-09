const { normalizeSelectedOptions, query } = require('./common')

function toSellerOrder(row, items = []) {
  return {
    id: row.id,
    code: `SB-${String(row.id).padStart(4, '0')}`,
    status: row.status,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customer: {
      name: row.customer_name || row.shipping_full_name,
      email: row.customer_email || '',
      phone: row.shipping_phone || '',
    },
    shipping: {
      fullName: row.shipping_full_name,
      phone: row.shipping_phone,
      line1: row.shipping_line1,
      ward: row.shipping_ward || '',
      province: row.shipping_province,
      country: row.shipping_country,
    },
    note: row.note || '',
    itemCount: Number(row.item_count || 0),
    shopSubtotal: Number(row.shop_subtotal || row.shop_total || 0),
    shopShippingFee: Number(row.shop_shipping_fee || 0),
    shopTotal: Number(row.shop_total || row.shop_subtotal || 0),
    orderTotal: Number(row.grand_total || 0),
    productNames: row.product_names || '',
    items,
  }
}

async function readSellerOrders(shopId) {
  const rows = await query(
    `SELECT o.id, o.status, o.payment_method, o.grand_total, o.note, o.created_at, o.updated_at,
            o.shipping_full_name, o.shipping_phone, o.shipping_line1, o.shipping_ward,
            o.shipping_province, o.shipping_country,
            u.name AS customer_name, u.email AS customer_email,
            SUM(oi.quantity) AS item_count,
            COALESCE(SUM(oi.line_total), 0) AS item_line_total,
            COALESCE(MAX(os.shop_subtotal), SUM(oi.line_total), 0) AS shop_subtotal,
            COALESCE(MAX(os.shipping_fee), 0) AS shop_shipping_fee,
            COALESCE(MAX(os.shop_total), SUM(oi.line_total), 0) AS shop_total,
            GROUP_CONCAT(oi.name ORDER BY oi.id SEPARATOR ', ') AS product_names
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN users u ON u.id = o.user_id
     LEFT JOIN order_shops os ON os.order_id = o.id AND os.shop_id = oi.shop_id
     WHERE oi.shop_id = ? AND o.status NOT IN ('payment_pending', 'payment_expired')
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT 100`,
    [shopId],
  )

  if (!rows.length) return []

  const orderIds = rows.map((row) => Number(row.id)).filter(Boolean)
  const placeholders = orderIds.map(() => '?').join(', ')
  const itemRows = await query(
    `SELECT oi.id, oi.order_id, oi.product_id, oi.name,
            COALESCE(oi.image_url, p.thumbnail_url, '') AS image_url,
            oi.selected_options, oi.unit_price, oi.quantity, oi.line_total
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.shop_id = ? AND oi.order_id IN (${placeholders})
     ORDER BY oi.order_id DESC, oi.id ASC`,
    [shopId, ...orderIds],
  )

  const itemsByOrder = new Map()
  itemRows.forEach((item) => {
    const orderItems = itemsByOrder.get(Number(item.order_id)) || []
    orderItems.push({
      id: Number(item.id),
      productId: Number(item.product_id),
      name: item.name || '',
      imageUrl: item.image_url || '',
      selectedOptions: normalizeSelectedOptions(item.selected_options),
      unitPrice: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 0),
      lineTotal: Number(item.line_total || 0),
    })
    itemsByOrder.set(Number(item.order_id), orderItems)
  })

  return rows.map((row) => toSellerOrder(row, itemsByOrder.get(Number(row.id)) || []))
}

async function readOrderReviewProducts(connection, orderId, shopId) {
  const [rows] = await connection.execute(
    `SELECT
       oi.product_id AS productId,
       MAX(oi.name) AS name,
       MAX(oi.image_url) AS imageUrl,
       MAX(s.name) AS shopName,
       SUM(oi.quantity) AS quantity
     FROM order_items oi
     LEFT JOIN shops s ON s.id = oi.shop_id
     WHERE oi.order_id = ? AND oi.shop_id = ?
     GROUP BY oi.product_id
     ORDER BY MIN(oi.id) ASC`,
    [orderId, shopId],
  )

  return rows.map((row) => ({
    productId: Number(row.productId),
    name: row.name || '',
    imageUrl: row.imageUrl || '',
    shopName: row.shopName || '',
    quantity: Number(row.quantity || 0),
  }))
}

module.exports = {
  toSellerOrder,
  readSellerOrders,
  readOrderReviewProducts,
}
