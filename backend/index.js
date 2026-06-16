const dotenv = require('dotenv')
const http = require('http')

dotenv.config()

const { createApp } = require('./src/app')
const { testConnection } = require('./src/config/db')
const { initShopChatSocket } = require('./src/socket/shop-chat.socket')

const port = Number(process.env.PORT || 5000)
const app = createApp()
const server = http.createServer(app)

function parseCorsOrigin() {
  const origin = process.env.CORS_ORIGIN || '*'
  if (origin === '*') return '*'
  return origin.split(',').map((item) => item.trim()).filter(Boolean)
}

async function start() {
  await testConnection()
  initShopChatSocket(server, {
    origin: parseCorsOrigin(),
    credentials: process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*',
  })

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`)
  })
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend:', err)
  process.exit(1)
})
