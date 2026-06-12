require('dotenv').config()

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shopbee_clone',
    multipleStatements: true,
  })

  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '20260612_add_user_vouchers.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')
  await connection.query(sql)

  const [tables] = await connection.query("SHOW TABLES LIKE 'user_vouchers'")
  console.log(tables.length ? 'Created/verified table user_vouchers.' : 'Table user_vouchers was not found.')

  await connection.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
