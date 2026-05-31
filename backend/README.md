# Backend (Express + MongoDB)

## Setup

1) Tạo file `.env` (copy từ `.env.example`)

2) Cài dependencies

```bash
npm install
```

3) Chạy dev

```bash
npm run dev
```

## Health check

- `GET http://localhost:5000/api/health` -> `{ ok: true }`

## Database design (MongoDB)

Collections chính:

- `users`: tài khoản khách/seller/admin + địa chỉ
- `shops`: gian hàng (owner là user)
- `categories`: danh mục (có parentId để làm cây)
- `products`: sản phẩm thuộc shop + category, có ảnh, tồn kho, flash sale, variants
- `reviews`: đánh giá theo product + user
- `carts`: giỏ hàng 1-1 theo user
- `orders`: đơn hàng (items snapshot để tránh thay đổi giá/tên sau này)

Các model nằm trong `src/models/*`.
