# Tổng hợp cập nhật danh mục, voucher và checkout

## Trang danh mục

- Thêm route `/category/:slug` để người dùng bấm vào từng danh mục và xem trang riêng.
- Trang danh mục có:
  - Banner đầu trang theo nhóm ngành hàng.
  - Sidebar danh mục để chuyển nhanh giữa các danh mục.
  - Bộ sắp xếp: mới nhất, bán chạy, giá thấp đến cao, giá cao đến thấp.
  - Lưới sản phẩm hiển thị giá, giá gốc, số lượng đã bán và shop.
- Các link danh mục ở home, header và breadcrumb sản phẩm đã chuyển sang route `/category/:slug`.

## Trung tâm voucher

- Thêm route `/vouchers` để hiển thị kho voucher cho người dùng.
- Voucher được chia thành 2 nhóm:
  - Voucher ShopBee: voucher toàn sàn do admin phát hành.
  - Voucher cửa hàng: voucher áp dụng cho từng shop.
- Người dùng có thể bấm `Lưu voucher`; voucher đã lưu sẽ hiện trạng thái `Đã lưu`.
- Nếu chưa đăng nhập khi lưu voucher, người dùng được chuyển đến màn hình đăng nhập và quay lại kho voucher sau đó.

## Backend voucher

- Thêm bảng `user_vouchers` để lưu các voucher người dùng đã nhận.
- Thêm migration: `backend/database/migrations/20260612_add_user_vouchers.sql`.
- Thêm API:
  - `GET /api/vouchers`: lấy voucher đang phát hành, kèm trạng thái đã lưu nếu người dùng đã đăng nhập.
  - `GET /api/vouchers/my`: lấy voucher người dùng đã lưu.
  - `POST /api/vouchers/:voucherId/claim`: lưu voucher vào ví voucher của người dùng.
- Logic tính voucher khi checkout đã kiểm tra người dùng phải lưu voucher trước thì mới được áp dụng.

## Checkout

- Thay ô nhập mã voucher bằng nút `Chọn voucher đã lưu`.
- Khi bấm chọn voucher sẽ mở modal:
  - Hiển thị voucher ShopBee và voucher cửa hàng.
  - Cho phép chọn tối đa 5 voucher.
  - Sau khi áp dụng, hệ thống gọi lại API tính voucher để xác định voucher nào hợp lệ với đơn hàng.
- Tóm tắt thanh toán vẫn hiển thị tổng giảm giá và các voucher đã áp dụng.

## Ghi chú vận hành

- Cần chạy migration `20260612_add_user_vouchers.sql` trên database đang dùng để bật đầy đủ luồng lưu voucher.
  - Có thể chạy bằng lệnh: `npm --prefix backend run db:migrate:user-vouchers`.
- Admin vẫn tạo và quản lý voucher ở dashboard như trước; trang `/vouchers` chỉ hiển thị các voucher đang bật, còn hạn và còn lượt sử dụng.
