USE shopbee_clone;

SET @has_product_status = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'status'
);
SET @add_product_status = IF(
  @has_product_status = 0,
  'ALTER TABLE products ADD COLUMN status ENUM(''draft'', ''active'', ''hidden'') NOT NULL DEFAULT ''active'' AFTER thumbnail_url',
  'SELECT 1'
);
PREPARE add_product_status_stmt FROM @add_product_status;
EXECUTE add_product_status_stmt;
DEALLOCATE PREPARE add_product_status_stmt;

SET @has_product_options = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'product_options'
);
SET @add_product_options = IF(
  @has_product_options = 0,
  'ALTER TABLE products ADD COLUMN product_options JSON NULL AFTER status',
  'SELECT 1'
);
PREPARE add_product_options_stmt FROM @add_product_options;
EXECUTE add_product_options_stmt;
DEALLOCATE PREPARE add_product_options_stmt;

UPDATE products
SET status = CASE WHEN is_active = 1 THEN 'active' ELSE 'hidden' END
WHERE status IS NULL OR status = '';
