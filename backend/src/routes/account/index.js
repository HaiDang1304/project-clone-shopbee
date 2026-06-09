const express = require('express')

const { requireAuth } = require('../../middleware/auth')
const context = require('./context')
const registerAddressRoutes = require('./addresses.routes')
const registerNotificationRoutes = require('./notifications.routes')
const registerOrderRoutes = require('./orders.routes')
const registerPasswordRoutes = require('./password.routes')
const registerPaymentRoutes = require('./payments.routes')
const registerProfileRoutes = require('./profile.routes')
const registerSellerRoutes = require('./seller.routes')

const router = express.Router()

router.use(requireAuth)

registerProfileRoutes(router, context)
registerAddressRoutes(router, context)
registerPaymentRoutes(router, context)
registerOrderRoutes(router, context)
registerPasswordRoutes(router, context)
registerSellerRoutes(router, context)
registerNotificationRoutes(router, context)

module.exports = router
