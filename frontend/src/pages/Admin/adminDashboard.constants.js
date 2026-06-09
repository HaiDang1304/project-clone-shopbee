export const adminNavItems = [
  { value: 'dashboard', icon: 'grid_view', label: 'Dashboard' },
  { value: 'users', icon: 'groups', label: 'Quản trị người dùng' },
  { value: 'shops', icon: 'storefront', label: 'Quản lý cửa hàng' },
  { value: 'categories', icon: 'category', label: 'Quản trị danh mục' },
  { value: 'products', icon: 'inventory_2', label: 'Quản trị sản phẩm' },
  { value: 'orders', icon: 'shopping_cart', label: 'Quản trị đơn hàng' },
  { value: 'comments', icon: 'rate_review', label: 'Quản lý bình luận' },
  { value: 'promotions', icon: 'local_offer', label: 'Khuyến mãi' },
  { value: 'shipping', icon: 'local_shipping', label: 'Vận chuyển' },
  { value: 'reports', icon: 'bar_chart', label: 'Thống kê báo cáo' },
]

export const moduleCopy = {
  dashboard: {
    title: 'Dashboard',
    description: 'Theo dõi nhanh hiệu suất vận hành toàn hệ thống ShopBee.',
  },
  users: {
    title: 'Quản trị người dùng',
    description: 'Quản lý tài khoản, phân quyền và trạng thái hoạt động của người dùng.',
  },
  shops: {
    title: 'Quản lý cửa hàng',
    description: 'Duyệt shop, theo dõi thông tin cửa hàng và trạng thái kinh doanh.',
  },
  categories: {
    title: 'Quản trị danh mục',
    description: 'Sắp xếp danh mục, ẩn hiện nhóm sản phẩm và chuẩn hóa cây ngành hàng.',
  },
  products: {
    title: 'Quản trị sản phẩm',
    description: 'Kiểm duyệt sản phẩm, theo dõi tồn kho và xử lý sản phẩm vi phạm.',
  },
  comments: {
    title: 'Quản lý bình luận',
    description: 'Kiểm duyệt đánh giá, phản hồi và nội dung cần xử lý.',
  },
  promotions: {
    title: 'Khuyến mãi',
    description: 'Quản lý mã giảm giá, flash sale và chiến dịch toàn sàn.',
  },
  shipping: {
    title: 'Vận chuyển',
    description: 'Theo dõi cấu hình phí, khu vực giao hàng và đối tác vận chuyển.',
  },
  reports: {
    title: 'Thống kê báo cáo',
    description: 'Tổng hợp doanh thu, đơn hàng, người dùng, shop và sản phẩm.',
  },
}

export const statusClassNames = {
  payment_pending: 'bg-[#fff1cc] text-[#9a5a00]',
  pending: 'bg-[#fff1cc] text-[#9a5a00]',
  paid: 'bg-[#e5f4ff] text-[#0369a1]',
  shipping: 'bg-[#dce9ff] text-[#1f5fe0]',
  delivered: 'bg-[#d9f7df] text-[#087c32]',
  cancelled: 'bg-[#ffdcd6] text-[#b42318]',
  processing: 'bg-[#e9e4ff] text-[#5d43c5]',
  refunded: 'bg-[#eeeeed] text-[#4b4b4b]',
  payment_expired: 'bg-[#ffdcd6] text-[#b42318]',
}

export const orderStatusLabels = {
  all: 'Tất cả',
  payment_pending: 'Chờ thanh toán',
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
  payment_expired: 'Hết hạn thanh toán',
}

export const userRoleLabels = {
  admin: 'Quản trị viên',
  seller: 'Người bán',
  customer: 'Khách hàng',
}

export const userRoleClassNames = {
  admin: 'bg-[#ffe8cc] text-[#9a5700]',
  seller: 'bg-[#e8f0ff] text-[#1f5fe0]',
  customer: 'bg-[#eeeeed] text-[#4b4b4b]',
}

export const avatarColorClasses = [
  'bg-[#e9e3df] text-[#755f55]',
  'bg-[#ffb36a] text-[#7b3600]',
  'bg-[#f1f1f1] text-[#4b4b4b]',
  'bg-[#ffe0df] text-[#be2420]',
  'bg-[#e8f0ff] text-[#2f6bf2]',
  'bg-[#f4e8ff] text-[#8c38d8]',
]
