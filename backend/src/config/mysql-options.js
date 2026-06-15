function isEnabled(value) {
  return ['1', 'true', 'yes', 'required'].includes(String(value || '').toLowerCase())
}

function createMysqlOptions({ multipleStatements = false, pool = true } = {}) {
  const options = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shopbee_clone',
    decimalNumbers: true,
    timezone: 'Z',
  }

  if (pool) {
    options.waitForConnections = true
    options.connectionLimit = Number(process.env.DB_CONNECTION_LIMIT || 10)
    options.queueLimit = 0
  }

  if (multipleStatements) {
    options.multipleStatements = true
  }

  if (isEnabled(process.env.DB_SSL)) {
    options.ssl = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    }
  }

  return options
}

module.exports = {
  createMysqlOptions,
}
