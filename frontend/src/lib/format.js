export function formatCurrency(value) {
  const number = Number(value || 0)
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(number)
}

export function formatCompact(value) {
  const number = Number(value || 0)
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}m`
  if (number >= 1000) return `${(number / 1000).toFixed(1)}k`
  return String(number)
}

export function formatCount(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0))
}

export function productPath(product) {
  return `/product/${product?.slug || product?.id || ''}`
}
