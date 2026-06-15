require('dotenv').config()

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
const { createMysqlOptions } = require('../src/config/mysql-options')

async function main() {
  const connection = await mysql.createConnection(createMysqlOptions({ multipleStatements: true, pool: false }))

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
