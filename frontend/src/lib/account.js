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

export async function changeAccountPassword(payload) {
  return apiPatch('/api/account/password', payload)
}

export async function setupAccountPassword(payload) {
  return apiPatch('/api/account/password/setup', payload)
}
