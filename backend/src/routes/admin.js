const express = require('express')

const { requireAuth, requireRole } = require('../middleware/auth')
const context = require('./admin/context')
const registerDashboardRoutes = require('./admin/dashboard.routes')
const registerUserRoutes = require('./admin/users.routes')
const registerShopRoutes = require('./admin/shops.routes')
const registerCategoryRoutes = require('./admin/categories.routes')
const registerCommentRoutes = require('./admin/comments.routes')
const registerApplicationRoutes = require('./admin/applications.routes')

const router = express.Router()

router.use(requireAuth, requireRole('admin'))

registerDashboardRoutes(router, context)
registerUserRoutes(router, context)
registerShopRoutes(router, context)
registerCategoryRoutes(router, context)
registerCommentRoutes(router, context)
registerApplicationRoutes(router, context)

module.exports = router
