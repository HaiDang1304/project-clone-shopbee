USE shopbee_clone;

SET @schema := DATABASE();

SET @add_province_code := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE provinces ADD COLUMN code VARCHAR(30) NULL AFTER id', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'provinces' AND COLUMN_NAME = 'code'
);
PREPARE stmt FROM @add_province_code; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_ward_code := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE wards ADD COLUMN code VARCHAR(30) NULL AFTER id', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'wards' AND COLUMN_NAME = 'code'
);
PREPARE stmt FROM @add_ward_code; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_ward_province := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE wards ADD COLUMN province_id BIGINT UNSIGNED NULL AFTER code', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'wards' AND COLUMN_NAME = 'province_id'
);
PREPARE stmt FROM @add_ward_province; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_province_code_unique := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE provinces ADD UNIQUE KEY uq_provinces_code (code)', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'provinces' AND INDEX_NAME = 'uq_provinces_code'
);
PREPARE stmt FROM @add_province_code_unique; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_ward_code_unique := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE wards ADD UNIQUE KEY uq_wards_code (code)', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'wards' AND INDEX_NAME = 'uq_wards_code'
);
PREPARE stmt FROM @add_ward_code_unique; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_districts := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'districts'
);

SET @copy_ward_province := IF(
  @has_districts > 0,
  'UPDATE wards w JOIN districts d ON d.id = w.district_id SET w.province_id = COALESCE(w.province_id, d.province_id) WHERE w.province_id IS NULL',
  'SELECT 1'
);
PREPARE stmt FROM @copy_ward_province; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE wards w
JOIN user_addresses ua ON ua.ward_id = w.id
SET w.province_id = COALESCE(w.province_id, ua.province_id)
WHERE w.province_id IS NULL AND ua.province_id IS NOT NULL;

UPDATE wards w
JOIN shops s ON s.ward_id = w.id
SET w.province_id = COALESCE(w.province_id, s.province_id)
WHERE w.province_id IS NULL AND s.province_id IS NOT NULL;

UPDATE wards w
JOIN shop_applications sa ON sa.ward_id = w.id
SET w.province_id = COALESCE(w.province_id, sa.province_id)
WHERE w.province_id IS NULL AND sa.province_id IS NOT NULL;

DELETE FROM wards WHERE province_id IS NULL;

