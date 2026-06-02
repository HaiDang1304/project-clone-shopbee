CREATE DATABASE IF NOT EXISTS shopbee_clone
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shopbee_clone;

SET @add_gender = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE users ADD COLUMN gender ENUM(''male'', ''female'', ''other'') NULL AFTER phone',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'gender'
);
PREPARE stmt FROM @add_gender;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_date_of_birth = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE users ADD COLUMN date_of_birth DATE NULL AFTER gender',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'date_of_birth'
);
PREPARE stmt FROM @add_date_of_birth;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
