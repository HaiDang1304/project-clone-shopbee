USE shopbee_clone;

SET @has_cart_item_selected_options = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'cart_items'
    AND COLUMN_NAME = 'selected_options'
);
SET @add_cart_item_selected_options = IF(
  @has_cart_item_selected_options = 0,
  'ALTER TABLE cart_items ADD COLUMN selected_options JSON NULL AFTER variant_id',
  'SELECT 1'
);
PREPARE add_cart_item_selected_options_stmt FROM @add_cart_item_selected_options;
EXECUTE add_cart_item_selected_options_stmt;
DEALLOCATE PREPARE add_cart_item_selected_options_stmt;

SET @has_order_item_selected_options = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_items'
    AND COLUMN_NAME = 'selected_options'
);
SET @add_order_item_selected_options = IF(
  @has_order_item_selected_options = 0,
  'ALTER TABLE order_items ADD COLUMN selected_options JSON NULL AFTER variant_sku',
  'SELECT 1'
);
PREPARE add_order_item_selected_options_stmt FROM @add_order_item_selected_options;
EXECUTE add_order_item_selected_options_stmt;
DEALLOCATE PREPARE add_order_item_selected_options_stmt;
