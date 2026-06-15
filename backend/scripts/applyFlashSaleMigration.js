require('dotenv').config()

const mysql = require('mysql2/promise')
const { createMysqlOptions } = require('../src/config/mysql-options')

async function main() {
  const connection = await mysql.createConnection(createMysqlOptions({ multipleStatements: true, pool: false }))

  const [columns] = await connection.query("SHOW COLUMNS FROM products LIKE 'flash_sale_price'")
  if (!columns.length) {
    await connection.query('ALTER TABLE products ADD COLUMN flash_sale_price DECIMAL(12,2) NULL AFTER product_options')
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS flash_sale_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(160) NOT NULL,
      description TEXT NULL,
      starts_at DATETIME NOT NULL,
      ends_at DATETIME NOT NULL,
      registration_starts_at DATETIME NULL,
      registration_ends_at DATETIME NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_flash_sale_events_time (is_active, starts_at, ends_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS flash_sale_registrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      event_id BIGINT UNSIGNED NOT NULL,
      shop_id BIGINT UNSIGNED NOT NULL,
      product_id BIGINT UNSIGNED NOT NULL,
      sale_price DECIMAL(12,2) NOT NULL,
      registered_stock INT UNSIGNED NOT NULL,
      sold_count INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
      reject_reason VARCHAR(500) NULL,
      reviewed_by BIGINT UNSIGNED NULL,
      reviewed_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_flash_sale_registration (event_id, product_id),
      KEY idx_flash_sale_registrations_shop (shop_id, status),
      KEY idx_flash_sale_registrations_status (status, created_at),
      CONSTRAINT fk_flash_sale_registrations_event FOREIGN KEY (event_id) REFERENCES flash_sale_events(id) ON DELETE CASCADE,
      CONSTRAINT fk_flash_sale_registrations_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
      CONSTRAINT fk_flash_sale_registrations_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_flash_sale_registrations_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  const [tables] = await connection.query("SHOW TABLES LIKE 'flash_sale%'")
  console.log(tables)
  await connection.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
