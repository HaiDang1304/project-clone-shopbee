import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export async function getAccountProfile() {
  const data = await apiGet('/api/account/profile')
  return data.data
}

export async function updateAccountProfile(profile) {
  return apiPatch('/api/account/profile', profile)
}

export async function getAccountAddresses() {
  const data = await apiGet('/api/account/addresses')
  return data.data || []
}

export async function getAccountLocations() {
  const data = await apiGet('/api/account/locations')
  return data.data || []
}

export async function createAccountAddress(address) {
  const data = await apiPost('/api/account/addresses', address)
  return data.data
}

export async function updateAccountAddress(addressId, address) {
  const data = await apiPatch(`/api/account/addresses/${addressId}`, address)
  return data.data
}

export async function deleteAccountAddress(addressId) {
  const data = await apiDelete(`/api/account/addresses/${addressId}`)
  return data.data || []
}

export async function getAccountPaymentMethods() {
  const data = await apiGet('/api/account/payment-methods')
  return data.data || { bankAccounts: [], cards: [] }
}

export async function getAccountOrders() {
  const data = await apiGet('/api/account/orders')
  return data.data || []
}

export async function getAccountNotifications() {
  const data = await apiGet('/api/account/notifications')
  return data.data || { items: [], unreadCount: 0 }
}

export async function markNotificationRead(notificationId) {
  return apiPatch(`/api/account/notifications/${notificationId}/read`)
}

export async function markAllNotificationsRead() {
  return apiPatch('/api/account/notifications/read-all')
}

export async function submitProductReview(payload) {
  const data = await apiPost('/api/account/reviews', payload)
  return data.data
}

export async function changeAccountPassword(payload) {
  return apiPatch('/api/account/password', payload)
}

export async function setupAccountPassword(payload) {
  return apiPatch('/api/account/password/setup', payload)
}

export async function getSellerRegistration() {
  return apiGet('/api/account/seller-registration')
}

export async function submitSellerRegistration(payload) {
  return apiPost('/api/account/seller-registration', payload)
}

export async function getSellerProducts() {
  const data = await apiGet('/api/account/seller/products')
  return data.data || { shop: null, products: [] }
}

function toQueryString(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })

  const value = query.toString()
  return value ? `?${value}` : ''
}

export async function getSellerDashboard(params = {}) {
  const data = await apiGet(`/api/account/seller/dashboard${toQueryString(params)}`)
  return data.data || { shop: null, stats: {}, revenueTrend: [], products: [], orders: [] }
}

export async function updateSellerShop(payload) {
  const data = await apiPatch('/api/account/seller/shop', payload)
  return data.data || { shop: null, stats: {}, revenueTrend: [], products: [], orders: [] }
}

export async function createSellerProduct(payload) {
  const data = await apiPost('/api/account/seller/products', payload)
  return data.data || { shop: null, products: [] }
}

export async function updateSellerProduct(productId, payload) {
  const data = await apiPatch(`/api/account/seller/products/${productId}`, payload)
  return data.data || { shop: null, stats: {}, revenueTrend: [], products: [], orders: [] }
}

export async function updateSellerProductStatus(productId, payload) {
  const data = await apiPatch(`/api/account/seller/products/${productId}/status`, payload)
  return data.data || { shop: null, stats: {}, revenueTrend: [], products: [], orders: [] }
}

export async function deleteSellerProduct(productId) {
  const data = await apiDelete(`/api/account/seller/products/${productId}`)
  return data.data || { shop: null, stats: {}, revenueTrend: [], products: [], orders: [] }
}

export async function updateSellerOrder(orderId, payload) {
  const data = await apiPatch(`/api/account/seller/orders/${orderId}`, payload)
  return data.data || { shop: null, stats: {}, revenueTrend: [], products: [], orders: [] }
}

export async function getAdminSellerApplications(status = 'pending') {
  const data = await apiGet(`/api/admin/seller-applications?status=${encodeURIComponent(status)}`)
  return data.data || []
}

