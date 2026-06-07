USE shopbee_clone;

SET @has_weight_grams_column := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'weight_grams'
);

SET @add_weight_grams_sql := IF(
  @has_weight_grams_column = 0,
  'ALTER TABLE products ADD COLUMN weight_grams INT UNSIGNED NULL AFTER stock',
  'SELECT 1'
);

PREPARE add_weight_grams_statement FROM @add_weight_grams_sql;
EXECUTE add_weight_grams_statement;
DEALLOCATE PREPARE add_weight_grams_statement;
