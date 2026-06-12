CREATE TABLE IF NOT EXISTS vouchers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  scope ENUM('platform', 'shop') NOT NULL DEFAULT 'platform',
  shop_id BIGINT UNSIGNED NULL,
  discount_type ENUM('percent', 'fixed', 'free_shipping') NOT NULL DEFAULT 'fixed',
  discount_value DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_discount_amount DECIMAL(12,2) NULL,
  min_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  usage_limit INT UNSIGNED NULL,
  per_user_limit INT UNSIGNED NULL,
  used_count INT UNSIGNED NOT NULL DEFAULT 0,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vouchers_code (code),
  KEY idx_vouchers_scope (scope, shop_id),
  KEY idx_vouchers_active_time (is_active, starts_at, ends_at),
  CONSTRAINT fk_vouchers_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  voucher_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_voucher_redemptions_order (voucher_id, order_id),
  KEY idx_voucher_redemptions_user (voucher_id, user_id),
  CONSTRAINT fk_voucher_redemptions_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
  CONSTRAINT fk_voucher_redemptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_voucher_redemptions_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
