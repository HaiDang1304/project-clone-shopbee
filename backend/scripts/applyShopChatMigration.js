require('dotenv').config()

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
const { createMysqlOptions } = require('../src/config/mysql-options')

async function main() {
  const connection = await mysql.createConnection(createMysqlOptions({ multipleStatements: true, pool: false }))

  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '20260615_add_shop_chat.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')
  await connection.query(sql)

  const [tables] = await connection.query("SHOW TABLES LIKE 'shop_messages'")
  console.log(tables.length ? 'Created/verified shop chat tables.' : 'Shop chat tables were not found.')

  await connection.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
