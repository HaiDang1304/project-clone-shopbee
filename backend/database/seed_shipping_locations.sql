USE shopbee_clone;

INSERT INTO provinces (id, code, name, region) VALUES
  (1, 'CT', 'Can Tho', 'NAM'),
  (2, 'VL', 'Vinh Long', 'NAM'),
  (3, 'HCM', 'TP. Ho Chi Minh', 'NAM'),
  (4, 'DN', 'Dong Nai', 'NAM'),
  (5, 'HN', 'Ha Noi', 'BAC'),
  (6, 'HP', 'Hai Phong', 'BAC'),
  (7, 'DNG', 'Da Nang', 'TRUNG'),
  (8, 'KH', 'Khanh Hoa', 'TRUNG'),
  (9, 'LD', 'Lam Dong', 'TRUNG')
ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), region = VALUES(region);

INSERT INTO wards (id, code, province_id, name, zone_type) VALUES
  (1001, 'CT-AK', 1, 'An Khanh', 'NORMAL'),
  (1002, 'CT-TA', 1, 'Tan An', 'NORMAL'),
  (1003, 'CT-HP', 1, 'Hung Phu', 'NORMAL'),
  (2001, 'VL-P1', 2, 'Phuong 1', 'NORMAL'),
  (2002, 'VL-P4', 2, 'Phuong 4', 'NORMAL'),
  (2003, 'VL-LP', 2, 'Long Phuoc', 'REMOTE'),
  (3001, 'HCM-BN', 3, 'Ben Nghe', 'NORMAL'),
  (3002, 'HCM-BT', 3, 'Ben Thanh', 'NORMAL'),
  (3003, 'HCM-LT', 3, 'Linh Trung', 'NORMAL'),
  (4001, 'DN-TP', 4, 'Tan Phong', 'NORMAL'),
  (4002, 'DN-TD', 4, 'Trang Dai', 'NORMAL'),
  (4003, 'DN-BS', 4, 'Binh Son', 'REMOTE'),
  (5001, 'HN-HB', 5, 'Hang Bac', 'NORMAL'),
  (5002, 'HN-TT', 5, 'Trang Tien', 'NORMAL'),
  (5003, 'HN-DB', 5, 'Dien Bien', 'NORMAL'),
  (6001, 'HP-MT', 6, 'May To', 'NORMAL'),
  (6002, 'HP-LT', 6, 'Lach Tray', 'NORMAL'),
  (6003, 'HP-CB', 6, 'Cat Ba', 'REMOTE'),
  (7001, 'DNG-TT', 7, 'Thach Thang', 'NORMAL'),
  (7002, 'DNG-HC1', 7, 'Hai Chau 1', 'NORMAL'),
  (7003, 'DNG-HB', 7, 'Hoa Bac', 'REMOTE'),
  (8001, 'KH-LT', 8, 'Loc Tho', 'NORMAL'),
  (8002, 'KH-PH', 8, 'Phuoc Hai', 'NORMAL'),
  (8003, 'KH-CHD', 8, 'Cam Hai Dong', 'REMOTE'),
  (9001, 'LD-P1', 9, 'Phuong 1', 'NORMAL'),
  (9002, 'LD-P10', 9, 'Phuong 10', 'NORMAL'),
  (9003, 'LD-LAT', 9, 'Lat', 'REMOTE')
ON DUPLICATE KEY UPDATE
  code = VALUES(code),
  province_id = VALUES(province_id),
  name = VALUES(name),
  zone_type = VALUES(zone_type);
