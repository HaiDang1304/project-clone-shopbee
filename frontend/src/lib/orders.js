import { apiGet, apiPost } from './api'

export async function createOrder(orderData) {
  const data = await apiPost('/api/orders', orderData)
  return data.data
}

export async function calculateShippingFee(payload) {
  const data = await apiPost('/api/orders/shipping-fee', payload)
  return data.data
}

export async function getMyOrders() {
  const data = await apiGet('/api/account/orders')
  return data.data || []
}

export async function getOrderById(orderId) {
  const data = await apiGet(`/api/orders/${orderId}`)
  return data.data
}
