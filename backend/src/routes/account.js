const express = require('express')

const { requireAuth } = require('../middleware/auth')
const context = require('./account/context')
const registerProfileRoutes = require('./account/profile.routes')
const registerSellerRoutes = require('./account/seller.routes')
const registerAddressRoutes = require('./account/addresses.routes')
const registerPaymentRoutes = require('./account/payments.routes')
const registerNotificationRoutes = require('./account/notifications.routes')
const registerOrderRoutes = require('./account/orders.routes')
const registerPasswordRoutes = require('./account/password.routes')

const router = express.Router()

router.use(requireAuth)

registerProfileRoutes(router, context)
registerSellerRoutes(router, context)
registerAddressRoutes(router, context)
registerPaymentRoutes(router, context)
registerNotificationRoutes(router, context)
registerOrderRoutes(router, context)
registerPasswordRoutes(router, context)

module.exports = router
