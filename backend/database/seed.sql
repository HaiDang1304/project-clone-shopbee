USE shopbee_clone;

INSERT IGNORE INTO users (id, name, email, email_verified, role, is_active)
VALUES (1, 'ShopBee Seller', 'seller@shopbee.local', 1, 'seller', 1);

INSERT IGNORE INTO categories (id, name, slug, sort_order)
VALUES
  (1, 'Dien tu', 'dien-tu', 1),
  (2, 'Thoi trang', 'thoi-trang', 2),
  (3, 'Gia dung', 'gia-dung', 3),
  (4, 'Lam dep', 'lam-dep', 4),
  (5, 'The thao', 'the-thao', 5),
  (6, 'Suc khoe', 'suc-khoe', 6);

INSERT IGNORE INTO shops (id, owner_id, name, slug, province, rating_avg, rating_count, follower_count)
VALUES (1, 1, 'ShopBee Official', 'shopbee-official', 'TP. Ho Chi Minh', 4.90, 1280, 52000);

INSERT IGNORE INTO products
  (id, shop_id, category_id, name, slug, description, price, original_price, stock, thumbnail_url,
   flash_sale_active, flash_sale_discount_percent, flash_sale_sold, flash_sale_stock, rating_avg, rating_count, sold_count)
VALUES
  (1, 1, 1, 'Smartphone AI Pro Max Edition', 'smartphone-ai-pro-max-edition',
   'Demo product for ShopBee current frontend.', 28490000, 33500000, 98,
   'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80',
   1, 15, 75, 100, 4.90, 1200, 5400),
  (2, 1, 1, 'AI Vision Smart Watch Series 4', 'ai-vision-smart-watch-series-4',
   'Flash sale sample product.', 1250000, 2400000, 120,
   'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
   1, 45, 75, 100, 4.80, 410, 1200);

INSERT IGNORE INTO product_images (product_id, image_url, alt_text, sort_order)
VALUES
  (1, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80', 'Smartphone front', 1),
  (1, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80', 'Smartphone detail', 2),
  (2, 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80', 'Smart watch', 1);

INSERT IGNORE INTO product_variants (product_id, name, sku, price, original_price, stock, attributes)
VALUES
  (1, 'Black / 256GB', 'SP-AI-PM-BLK-256', 28490000, 33500000, 30, JSON_OBJECT('color', 'Black', 'storage', '256GB')),
  (1, 'White / 512GB', 'SP-AI-PM-WHT-512', 31490000, 36500000, 20, JSON_OBJECT('color', 'White', 'storage', '512GB'));

INSERT IGNORE INTO product_tags (product_id, tag)
VALUES
  (1, 'ai'),
  (1, 'smartphone'),
  (2, 'flash-sale'),
  (2, 'watch');
