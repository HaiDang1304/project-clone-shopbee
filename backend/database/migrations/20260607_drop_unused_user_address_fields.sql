USE shopbee_clone;

SET @schema := DATABASE();

SET @drop_user_line2 := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE user_addresses DROP COLUMN line2', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'user_addresses' AND COLUMN_NAME = 'line2'
);
PREPARE stmt FROM @drop_user_line2; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_user_country := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE user_addresses DROP COLUMN country', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'user_addresses' AND COLUMN_NAME = 'country'
);
PREPARE stmt FROM @drop_user_country; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_user_postal_code := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE user_addresses DROP COLUMN postal_code', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'user_addresses' AND COLUMN_NAME = 'postal_code'
);
PREPARE stmt FROM @drop_user_postal_code; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_user_latitude := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE user_addresses DROP COLUMN latitude', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'user_addresses' AND COLUMN_NAME = 'latitude'
);
PREPARE stmt FROM @drop_user_latitude; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @drop_user_longitude := (
  SELECT IF(COUNT(*) > 0, 'ALTER TABLE user_addresses DROP COLUMN longitude', 'SELECT 1')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'user_addresses' AND COLUMN_NAME = 'longitude'
);
PREPARE stmt FROM @drop_user_longitude; EXECUTE stmt; DEALLOCATE PREPARE stmt;
