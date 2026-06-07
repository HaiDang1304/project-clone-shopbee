USE shopbee_clone;

SET @has_district_column := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'shop_applications'
    AND COLUMN_NAME = 'district'
);

SET @drop_district_sql := IF(
  @has_district_column > 0,
  'ALTER TABLE shop_applications DROP COLUMN district',
  'SELECT 1'
);

PREPARE drop_district_statement FROM @drop_district_sql;
EXECUTE drop_district_statement;
DEALLOCATE PREPARE drop_district_statement;
