USE shopbee_clone;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('order', 'review', 'system') NOT NULL DEFAULT 'system',
  title VARCHAR(180) NOT NULL,
  message VARCHAR(500) NOT NULL,
  action_url VARCHAR(500) NULL,
  order_id BIGINT UNSIGNED NULL,
  product_id BIGINT UNSIGNED NULL,
  metadata JSON NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user_read_created (user_id, read_at, created_at),
  KEY idx_notifications_order (order_id),
  KEY idx_notifications_product (product_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_notifications_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
