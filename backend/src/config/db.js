const mysql = require('mysql2/promise')
const { createMysqlOptions } = require('./mysql-options')

let pool

function getPool() {
  if (pool) return pool

  pool = mysql.createPool(createMysqlOptions())

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
