const { addDays, formatDateKey, formatTrendLabel, platformFeeRate, query } = require('./common')
const { readSellerShop } = require('./shop')
const { readSellerProducts } = require('./seller-products')
const { readSellerOrders } = require('./seller-orders')

async function readSellerDashboard(userId) {
  const shop = await readSellerShop(userId)

  if (!shop) {
    const err = new Error('Cửa hàng chưa được admin duyệt')
    err.status = 403
    throw err
  }

  const [products, orders, statRows, trendRows] = await Promise.all([
    readSellerProducts(userId),
    readSellerOrders(shop.id),
    query(
      `SELECT
         COALESCE(SUM(CASE WHEN seller_orders.status NOT IN ('cancelled', 'refunded') THEN seller_orders.shop_total ELSE 0 END), 0) AS totalRevenue,
         COALESCE(SUM(CASE WHEN seller_orders.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                           AND seller_orders.status NOT IN ('cancelled', 'refunded') THEN seller_orders.shop_total ELSE 0 END), 0) AS monthlyRevenue,
         COALESCE(SUM(CASE WHEN seller_orders.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                           AND seller_orders.status = 'delivered' THEN seller_orders.shop_total ELSE 0 END), 0) AS monthlyDeliveredRevenue,
         COALESCE(SUM(CASE WHEN seller_orders.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                           AND seller_orders.status = 'delivered' THEN seller_orders.shop_subtotal ELSE 0 END), 0) AS monthlyDeliveredProductRevenue,
         COUNT(*) AS orderCount,
         COUNT(CASE WHEN seller_orders.status IN ('pending', 'paid') THEN 1 END) AS pendingOrders
       FROM (
         SELECT o.id, o.status, o.created_at,
                COALESCE(MAX(os.shop_subtotal), SUM(oi.line_total), 0) AS shop_subtotal,
                COALESCE(MAX(os.shop_total), SUM(oi.line_total), 0) AS shop_total
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN order_shops os ON os.order_id = o.id AND os.shop_id = oi.shop_id
         WHERE oi.shop_id = ? AND o.status NOT IN ('payment_pending', 'payment_expired')
         GROUP BY o.id, o.status, o.created_at
       ) seller_orders`,
      [shop.id],
    ),
    query(
      `SELECT DATE(seller_orders.created_at) AS date_key,
              COALESCE(SUM(CASE WHEN seller_orders.status NOT IN ('cancelled', 'refunded') THEN seller_orders.shop_total ELSE 0 END), 0) AS revenue
       FROM (
         SELECT o.id, o.status, o.created_at,
                COALESCE(MAX(os.shop_total), SUM(oi.line_total), 0) AS shop_total
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN order_shops os ON os.order_id = o.id AND os.shop_id = oi.shop_id
         WHERE oi.shop_id = ? AND o.status NOT IN ('payment_pending', 'payment_expired')
           AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY o.id, o.status, o.created_at
       ) seller_orders
       GROUP BY DATE(seller_orders.created_at)
       ORDER BY date_key ASC`,
      [shop.id],
    ),
  ])
  const stats = statRows[0] || {}
  const trendByDate = new Map(trendRows.map((row) => [formatDateKey(row.date_key), Number(row.revenue || 0)]))
  const today = new Date()
  const startDate = addDays(today, -6)
  const revenueTrend = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startDate, index)
    const dateKey = formatDateKey(date)

    return {
      day: formatTrendLabel(date, index),
      date: dateKey,
      value: trendByDate.get(dateKey) || 0,
    }
  })

  return {
    shop,
    stats: {
      totalRevenue: Number(stats.totalRevenue || 0),
      monthlyRevenue: Number(stats.monthlyRevenue || 0),
      monthlyDeliveredRevenue: Number(stats.monthlyDeliveredRevenue || 0),
      monthlyPlatformFee: Math.round(Number(stats.monthlyDeliveredProductRevenue || 0) * platformFeeRate),
      monthlyPayout: Math.max(
        0,
        Number(stats.monthlyDeliveredRevenue || 0) - Math.round(Number(stats.monthlyDeliveredProductRevenue || 0) * platformFeeRate),
      ),
      platformFeeRate,
      orderCount: Number(stats.orderCount || 0),
      pendingOrders: Number(stats.pendingOrders || 0),
      productCount: products.length,
      activeProducts: products.filter((product) => product.isActive).length,
      outOfStockProducts: products.filter((product) => Number(product.stock || 0) <= 0).length,
    },
    revenueTrend,
    products,
    orders,
  }
}

module.exports = {
  readSellerDashboard,
}
