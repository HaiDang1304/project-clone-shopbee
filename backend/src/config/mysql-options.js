function isEnabled(value) {
  return ['1', 'true', 'yes', 'required'].includes(String(value || '').toLowerCase())
}

function getSslCa() {
  if (process.env.DB_SSL_CA_BASE64) {
    return Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64').toString('utf8')
  }

  if (process.env.DB_SSL_CA) {
    return process.env.DB_SSL_CA.replace(/\\n/g, '\n')
  }

  return undefined
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
    const ssl = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    }
    const ca = getSslCa()

    if (ca) {
      ssl.ca = ca
    }

    options.ssl = ssl
  }

  return options
}

module.exports = {
  createMysqlOptions,
}
