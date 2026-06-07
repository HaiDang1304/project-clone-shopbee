USE shopbee_clone;

CREATE TABLE IF NOT EXISTS provinces (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  region ENUM('BAC', 'TRUNG', 'NAM') NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_provinces_name (name),
  KEY idx_provinces_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS districts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  province_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_districts_province_name (province_id, name),
  KEY idx_districts_province (province_id),
  CONSTRAINT fk_districts_province FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wards (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  district_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  zone_type ENUM('NORMAL', 'REMOTE') NOT NULL DEFAULT 'NORMAL',
  PRIMARY KEY (id),
  UNIQUE KEY uq_wards_district_name (district_id, name),
  KEY idx_wards_district (district_id),
  KEY idx_wards_zone (zone_type),
  CONSTRAINT fk_wards_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @add_user_province_id := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE user_addresses ADD COLUMN province_id BIGINT UNSIGNED NULL AFTER line2', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_addresses' AND COLUMN_NAME = 'province_id'
);
PREPARE stmt FROM @add_user_province_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_user_district_id := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE user_addresses ADD COLUMN district_id BIGINT UNSIGNED NULL AFTER province_id', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_addresses' AND COLUMN_NAME = 'district_id'
);
PREPARE stmt FROM @add_user_district_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_user_ward_id := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE user_addresses ADD COLUMN ward_id BIGINT UNSIGNED NULL AFTER district_id', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_addresses' AND COLUMN_NAME = 'ward_id'
);
PREPARE stmt FROM @add_user_ward_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_shop_province_id := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE shops ADD COLUMN province_id BIGINT UNSIGNED NULL AFTER address_line1', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'province_id'
);
PREPARE stmt FROM @add_shop_province_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_shop_district_id := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE shops ADD COLUMN district_id BIGINT UNSIGNED NULL AFTER province_id', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'district_id'
);
PREPARE stmt FROM @add_shop_district_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_shop_ward_id := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE shops ADD COLUMN ward_id BIGINT UNSIGNED NULL AFTER district_id', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'ward_id'
);
PREPARE stmt FROM @add_shop_ward_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_app_province_id := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE shop_applications ADD COLUMN province_id BIGINT UNSIGNED NULL AFTER address_line1', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shop_applications' AND COLUMN_NAME = 'province_id'
);
PREPARE stmt FROM @add_app_province_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_app_district_id := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE shop_applications ADD COLUMN district_id BIGINT UNSIGNED NULL AFTER province_id', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shop_applications' AND COLUMN_NAME = 'district_id'
);
PREPARE stmt FROM @add_app_district_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_app_ward_id := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE shop_applications ADD COLUMN ward_id BIGINT UNSIGNED NULL AFTER district_id', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shop_applications' AND COLUMN_NAME = 'ward_id'
);
PREPARE stmt FROM @add_app_ward_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_app_district := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE shop_applications ADD COLUMN district VARCHAR(120) NULL AFTER ward', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shop_applications' AND COLUMN_NAME = 'district'
);
PREPARE stmt FROM @add_app_district; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS order_shops (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  shop_id BIGINT UNSIGNED NOT NULL,
  shop_name VARCHAR(160) NOT NULL,
  shop_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_weight_grams INT UNSIGNED NOT NULL DEFAULT 0,
  distance_type ENUM('SAME_WARD', 'SAME_DISTRICT', 'SAME_PROVINCE', 'SAME_REGION', 'DIFFERENT_REGION') NOT NULL,
  shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  shop_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_shops_order (order_id),
  KEY idx_order_shops_shop (shop_id),
  CONSTRAINT fk_order_shops_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_shops_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
