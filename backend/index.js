const dotenv = require('dotenv')

dotenv.config()

const { createApp } = require('./src/app')
const { testConnection } = require('./src/config/db')

const port = Number(process.env.PORT || 5000)
const app = createApp()

async function start() {
  await testConnection()

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`)
  })
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend:', err)
  process.exit(1)
})
