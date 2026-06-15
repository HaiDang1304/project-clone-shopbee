# Deploy backend len Render voi Aiven MySQL

## 1. Loi Render hien tai

Render dang chay command `node index.js` o thu muc goc repository, nhung file backend nam tai:

```text
backend/index.js
```

Vi vay can cau hinh Render theo 1 trong 2 cach:

- Root Directory: `backend`
- Build Command: `npm ci`
- Start Command: `npm start`

Hoac neu khong dung Root Directory:

- Build Command: `npm --prefix backend ci`
- Start Command: `npm --prefix backend start`

Repo da co `render.yaml` de Render Blueprint tu dong dung `rootDir: backend`.

## 2. Bien moi truong tren Render

Them cac Environment Variables sau trong Render Web Service:

```env
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app

DB_HOST=shopee-haidanglu2004-633b.e.aivencloud.com
DB_PORT=28905
DB_USER=avnadmin
DB_PASSWORD=your_aiven_password
DB_NAME=defaultdb
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_SSL_CA_BASE64=your_aiven_ca_certificate_base64

JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=7d
OTP_SECRET=replace_with_long_random_secret
OTP_EXPIRES_MINUTES=10
RETURN_OTP_IN_RESPONSE=false

EMAIL_DELIVERY=console
GOOGLE_CLIENT_ID=your_google_web_client_id
GROQ_API_KEY=

PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_RETURN_URL=
PAYOS_CANCEL_URL=
```

Render tu gan `PORT`, nen co the bo qua bien `PORT`; app da doc `process.env.PORT`.

## 3. Import database vao Aiven

SQL hien tai trong `backend/database/schema.sql` va `seed.sql` dang `USE shopbee_clone`, trong khi Aiven cua ban dang co database `defaultdb`.

Neu muon dung `DB_NAME=defaultdb`, hay import ban SQL da doi `shopbee_clone` thanh `defaultdb`.

PowerShell:

```powershell
(Get-Content backend\database\schema.sql -Raw).Replace('shopbee_clone', 'defaultdb') | Set-Content backend\database\schema.aiven.sql -Encoding utf8
(Get-Content backend\database\seed.sql -Raw).Replace('shopbee_clone', 'defaultdb') | Set-Content backend\database\seed.aiven.sql -Encoding utf8
mysql --user avnadmin --password --host shopee-haidanglu2004-633b.e.aivencloud.com --port 28905 defaultdb < backend\database\schema.aiven.sql
mysql --user avnadmin --password --host shopee-haidanglu2004-633b.e.aivencloud.com --port 28905 defaultdb < backend\database\seed.aiven.sql
```

Sau do chay cac migration can thiet tu thu muc `backend` voi cung env Aiven:

```powershell
npm run db:migrate:user-vouchers
```

Neu ban tao database `shopbee_clone` tren Aiven va import nguyen file goc, thi tren Render dat:

```env
DB_NAME=shopbee_clone
```

## SSL certificate Aiven

Neu Render bao loi:

```text
self-signed certificate in certificate chain
```

hay tai `CA certificate` trong Aiven Console, roi them vao Render bang mot trong hai cach.

Cach de copy nhat la base64:

```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((Get-Content .\ca.pem -Raw)))
```

Sau do dat tren Render:

```env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_SSL_CA_BASE64=gia_tri_base64_vua_tao
```

Neu can chay nhanh de test, co the tam thoi dat:

```env
DB_SSL_REJECT_UNAUTHORIZED=false
```

nhung nen dung CA certificate cho production.

## 4. Cap nhat frontend Vercel

Trong Vercel Project Settings > Environment Variables:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id
```

Sau khi backend deploy thanh cong, redeploy frontend de Vite build lai bien `VITE_API_BASE_URL`.

## 5. Kiem tra sau deploy

Mo endpoint:

```text
https://your-render-service.onrender.com/api/health
```

Neu tra ve:

```json
{ "ok": true }
```

backend da start va ket noi database thanh cong.
