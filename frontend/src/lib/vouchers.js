import { apiGet, apiPost } from './api'

export async function getAvailableVouchers() {
  const data = await apiGet('/api/vouchers')
  return data.data || { platform: [], shop: [], items: [] }
}

export async function getMyVouchers() {
  const data = await apiGet('/api/vouchers/my')
  return data.data || { platform: [], shop: [], items: [] }
}

export async function claimVoucher(voucherId) {
  const data = await apiPost(`/api/vouchers/${voucherId}/claim`)
  return data.data || { platform: [], shop: [], items: [] }
}
