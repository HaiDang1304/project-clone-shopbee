CREATE DATABASE IF NOT EXISTS shopbee_clone
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shopbee_clone;

SET @add_latitude = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE user_addresses ADD COLUMN latitude DECIMAL(10,8) NULL AFTER postal_code',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'user_addresses'
    AND column_name = 'latitude'
);
PREPARE stmt FROM @add_latitude;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_longitude = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE user_addresses ADD COLUMN longitude DECIMAL(11,8) NULL AFTER latitude',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'user_addresses'
    AND column_name = 'longitude'
);
PREPARE stmt FROM @add_longitude;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
