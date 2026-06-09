USE shopbee_clone;

ALTER TABLE orders
  MODIFY status ENUM('payment_pending', 'pending', 'paid', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded', 'payment_expired') NOT NULL DEFAULT 'pending';

UPDATE orders SET payment_method = 'cod' WHERE payment_method NOT IN ('cod', 'bank');

ALTER TABLE orders
  MODIFY payment_method ENUM('cod', 'bank') NOT NULL DEFAULT 'cod',
  ADD COLUMN payment_provider VARCHAR(30) NULL AFTER payment_method,
  ADD COLUMN payment_link_id VARCHAR(120) NULL AFTER payment_provider,
  ADD COLUMN payment_checkout_url VARCHAR(600) NULL AFTER payment_link_id,
  ADD COLUMN payment_qr_code TEXT NULL AFTER payment_checkout_url,
  ADD COLUMN payment_expires_at DATETIME NULL AFTER payment_qr_code;

CREATE INDEX idx_orders_payment_expiry ON orders (status, payment_expires_at);