SET @ward_province_not_null := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE wards MODIFY COLUMN province_id BIGINT UNSIGNED NOT NULL', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'wards' AND COLUMN_NAME = 'province_id'
);
PREPARE stmt FROM @ward_province_not_null; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_wards_district_fk := (
  SELECT IF(COUNT(*) > 0, CONCAT('ALTER TABLE wards DROP FOREIGN KEY ', CONSTRAINT_NAME), 'SELECT 1')
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'wards' AND COLUMN_NAME = 'district_id'
    AND REFERENCED_TABLE_NAME = 'districts'
  LIMIT 1
);
PREPARE stmt FROM @drop_wards_district_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_wards_district_index := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE wards DROP INDEX idx_wards_district', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'wards' AND INDEX_NAME = 'idx_wards_district'
);
PREPARE stmt FROM @drop_wards_district_index; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_wards_district_unique := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE wards DROP INDEX uq_wards_district_name', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'wards' AND INDEX_NAME = 'uq_wards_district_name'
);
PREPARE stmt FROM @drop_wards_district_unique; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_wards_district_column := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE wards DROP COLUMN district_id', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'wards' AND COLUMN_NAME = 'district_id'
);
PREPARE stmt FROM @drop_wards_district_column; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_wards_province_index := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE wards ADD INDEX idx_wards_province (province_id)', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'wards' AND INDEX_NAME = 'idx_wards_province'
);
PREPARE stmt FROM @add_wards_province_index; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_wards_province_name_idx := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE wards ADD INDEX idx_wards_province_name (province_id, name)', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'wards' AND INDEX_NAME = 'idx_wards_province_name'
);
PREPARE stmt FROM @add_wards_province_name_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_wards_province_fk := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE wards ADD CONSTRAINT fk_wards_province FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE', 'SELECT 1')
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'wards' AND CONSTRAINT_NAME = 'fk_wards_province'
);
PREPARE stmt FROM @add_wards_province_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_order_distance := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN shipping_distance_type VARCHAR(30) NOT NULL DEFAULT ''SAME_PROVINCE'' AFTER shipping_province', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'shipping_distance_type'
);
PREPARE stmt FROM @add_order_distance; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_order_weight := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN shipping_weight_grams INT UNSIGNED NOT NULL DEFAULT 0 AFTER shipping_distance_type', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'shipping_weight_grams'
);
PREPARE stmt FROM @add_order_weight; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_order_snapshot := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE orders ADD COLUMN shipping_address_snapshot JSON NULL AFTER shipping_weight_grams', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'shipping_address_snapshot'
);
PREPARE stmt FROM @add_order_snapshot; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @product_weight_not_null := (
  SELECT IF(COUNT(*) > 0, 'UPDATE products SET weight_grams = 1 WHERE weight_grams IS NULL OR weight_grams <= 0', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'products' AND COLUMN_NAME = 'weight_grams'
);
PREPARE stmt FROM @product_weight_not_null; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @modify_product_weight := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE products MODIFY COLUMN weight_grams INT UNSIGNED NOT NULL', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'products' AND COLUMN_NAME = 'weight_grams'
);
PREPARE stmt FROM @modify_product_weight; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @normalize_order_shop_distance := (
  SELECT IF(COUNT(*) > 0, 'UPDATE order_shops SET distance_type = ''SAME_PROVINCE'' WHERE distance_type = ''SAME_DISTRICT''', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'order_shops' AND COLUMN_NAME = 'distance_type'
);
PREPARE stmt FROM @normalize_order_shop_distance; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @modify_order_shops_distance := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE order_shops MODIFY COLUMN distance_type ENUM(''SAME_WARD'', ''SAME_PROVINCE'', ''SAME_REGION'', ''DIFFERENT_REGION'') NOT NULL', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'order_shops' AND COLUMN_NAME = 'distance_type'
);
PREPARE stmt FROM @modify_order_shops_distance; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_user_ward_tmp_idx := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE user_addresses ADD INDEX idx_user_addresses_ward_tmp (ward_id)', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'user_addresses' AND INDEX_NAME = 'idx_user_addresses_ward_tmp'
);
PREPARE stmt FROM @add_user_ward_tmp_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_shop_ward_tmp_idx := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE shops ADD INDEX idx_shops_ward_tmp (ward_id)', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'shops' AND INDEX_NAME = 'idx_shops_ward_tmp'
);
PREPARE stmt FROM @add_shop_ward_tmp_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_app_ward_tmp_idx := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE shop_applications ADD INDEX idx_shop_applications_ward_tmp (ward_id)', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'shop_applications' AND INDEX_NAME = 'idx_shop_applications_ward_tmp'
);
PREPARE stmt FROM @add_app_ward_tmp_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_orders_shipping_district := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE orders DROP COLUMN shipping_district', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'shipping_district'
);
PREPARE stmt FROM @drop_orders_shipping_district; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_user_location_idx := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE user_addresses DROP INDEX idx_user_addresses_location', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'user_addresses' AND INDEX_NAME = 'idx_user_addresses_location'
);
PREPARE stmt FROM @drop_user_location_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_shop_location_idx := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE shops DROP INDEX idx_shops_location', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'shops' AND INDEX_NAME = 'idx_shops_location'
);
PREPARE stmt FROM @drop_shop_location_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_app_location_idx := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE shop_applications DROP INDEX idx_shop_applications_location', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'shop_applications' AND INDEX_NAME = 'idx_shop_applications_location'
);
PREPARE stmt FROM @drop_app_location_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_user_district_fk := (
  SELECT IF(COUNT(*) > 0, CONCAT('ALTER TABLE user_addresses DROP FOREIGN KEY ', CONSTRAINT_NAME), 'SELECT 1')
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'user_addresses' AND COLUMN_NAME = 'district_id'
    AND REFERENCED_TABLE_NAME = 'districts'
  LIMIT 1
);
PREPARE stmt FROM @drop_user_district_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_shop_district_fk := (
  SELECT IF(COUNT(*) > 0, CONCAT('ALTER TABLE shops DROP FOREIGN KEY ', CONSTRAINT_NAME), 'SELECT 1')
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'district_id'
    AND REFERENCED_TABLE_NAME = 'districts'
  LIMIT 1
);
PREPARE stmt FROM @drop_shop_district_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_app_district_fk := (
  SELECT IF(COUNT(*) > 0, CONCAT('ALTER TABLE shop_applications DROP FOREIGN KEY ', CONSTRAINT_NAME), 'SELECT 1')
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'shop_applications' AND COLUMN_NAME = 'district_id'
    AND REFERENCED_TABLE_NAME = 'districts'
  LIMIT 1
);
PREPARE stmt FROM @drop_app_district_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_user_district_id := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE user_addresses DROP COLUMN district_id', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'user_addresses' AND COLUMN_NAME = 'district_id'
);
PREPARE stmt FROM @drop_user_district_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_user_district_name := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE user_addresses DROP COLUMN district', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'user_addresses' AND COLUMN_NAME = 'district'
);
PREPARE stmt FROM @drop_user_district_name; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_shop_district_id := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE shops DROP COLUMN district_id', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'district_id'
);
PREPARE stmt FROM @drop_shop_district_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_shop_district_name := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE shops DROP COLUMN district', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'district'
);
PREPARE stmt FROM @drop_shop_district_name; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_app_district_id := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE shop_applications DROP COLUMN district_id', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'shop_applications' AND COLUMN_NAME = 'district_id'
);
PREPARE stmt FROM @drop_app_district_id; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_app_district_name := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE shop_applications DROP COLUMN district', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'shop_applications' AND COLUMN_NAME = 'district'
);
PREPARE stmt FROM @drop_app_district_name; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_user_location_idx := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE user_addresses ADD INDEX idx_user_addresses_location (province_id, ward_id)', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'user_addresses' AND INDEX_NAME = 'idx_user_addresses_location'
);
PREPARE stmt FROM @add_user_location_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_shop_location_idx := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE shops ADD INDEX idx_shops_location (province_id, ward_id)', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'shops' AND INDEX_NAME = 'idx_shops_location'
);
PREPARE stmt FROM @add_shop_location_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_app_location_idx := (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE shop_applications ADD INDEX idx_shop_applications_location (province_id, ward_id)', 'SELECT 1')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'shop_applications' AND INDEX_NAME = 'idx_shop_applications_location'
);
PREPARE stmt FROM @add_app_location_idx; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_districts := (
  SELECT IF(COUNT(*) > 0, 'DROP TABLE districts', 'SELECT 1')
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'districts'
);
PREPARE stmt FROM @drop_districts; EXECUTE stmt; DEALLOCATE PREPARE stmt;
