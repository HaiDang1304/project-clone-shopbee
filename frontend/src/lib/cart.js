import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export async function getCart() {
  const data = await apiGet('/api/cart')
  return data.data || { id: null, items: [], totals: { quantity: 0, amount: 0 } }
}

export async function addCartItem(item) {
  const data = await apiPost('/api/cart/items', item)
  return data.data || { id: null, items: [], totals: { quantity: 0, amount: 0 } }
}

export async function updateCartItem(itemId, quantity) {
  const data = await apiPatch(`/api/cart/items/${itemId}`, { quantity })
  return data.data || { id: null, items: [], totals: { quantity: 0, amount: 0 } }
}

export async function removeCartItem(itemId) {
  const data = await apiDelete(`/api/cart/items/${itemId}`)
  return data.data || { id: null, items: [], totals: { quantity: 0, amount: 0 } }
}

export async function clearCart() {
  const data = await apiDelete('/api/cart')
  return data.data || { id: null, items: [], totals: { quantity: 0, amount: 0 } }
}
