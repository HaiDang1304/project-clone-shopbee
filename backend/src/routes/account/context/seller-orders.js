const { query } = require('./common')

function toSellerOrder(row) {
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
    itemCount: Number(row.item_count || 0),
    shopTotal: Number(row.shop_total || 0),
    orderTotal: Number(row.grand_total || 0),
    productNames: row.product_names || '',
  }
}

async function readSellerOrders(shopId) {
  const rows = await query(
    `SELECT o.id, o.status, o.payment_method, o.grand_total, o.created_at, o.updated_at,
            o.shipping_full_name, o.shipping_phone, o.shipping_line1, o.shipping_ward,
            o.shipping_province, o.shipping_country,
            u.name AS customer_name, u.email AS customer_email,
            SUM(oi.quantity) AS item_count,
            COALESCE(SUM(oi.line_total), 0) AS shop_total,
            GROUP_CONCAT(oi.name ORDER BY oi.id SEPARATOR ', ') AS product_names
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN users u ON u.id = o.user_id
     WHERE oi.shop_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT 100`,
    [shopId],
  )

  return rows.map(toSellerOrder)
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
