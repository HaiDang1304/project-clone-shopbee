export const emptyShopForm = {
  shopName: '',
  contactPhone: '',
  contactEmail: '',
  avatarUrl: '',
  avatarDataUrl: '',
  avatarFileName: '',
  coverUrl: '',
  coverDataUrl: '',
  coverFileName: '',
  description: '',
  addressLine1: '',
  ward: '',
  province: '',
  country: 'VN',
}

export const maxShopImageSize = 10 * 1024 * 1024
export const allowedShopImageTypes = new Set(['image/jpeg', 'image/png'])
export const emptySellerItems = []

export const maxProductImageSize = 10 * 1024 * 1024
export const allowedProductImageTypes = new Set(['image/jpeg', 'image/png'])

export const productStatusOptions = [
  { value: 'draft', label: 'Nháp' },
  { value: 'active', label: 'Đang bán' },
  { value: 'hidden', label: 'Ẩn' },
]

export const productStatusMeta = {
  draft: { label: 'Nháp', className: 'bg-tertiary/10 text-tertiary' },
  active: { label: 'Đang bán', className: 'bg-primary/10 text-primary' },
  hidden: { label: 'Ẩn', className: 'bg-error-container text-on-error-container' },
  outOfStock: { label: 'Hết hàng', className: 'bg-error-container text-on-error-container' },
}

export const applicationStatuses = {
  pending: {
    label: 'Chờ admin duyệt',
    className: 'border-tertiary bg-tertiary/10 text-tertiary',
  },
  approved: {
    label: 'Đã duyệt',
    className: 'border-primary bg-primary/10 text-primary',
  },
  rejected: {
    label: 'Bị từ chối',
    className: 'border-error bg-error-container text-on-error-container',
  },
}

export const orderStatusLabels = {
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
}

export const orderStatusOptions = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
]

export const sellerTabs = [
  { value: 'overview', icon: 'dashboard', label: 'Tổng quan' },
  { value: 'profile', icon: 'storefront', label: 'Hồ sơ cửa hàng' },
  { value: 'products', icon: 'inventory_2', label: 'Sản phẩm' },
  { value: 'orders', icon: 'receipt_long', label: 'Đơn hàng' },
  { value: 'reports', icon: 'bar_chart', label: 'Báo cáo' },
]
