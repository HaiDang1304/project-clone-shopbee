const mysql = require('mysql2/promise')

let pool

function getPool() {
  if (pool) return pool

  pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'thuongmaidientu',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    decimalNumbers: true,
    timezone: 'Z',
  })

  return pool
}

async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params)
  return rows
}

async function transaction(callback) {
  const connection = await getPool().getConnection()

  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

async function testConnection() {
  const connection = await getPool().getConnection()
  try {
    await connection.ping()
  } finally {
    connection.release()
  }
}

module.exports = {
  getPool,
  query,
  testConnection,
  transaction,
}
