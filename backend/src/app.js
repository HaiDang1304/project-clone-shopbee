const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/auth')
const accountRoutes = require('./routes/account/index')
const adminRoutes = require('./routes/admin')
const cartRoutes = require('./routes/cart')
const chatboxRoutes = require('./routes/chatbox')
const categoryRoutes = require('./routes/categories')
const orderRoutes = require('./routes/orders')
const productRoutes = require('./routes/products')
const shopChatRoutes = require('./routes/shop-chats')
const shopRoutes = require('./routes/shops')
const voucherRoutes = require('./routes/vouchers')
const { errorHandler, notFoundHandler } = require('./middleware/error')

function parseCorsOrigin() {
  const origin = process.env.CORS_ORIGIN || '*'
  if (origin === '*') return '*'
  return origin.split(',').map((item) => item.trim()).filter(Boolean)
}

function createApp() {
  const app = express()
  const corsOrigin = parseCorsOrigin()

  app.use(
    cors({
      origin: corsOrigin,
      credentials: corsOrigin !== '*',
    }),
  )
  app.use(express.json({ limit: '64mb' }))
  app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')))

  app.get('/api/health', (req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/account', accountRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/chatbox', chatboxRoutes)
  app.use('/api/categories', categoryRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/cart', cartRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/vouchers', voucherRoutes)
  app.use('/api/shops', shopRoutes)
  app.use('/api/shop-chats', shopChatRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

module.exports = { createApp }
