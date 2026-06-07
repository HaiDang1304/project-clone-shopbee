import { productStatusMeta } from './sellerChannel.constants'

export function createEmptyProductForm() {
  return {
    name: '',
    categoryId: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '0',
    weightGrams: '',
    thumbnailUrl: '',
    status: 'active',
    isActive: true,
    images: [],
    productOptions: [],
  }
}

export function toShopForm(profile, application, shop) {
  return {
    shopName: shop?.name || application?.shopName || '',
    contactPhone: shop?.contactPhone || application?.contactPhone || profile?.phone || '',
    contactEmail: shop?.contactEmail || application?.contactEmail || profile?.email || '',
    avatarUrl: shop?.avatarUrl || '',
    avatarDataUrl: '',
    avatarFileName: '',
    coverUrl: shop?.coverUrl || '',
    coverDataUrl: '',
    coverFileName: '',
    description: shop?.description || application?.description || '',
    addressLine1: shop?.addressLine1 || application?.addressLine1 || '',
    provinceId: shop?.provinceId ? String(shop.provinceId) : application?.provinceId ? String(application.provinceId) : '',
    wardId: shop?.wardId ? String(shop.wardId) : application?.wardId ? String(application.wardId) : '',
    ward: shop?.ward || application?.ward || '',
    province: shop?.province || application?.province || '',
    country: shop?.country || application?.country || 'VN',
  }
}

export function toProductForm(product) {
  if (!product) return createEmptyProductForm()

  const images = Array.isArray(product.images) && product.images.length
    ? product.images.map((image, index) => {
        const url = typeof image === 'string' ? image : image.url || image.imageUrl || ''
        return {
          id: `existing-${product.id}-${index}`,
          name: `Ảnh ${index + 1}`,
          url,
          existing: true,
        }
      }).filter((image) => image.url)
    : product.thumbnailUrl
      ? [{ id: `existing-${product.id}-thumbnail`, name: 'Ảnh đại diện', url: product.thumbnailUrl, existing: true }]
      : []

  return {
    name: product.name || '',
    categoryId: product.category?.id ? String(product.category.id) : '',
    description: product.description || '',
    price: product.price === undefined ? '' : String(product.price),
    originalPrice: product.originalPrice === undefined || product.originalPrice === null ? '' : String(product.originalPrice),
    stock: product.stock === undefined ? '0' : String(product.stock),
    weightGrams: product.weightGrams === undefined || product.weightGrams === null ? '' : String(product.weightGrams),
    thumbnailUrl: product.thumbnailUrl || '',
    status: product.status || (product.isActive ? 'active' : 'hidden'),
    isActive: Boolean(product.isActive),
    images,
    productOptions: Array.isArray(product.productOptions)
      ? product.productOptions.map((option) => ({
          name: option.name || '',
          values: normalizeProductOptionValues(option.values),
          draftValue: '',
        }))
      : [],
  }
}

export function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function formatCount(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0))
}

export function getProductStatusMeta(product) {
  if (Number(product.stock || 0) <= 0 && product.status === 'active') return productStatusMeta.outOfStock
  return productStatusMeta[product.status || (product.isActive ? 'active' : 'hidden')] || productStatusMeta.hidden
}

export function normalizeProductOptionValues(values) {
  const source = Array.isArray(values) ? values : [values]
  const seen = new Set()
  const result = []

  source
    .flatMap((value) => String(value || '').split(/[,;\n]+/))
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      result.push(value)
    })

  return result
}