export async function getAdminDashboardData(params = {}) {
  const data = await apiGet(`/api/admin/dashboard${toQueryString(params)}`)
  return data.data || null
}

export async function getAdminUsersData() {
  const data = await apiGet('/api/admin/users')
  return data.data || { stats: {}, items: [] }
}

export async function getAdminCategoriesData() {
  const data = await apiGet('/api/admin/categories')
  return data.data || { stats: {}, items: [] }
}

export async function createAdminCategory(payload) {
  const data = await apiPost('/api/admin/categories', payload)
  return data.data || { stats: {}, items: [] }
}

export async function updateAdminCategory(categoryId, payload) {
  const data = await apiPatch(`/api/admin/categories/${categoryId}`, payload)
  return data.data || { stats: {}, items: [] }
}

export async function deleteAdminCategory(categoryId) {
  const data = await apiDelete(`/api/admin/categories/${categoryId}`)
  return data.data || { stats: {}, items: [] }
}

export async function getAdminCommentsData() {
  const data = await apiGet('/api/admin/comments')
  return data.data || { stats: {}, items: [] }
}

export async function updateAdminComment(commentId, payload) {
  const data = await apiPatch(`/api/admin/comments/${commentId}`, payload)
  return data.data || { stats: {}, items: [] }
}

export async function deleteAdminComment(commentId) {
  const data = await apiDelete(`/api/admin/comments/${commentId}`)
  return data.data || { stats: {}, items: [] }
}

export async function getAdminPromotionsData() {
  const data = await apiGet('/api/admin/promotions')
  return data.data || { stats: {}, shops: [], items: [] }
}

export async function createAdminVoucher(payload) {
  const data = await apiPost('/api/admin/promotions', payload)
  return data.data || { stats: {}, shops: [], items: [] }
}

export async function updateAdminVoucher(voucherId, payload) {
  const data = await apiPatch(`/api/admin/promotions/${voucherId}`, payload)
  return data.data || { stats: {}, shops: [], items: [] }
}

export async function deleteAdminVoucher(voucherId) {
  const data = await apiDelete(`/api/admin/promotions/${voucherId}`)
  return data.data || { stats: {}, shops: [], items: [] }
}

export async function getAdminFlashSalesData() {
  const data = await apiGet('/api/admin/flash-sales')
  return data.data || { stats: {}, events: [], registrations: [] }
}

export async function createAdminFlashSale(payload) {
  const data = await apiPost('/api/admin/flash-sales', payload)
  return data.data || { stats: {}, events: [], registrations: [] }
}

export async function updateAdminFlashSale(eventId, payload) {
  const data = await apiPatch(`/api/admin/flash-sales/${eventId}`, payload)
  return data.data || { stats: {}, events: [], registrations: [] }
}

export async function reviewAdminFlashSaleRegistration(registrationId, payload) {
  const data = await apiPatch(`/api/admin/flash-sales/registrations/${registrationId}`, payload)
  return data.data || { stats: {}, events: [], registrations: [] }
}

export async function getSellerFlashSales() {
  const data = await apiGet('/api/account/seller/flash-sales')
  return data.data || { events: [], registrations: [] }
}

export async function registerSellerFlashSale(payload) {
  return apiPost('/api/account/seller/flash-sales/register', payload)
}

export async function getAdminShopsData() {
  const data = await apiGet('/api/admin/shops')
  return data.data || { stats: {}, items: [] }
}

export async function updateAdminUser(userId, payload) {
  const data = await apiPatch(`/api/admin/users/${userId}`, payload)
  return data.data || { stats: {}, items: [] }
}

export async function deleteAdminUser(userId) {
  const data = await apiDelete(`/api/admin/users/${userId}`)
  return data.data || { stats: {}, items: [] }
}

export async function reviewSellerApplication(applicationId, payload) {
  const data = await apiPatch(`/api/admin/seller-applications/${applicationId}`, payload)
  return data.data || []
}
