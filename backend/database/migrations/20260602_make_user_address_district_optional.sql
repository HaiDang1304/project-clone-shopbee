CREATE DATABASE IF NOT EXISTS shopbee_clone
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shopbee_clone;

ALTER TABLE user_addresses
  MODIFY COLUMN district VARCHAR(120) NULL;
