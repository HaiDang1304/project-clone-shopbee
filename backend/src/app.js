const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/auth')
const accountRoutes = require('./routes/account')
const cartRoutes = require('./routes/cart')
const categoryRoutes = require('./routes/categories')
const productRoutes = require('./routes/products')
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
  app.use(express.json({ limit: '16mb' }))
  app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')))

  app.get('/api/health', (req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/account', accountRoutes)
  app.use('/api/categories', categoryRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/cart', cartRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

module.exports = { createApp }
