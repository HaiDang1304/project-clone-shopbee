const common = require('./context/common')
const uploads = require('./context/uploads')
const profile = require('./context/profile')
const addresses = require('./context/addresses')
const locations = require('./context/locations')
const shop = require('./context/shop')
const sellerproducts = require('./context/seller-products')
const sellerorders = require('./context/seller-orders')
const sellerdashboard = require('./context/seller-dashboard')
const orders = require('./context/orders')
const notifications = require('./context/notifications')

module.exports = {
  ...common,
  ...uploads,
  ...profile,
  ...addresses,
  ...locations,
  ...shop,
  ...sellerproducts,
  ...sellerorders,
  ...sellerdashboard,
  ...orders,
  ...notifications,
}
