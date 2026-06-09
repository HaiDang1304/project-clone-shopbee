USE shopbee_clone;

SET @has_cart_variant_fk := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'cart_items'
    AND CONSTRAINT_NAME = 'fk_cart_items_variant'
);

SET @drop_cart_variant_fk_sql := IF(
  @has_cart_variant_fk > 0,
  'ALTER TABLE cart_items DROP FOREIGN KEY fk_cart_items_variant',
  'SELECT 1'
);

PREPARE drop_cart_variant_fk_statement FROM @drop_cart_variant_fk_sql;
EXECUTE drop_cart_variant_fk_statement;
DEALLOCATE PREPARE drop_cart_variant_fk_statement;

SET @has_order_variant_fk := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_items'
    AND CONSTRAINT_NAME = 'fk_order_items_variant'
);

SET @drop_order_variant_fk_sql := IF(
  @has_order_variant_fk > 0,
  'ALTER TABLE order_items DROP FOREIGN KEY fk_order_items_variant',
  'SELECT 1'
);

PREPARE drop_order_variant_fk_statement FROM @drop_order_variant_fk_sql;
EXECUTE drop_order_variant_fk_statement;
DEALLOCATE PREPARE drop_order_variant_fk_statement;

SET @has_cart_variant_id := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'cart_items'
    AND COLUMN_NAME = 'variant_id'
);

SET @drop_cart_variant_id_sql := IF(
  @has_cart_variant_id > 0,
  'ALTER TABLE cart_items DROP COLUMN variant_id',
  'SELECT 1'
);

PREPARE drop_cart_variant_id_statement FROM @drop_cart_variant_id_sql;
EXECUTE drop_cart_variant_id_statement;
DEALLOCATE PREPARE drop_cart_variant_id_statement;

SET @has_order_variant_id := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_items'
    AND COLUMN_NAME = 'variant_id'
);

SET @drop_order_variant_id_sql := IF(
  @has_order_variant_id > 0,
  'ALTER TABLE order_items DROP COLUMN variant_id',
  'SELECT 1'
);

PREPARE drop_order_variant_id_statement FROM @drop_order_variant_id_sql;
EXECUTE drop_order_variant_id_statement;
DEALLOCATE PREPARE drop_order_variant_id_statement;

SET @has_order_variant_sku := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_items'
    AND COLUMN_NAME = 'variant_sku'
);

SET @drop_order_variant_sku_sql := IF(
  @has_order_variant_sku > 0,
  'ALTER TABLE order_items DROP COLUMN variant_sku',
  'SELECT 1'
);

PREPARE drop_order_variant_sku_statement FROM @drop_order_variant_sku_sql;
EXECUTE drop_order_variant_sku_statement;
DEALLOCATE PREPARE drop_order_variant_sku_statement;

DROP TABLE IF EXISTS product_variants;
