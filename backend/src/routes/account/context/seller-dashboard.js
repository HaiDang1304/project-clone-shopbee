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
         COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled', 'refunded') THEN oi.line_total ELSE 0 END), 0) AS totalRevenue,
         COALESCE(SUM(CASE WHEN o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                           AND o.status NOT IN ('cancelled', 'refunded') THEN oi.line_total ELSE 0 END), 0) AS monthlyRevenue,
         COALESCE(SUM(CASE WHEN o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                           AND o.status = 'delivered' THEN oi.line_total ELSE 0 END), 0) AS monthlyDeliveredRevenue,
         COUNT(DISTINCT oi.order_id) AS orderCount,
         COUNT(DISTINCT CASE WHEN o.status IN ('pending', 'paid') THEN oi.order_id END) AS pendingOrders
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.shop_id = ?`,
      [shop.id],
    ),
    query(
      `SELECT DATE(o.created_at) AS date_key,
              COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled', 'refunded') THEN oi.line_total ELSE 0 END), 0) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.shop_id = ?
         AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(o.created_at)
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
      monthlyPlatformFee: Math.round(Number(stats.monthlyDeliveredRevenue || 0) * platformFeeRate),
      monthlyPayout: Math.max(
        0,
        Number(stats.monthlyDeliveredRevenue || 0) - Math.round(Number(stats.monthlyDeliveredRevenue || 0) * platformFeeRate),
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
