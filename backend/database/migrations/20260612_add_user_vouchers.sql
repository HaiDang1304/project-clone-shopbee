CREATE TABLE IF NOT EXISTS user_vouchers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  voucher_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  claimed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_vouchers_user_voucher (user_id, voucher_id),
  KEY idx_user_vouchers_voucher (voucher_id),
  CONSTRAINT fk_user_vouchers_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_vouchers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
