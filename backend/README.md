# Backend (Express + MySQL)

Backend nay phuc vu frontend ShopBee hien tai. Cac endpoint auth giu dung duong dan frontend dang goi:

- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/login`
- `POST /api/auth/google`

Ngoai ra co cac API co ban:

- `GET /api/health`
- `GET /api/categories`
- `GET /api/products`
- `GET /api/products/:idOrSlug`
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:itemId`
- `DELETE /api/cart/items/:itemId`

## Cai dat

```bash
npm install
copy .env.example .env
```

Sua `.env` theo MySQL local cua ban.

## Tao database

Tu thu muc `backend`:

```bash
npm run db:schema
npm run db:seed
```

Hoac chay truc tiep:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p thuongmaidientu < database/seed.sql
```

## Chay server

```bash
npm run dev
```

Server mac dinh chay o `http://localhost:5000`.

## Email OTP local

Mac dinh `.env.example` dung:

```env
EMAIL_DELIVERY=console
```

Khi dang ky, ma OTP se duoc in trong terminal backend. Neu muon gui email that, doi sang:

```env
EMAIL_DELIVERY=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="ShopBee <your_email@gmail.com>"
```
