const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')

const { query, transaction } = require('../config/db')
const { requireAuth } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/error')
const { signUserToken } = require('../utils/jwt')

const router = express.Router()
const avatarUploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'avatars')
const avatarPublicPath = '/uploads/avatars'
const shopUploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'shops')
const shopPublicPath = '/uploads/shops'
const productUploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'products')
const productPublicPath = '/uploads/products'
const maxAvatarSize = 10 * 1024 * 1024
const allowedGenders = new Set(['male', 'female', 'other'])
const allowedProductStatuses = new Set(['draft', 'active', 'hidden'])

function slugify(value) {
  const slug = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || `shop-${crypto.randomUUID().slice(0, 8)}`
}

function formatDateKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value || '').slice(0, 10)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function formatTrendLabel(date, index) {
  if (index === 6) return 'Hôm nay'

  const labels = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return labels[date.getDay()]
}

router.use(requireAuth)

async function saveAvatarDataUrl(userId, dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/)
  if (!match) {
    const err = new Error('Ảnh đại diện không hợp lệ')
    err.status = 400
    throw err
  }

  const ext = match[1] === 'png' ? 'png' : 'jpg'
  const buffer = Buffer.from(match[2], 'base64')
  if (!buffer.length || buffer.length > maxAvatarSize) {
    const err = new Error('Ảnh đại diện tối đa 10MB')
    err.status = 400
    throw err
  }

  await fs.mkdir(avatarUploadDir, { recursive: true })

  const fileName = `user-${userId}-${crypto.randomUUID()}.${ext}`
  const filePath = path.join(avatarUploadDir, fileName)
  await fs.writeFile(filePath, buffer)

  return `${avatarPublicPath}/${fileName}`
}

async function saveShopImageDataUrl(shopId, type, dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/)
  if (!match) {
    const err = new Error('Ảnh cửa hàng không hợp lệ')
    err.status = 400
    throw err
  }

  const ext = match[1] === 'png' ? 'png' : 'jpg'
  const buffer = Buffer.from(match[2], 'base64')
  if (!buffer.length || buffer.length > maxAvatarSize) {
    const err = new Error('Ảnh cửa hàng tối đa 10MB')
    err.status = 400
    throw err
  }

  await fs.mkdir(shopUploadDir, { recursive: true })

  const imageType = type === 'cover' ? 'cover' : 'avatar'
  const fileName = `shop-${shopId}-${imageType}-${crypto.randomUUID()}.${ext}`
  const filePath = path.join(shopUploadDir, fileName)
  await fs.writeFile(filePath, buffer)

  return `${shopPublicPath}/${fileName}`
}

async function saveProductImageDataUrl(productId, dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/)
  if (!match) {
    const err = new Error('Ảnh sản phẩm không hợp lệ')
    err.status = 400
    throw err
  }

  const ext = match[1] === 'png' ? 'png' : 'jpg'
  const buffer = Buffer.from(match[2], 'base64')
  if (!buffer.length || buffer.length > maxAvatarSize) {
    const err = new Error('Ảnh sản phẩm tối đa 10MB')
    err.status = 400
    throw err
  }

  await fs.mkdir(productUploadDir, { recursive: true })

  const fileName = `product-${productId}-${crypto.randomUUID()}.${ext}`
  const filePath = path.join(productUploadDir, fileName)
  await fs.writeFile(filePath, buffer)

  return `${productPublicPath}/${fileName}`
}

function safeParseJson(value, fallback) {
  if (!value) return fallback
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeProductOptionValues(values) {
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

function normalizeProductOptions(value) {
  const options = Array.isArray(value) ? value : safeParseJson(value, [])
  if (!Array.isArray(options)) return []

  return options
    .map((option) => ({
      name: String(option?.name || '').trim(),
      values: normalizeProductOptionValues(option?.values),
    }))
    .filter((option) => option.name && option.values.length)
}

function normalizeSelectedOptions(value) {
  const source = safeParseJson(value, {})
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {}

  return Object.entries(source)
    .map(([name, selectedValue]) => [String(name || '').trim(), String(selectedValue || '').trim()])
    .filter(([name, selectedValue]) => name && selectedValue)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((result, [name, selectedValue]) => {
      result[name] = selectedValue
      return result
    }, {})
}

function toProfile(row) {
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    gender: row.gender || '',
    dateOfBirth: row.dateOfBirth || '',
    avatarUrl: row.avatar_url || '',
    role: row.role,
    hasPassword: Number(row.has_password) === 1,
    hasGoogle: Number(row.has_google) === 1,
    emailVerified: Boolean(row.email_verified),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeDateOfBirth(value) {
  const date = String(value || '').trim()
  if (!date) return null

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const err = new Error('Ngày sinh không hợp lệ')
    err.status = 400
    throw err
  }

  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  const validDate =
    parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day

  if (!validDate) {
    const err = new Error('Ngày sinh không hợp lệ')
    err.status = 400
    throw err
  }

  const now = new Date()
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 10)
  if (date > today) {
    const err = new Error('Ngày sinh không được lớn hơn ngày hiện tại')
    err.status = 400
    throw err
  }

  return date
}

function toAddress(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2 || '',
    ward: row.ward || '',
    district: row.district || '',
    province: row.province,
    country: row.country,
    postalCode: row.postal_code || '',
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toShopApplication(row) {
  if (!row) return null

  return {
    id: row.id,
    userId: row.user_id,
    shopId: row.shop_id || null,
    shopName: row.shop_name,
    shopSlug: row.shop_slug,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email || '',
    description: row.description || '',
    addressLine1: row.address_line1,
    ward: row.ward || '',
    district: row.district || '',
    province: row.province,
    country: row.country,
    status: row.status,
    rejectReason: row.reject_reason || '',
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: row.user_name
      ? {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
          role: row.user_role,
        }
      : null,
  }
}

function toSellerShop(row) {
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    avatarUrl: row.avatar_url || '',
    coverUrl: row.cover_url || '',
    contactPhone: row.contact_phone || '',
    contactEmail: row.contact_email || '',
    description: row.description || '',
    addressLine1: row.address_line1 || '',
    ward: row.ward || '',
    district: row.district || '',
    province: row.province || '',
    country: row.country,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toSellerProduct(row) {
  if (!row) return null

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    price: Number(row.price || 0),
    originalPrice: row.original_price === null || row.original_price === undefined ? '' : Number(row.original_price),
    stock: Number(row.stock || 0),
    thumbnailUrl: row.thumbnail_url || '',
    images: row.images || [],
    status: row.status || (Number(row.is_active) === 1 ? 'active' : 'hidden'),
    productOptions: normalizeProductOptions(row.product_options),
    isActive: Boolean(row.is_active),
    ratingAvg: Number(row.rating_avg || 0),
    ratingCount: Number(row.rating_count || 0),
    soldCount: Number(row.sold_count || 0),
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name || '',
          slug: row.category_slug || '',
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toSellerOrder(row) {
  return {
    id: row.id,
    code: `SB-${String(row.id).padStart(4, '0')}`,
    status: row.status,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customer: {
      name: row.customer_name || row.shipping_full_name,
      email: row.customer_email || '',
      phone: row.shipping_phone || '',
    },
    shipping: {
      fullName: row.shipping_full_name,
      phone: row.shipping_phone,
      line1: row.shipping_line1,
      ward: row.shipping_ward || '',
      district: row.shipping_district,
      province: row.shipping_province,
      country: row.shipping_country,
    },
    itemCount: Number(row.item_count || 0),
    shopTotal: Number(row.shop_total || 0),
    orderTotal: Number(row.grand_total || 0),
    productNames: row.product_names || '',
  }
}

function normalizeCoordinate(value, min, max, message) {
  if (value === undefined || value === null || value === '') return null

  const coordinate = Number(value)
  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
    const err = new Error(message)
    err.status = 400
    throw err
  }

  return coordinate
}

function normalizeAddressPayload(body = {}) {
  const fullName = String(body.fullName || '').trim()
  const phone = String(body.phone || '').trim()
  const line1 = String(body.line1 || '').trim()
  const line2 = String(body.line2 || '').trim()
  const ward = String(body.ward || '').trim()
  const district = String(body.district || '').trim()
  const province = String(body.province || '').trim()
  const country = String(body.country || 'VN').trim().toUpperCase()
  const postalCode = String(body.postalCode || '').trim()
  const latitude = normalizeCoordinate(body.latitude, -90, 90, 'Vĩ độ không hợp lệ')
  const longitude = normalizeCoordinate(body.longitude, -180, 180, 'Kinh độ không hợp lệ')
  const isDefault = Boolean(body.isDefault)

  if (!fullName || fullName.length < 2) {
    const err = new Error('Tên người nhận không hợp lệ')
    err.status = 400
    throw err
  }

  if (!phone) {
    const err = new Error('Số điện thoại không hợp lệ')
    err.status = 400
    throw err
  }

  if (!line1) {
    const err = new Error('Vui lòng nhập địa chỉ cụ thể')
    err.status = 400
    throw err
  }

  if (!province) {
    const err = new Error('Vui lòng nhập tỉnh/thành phố')
    err.status = 400
    throw err
  }

  return {
    fullName,
    phone,
    line1,
    line2: line2 || null,
    ward: ward || null,
    district: district || null,
    province,
    country: country || 'VN',
    postalCode: postalCode || null,
    latitude,
    longitude,
    isDefault,
  }
}

function normalizeShopApplicationPayload(body = {}) {
  const shopName = String(body.shopName || '').trim()
  const contactPhone = String(body.contactPhone || '').trim()
  const contactEmail = String(body.contactEmail || '').trim()
  const description = String(body.description || '').trim()
  const addressLine1 = String(body.addressLine1 || '').trim()
  const ward = String(body.ward || '').trim()
  const district = String(body.district || '').trim()
  const province = String(body.province || '').trim()
  const country = String(body.country || 'VN').trim().toUpperCase()

  if (!shopName || shopName.length < 3) {
    const err = new Error('Tên cửa hàng tối thiểu 3 ký tự')
    err.status = 400
    throw err
  }

  if (!contactPhone) {
    const err = new Error('Vui lòng nhập số điện thoại liên hệ')
    err.status = 400
    throw err
  }

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    const err = new Error('Email liên hệ không hợp lệ')
    err.status = 400
    throw err
  }

  if (!addressLine1) {
    const err = new Error('Vui lòng nhập địa chỉ cửa hàng')
    err.status = 400
    throw err
  }

  if (!province) {
    const err = new Error('Vui lòng nhập tỉnh/thành phố của cửa hàng')
    err.status = 400
    throw err
  }

  return {
    shopName,
    shopSlug: slugify(shopName),
    contactPhone,
    contactEmail: contactEmail || null,
    description: description || null,
    addressLine1,
    ward: ward || null,
    district: district || null,
    province,
    country: country || 'VN',
  }
}

function normalizeShopProfilePayload(body = {}) {
  const payload = normalizeShopApplicationPayload(body)
  const avatarUrl = String(body.avatarUrl || '').trim()
  const coverUrl = String(body.coverUrl || '').trim()

  if (avatarUrl.length > 500 || coverUrl.length > 500) {
    const err = new Error('URL ảnh cửa hàng quá dài')
    err.status = 400
    throw err
  }

  return {
    ...payload,
    avatarUrl: avatarUrl || null,
    coverUrl: coverUrl || null,
  }
}

function normalizeSellerProductPayload(body = {}) {
  const name = String(body.name || '').trim()
  const description = String(body.description || '').trim()
  const thumbnailUrl = String(body.thumbnailUrl || '').trim()
  const categoryId = body.categoryId === undefined || body.categoryId === null || body.categoryId === '' ? null : Number(body.categoryId)
  const price = Number(body.price)
  const originalPrice = body.originalPrice === undefined || body.originalPrice === null || body.originalPrice === '' ? null : Number(body.originalPrice)
  const stock = Number.parseInt(body.stock, 10)
  const status = allowedProductStatuses.has(String(body.status || '').trim())
    ? String(body.status || '').trim()
    : body.isActive === false
      ? 'hidden'
      : 'active'
  const images = Array.isArray(body.images)
    ? body.images.map((image) => String(image || '').trim()).filter(Boolean)
    : []
  const imageDataUrls = Array.isArray(body.imageDataUrls)
    ? body.imageDataUrls.map((image) => String(image || '').trim()).filter(Boolean)
    : []
  const productOptions = normalizeProductOptions(body.productOptions)

  if (!name) {
    const err = new Error('Tên sản phẩm tối thiểu 3 ký tự')
    err.status = 400
    throw err
  }

  if (!Number.isFinite(price) || price < 0) {
    const err = new Error('Giá bán không hợp lệ')
    err.status = 400
    throw err
  }

  if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < price)) {
    const err = new Error('Giá gốc phải lớn hơn hoặc bằng giá bán')
    err.status = 400
    throw err
  }

  if (!Number.isSafeInteger(stock) || stock < 0) {
    const err = new Error('Tồn kho không hợp lệ')
    err.status = 400
    throw err
  }

  if (categoryId !== null && (!Number.isSafeInteger(categoryId) || categoryId <= 0)) {
    const err = new Error('Danh mục không hợp lệ')
    err.status = 400
    throw err
  }

  if (status === 'active' && !categoryId) {
    const err = new Error('Vui lòng chọn danh mục khi đăng sản phẩm')
    err.status = 400
    throw err
  }

  if (thumbnailUrl.length > 500 || images.some((image) => image.length > 500)) {
    const err = new Error('URL ảnh sản phẩm quá dài')
    err.status = 400
    throw err
  }

  return {
    name,
    slug: slugify(name),
    description: description || null,
    thumbnailUrl: thumbnailUrl || null,
    categoryId,
    price,
    originalPrice,
    stock,
    status,
    isActive: status === 'active',
    images,
    imageDataUrls,
    productOptions,
  }
}

async function replaceProductImages(connection, productId, images) {
  await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productId])

  for (const [index, imageUrl] of images.entries()) {
    await connection.execute(
      `INSERT INTO product_images (product_id, image_url, sort_order)
       VALUES (?, ?, ?)`,
      [productId, imageUrl, index],
    )
  }
}

async function makeUniqueShopSlug(baseSlug) {
  const base = baseSlug || `shop-${crypto.randomUUID().slice(0, 8)}`

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`
    const rows = await query('SELECT id FROM shops WHERE slug = ? LIMIT 1', [slug])
    if (!rows.length) return slug
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`
}

async function makeUniqueProductSlug(baseSlug) {
  const base = baseSlug || `product-${crypto.randomUUID().slice(0, 8)}`

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`
    const rows = await query('SELECT id FROM products WHERE slug = ? LIMIT 1', [slug])
    if (!rows.length) return slug
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`
}

async function readAddresses(userId) {
  const rows = await query(
    `SELECT id, full_name, phone, line1, line2, ward, district, province, country, postal_code,
            latitude, longitude, is_default, created_at, updated_at
     FROM user_addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, updated_at DESC, id DESC`,
    [userId],
  )

  return rows.map(toAddress)
}

async function readShopApplication(userId) {
  const rows = await query(
    `SELECT id, user_id, shop_id, shop_name, shop_slug, contact_phone, contact_email,
            description, address_line1, ward, district, province, country, status,
            reject_reason, reviewed_by, reviewed_at, created_at, updated_at
     FROM shop_applications
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
  )

  return toShopApplication(rows[0])
}

async function readSellerShop(userId) {
  const rows = await query(
    `SELECT s.id, s.name, s.slug, s.avatar_url, s.cover_url, s.description, s.address_line1, s.ward,
            s.district, s.province, s.country, s.is_active, s.created_at, s.updated_at,
            sa.contact_phone, sa.contact_email
     FROM shops s
     LEFT JOIN shop_applications sa ON sa.shop_id = s.id AND sa.user_id = s.owner_id
     WHERE s.owner_id = ? AND s.is_active = 1
     ORDER BY s.id DESC
     LIMIT 1`,
    [userId],
  )

  return toSellerShop(rows[0])
}

async function readSellerProducts(userId) {
  const rows = await query(
    `SELECT p.id, p.slug, p.name, p.description, p.price, p.original_price, p.stock,
            p.thumbnail_url, p.status, p.product_options, p.is_active, p.rating_avg, p.rating_count, p.sold_count,
            p.created_at, p.updated_at,
            c.id AS category_id, c.name AS category_name, c.slug AS category_slug
     FROM products p
     JOIN shops s ON s.id = p.shop_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE s.owner_id = ?
     ORDER BY p.created_at DESC
     LIMIT 20`,
    [userId],
  )

  const products = rows.map(toSellerProduct)
  if (!products.length) return products

  const productIds = products.map((product) => product.id)
  const placeholders = productIds.map(() => '?').join(', ')
  const imageRows = await query(
    `SELECT product_id, image_url, sort_order
     FROM product_images
     WHERE product_id IN (${placeholders})
     ORDER BY product_id ASC, sort_order ASC, id ASC`,
    productIds,
  )
  const imagesByProduct = imageRows.reduce((result, row) => {
    const current = result.get(row.product_id) || []
    current.push(row.image_url)
    result.set(row.product_id, current)
    return result
  }, new Map())

  return products.map((product) => ({
    ...product,
    images: imagesByProduct.get(product.id) || (product.thumbnailUrl ? [product.thumbnailUrl] : []),
  }))
}

async function readSellerOrders(shopId) {
  const rows = await query(
    `SELECT o.id, o.status, o.payment_method, o.grand_total, o.created_at, o.updated_at,
            o.shipping_full_name, o.shipping_phone, o.shipping_line1, o.shipping_ward,
            o.shipping_district, o.shipping_province, o.shipping_country,
            u.name AS customer_name, u.email AS customer_email,
            SUM(oi.quantity) AS item_count,
            COALESCE(SUM(oi.line_total), 0) AS shop_total,
            GROUP_CONCAT(oi.name ORDER BY oi.id SEPARATOR ', ') AS product_names
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN users u ON u.id = o.user_id
     WHERE oi.shop_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT 100`,
    [shopId],
  )

  return rows.map(toSellerOrder)
}

async function readSellerDashboard(userId) {
  const shop = await readSellerShop(userId)

  if (!shop) {
    const err = new Error('Cửa hàng chưa được admin duyệt')
    err.status = 403
    throw err
  }

  const [products, orders, statRows, trendRows] = await Promise.all([
    readSellerProducts(userId),
    readSellerOrders(shop.id),
    query(
      `SELECT
         COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled', 'refunded') THEN oi.line_total ELSE 0 END), 0) AS totalRevenue,
         COALESCE(SUM(CASE WHEN o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                           AND o.status NOT IN ('cancelled', 'refunded') THEN oi.line_total ELSE 0 END), 0) AS monthlyRevenue,
         COUNT(DISTINCT oi.order_id) AS orderCount,
         COUNT(DISTINCT CASE WHEN o.status IN ('pending', 'paid') THEN oi.order_id END) AS pendingOrders
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.shop_id = ?`,
      [shop.id],
    ),
    query(
      `SELECT DATE(o.created_at) AS date_key,
              COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled', 'refunded') THEN oi.line_total ELSE 0 END), 0) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.shop_id = ?
         AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(o.created_at)
       ORDER BY date_key ASC`,
      [shop.id],
    ),
  ])
  const stats = statRows[0] || {}
  const trendByDate = new Map(trendRows.map((row) => [formatDateKey(row.date_key), Number(row.revenue || 0)]))
  const today = new Date()
  const startDate = addDays(today, -6)
  const revenueTrend = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startDate, index)
    const dateKey = formatDateKey(date)

    return {
      day: formatTrendLabel(date, index),
      date: dateKey,
      value: trendByDate.get(dateKey) || 0,
    }
  })

  return {
    shop,
    stats: {
      totalRevenue: Number(stats.totalRevenue || 0),
      monthlyRevenue: Number(stats.monthlyRevenue || 0),
      orderCount: Number(stats.orderCount || 0),
      pendingOrders: Number(stats.pendingOrders || 0),
      productCount: products.length,
      activeProducts: products.filter((product) => product.isActive).length,
      outOfStockProducts: products.filter((product) => Number(product.stock || 0) <= 0).length,
    },
    revenueTrend,
    products,
    orders,
  }
}

function toOrder(row, items) {
  return {
    id: row.id,
    status: row.status,
    itemsTotal: Number(row.itemsTotal || 0),
    shippingFee: Number(row.shippingFee || 0),
    discountTotal: Number(row.discountTotal || 0),
    grandTotal: Number(row.grandTotal || 0),
    paymentMethod: row.paymentMethod,
    paidAt: row.paidAt,
    shipping: {
      fullName: row.shippingFullName,
      phone: row.shippingPhone,
      line1: row.shippingLine1,
      ward: row.shippingWard || '',
      district: row.shippingDistrict,
      province: row.shippingProvince,
      country: row.shippingCountry,
      postalCode: row.shippingPostalCode || '',
    },
    note: row.note || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items,
  }
}

async function readProfile(userId) {
  const rows = await query(
    `SELECT id, name, email, phone, gender, DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS dateOfBirth,
            avatar_url, role,
            (password_hash IS NOT NULL) AS has_password,
            (google_sub IS NOT NULL) AS has_google,
            email_verified, is_active, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId],
  )

  return toProfile(rows[0])
}

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const profile = await readProfile(Number(req.user.sub))
    if (!profile || !profile.isActive) {
      return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' })
    }

    return res.json({ ok: true, data: profile })
  }),
)

router.patch(
  '/profile',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const fields = []
    const params = []

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'name')) {
      const name = String(req.body.name || '').trim()
      if (!name || name.length < 2) return res.status(400).json({ ok: false, message: 'Tên không hợp lệ' })

      fields.push('name = ?')
      params.push(name)
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'phone')) {
      const phone = String(req.body.phone || '').trim()
      fields.push('phone = ?')
      params.push(phone || null)
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'gender')) {
      const gender = String(req.body.gender || '').trim()
      if (gender && !allowedGenders.has(gender)) {
        return res.status(400).json({ ok: false, message: 'Giới tính không hợp lệ' })
      }

      fields.push('gender = ?')
      params.push(gender || null)
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'dateOfBirth')) {
      fields.push('date_of_birth = ?')
      params.push(normalizeDateOfBirth(req.body.dateOfBirth))
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'avatarDataUrl')) {
      const avatarUrl = req.body.avatarDataUrl ? await saveAvatarDataUrl(userId, req.body.avatarDataUrl) : ''
      fields.push('avatar_url = ?')
      params.push(avatarUrl || null)
    }

    if (!fields.length) {
      const profile = await readProfile(userId)
      if (!profile) return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' })
      return res.json({ ok: true, data: profile, token: signUserToken(profile) })
    }

    await query(
      `UPDATE users
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = ? AND is_active = 1`,
      [...params, userId],
    )

    const profile = await readProfile(userId)
    if (!profile) return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' })

    return res.json({ ok: true, data: profile, token: signUserToken(profile) })
  }),
)

router.get(
  '/seller-registration',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const [profile, application, shop] = await Promise.all([
      readProfile(userId),
      readShopApplication(userId),
      readSellerShop(userId),
    ])

    const token = profile && profile.role !== req.user.role ? signUserToken(profile) : null

    return res.json({
      ok: true,
      data: {
        application,
        shop,
      },
      ...(token ? { token } : {}),
    })
  }),
)

router.post(
  '/seller-registration',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const payload = normalizeShopApplicationPayload(req.body)
    const existingShop = await readSellerShop(userId)

    if (existingShop) {
      return res.status(400).json({ ok: false, message: 'Tài khoản này đã có cửa hàng được duyệt' })
    }

    const existingRows = await query(
      `SELECT id, status
       FROM shop_applications
       WHERE user_id = ?
       LIMIT 1`,
      [userId],
    )
    const existing = existingRows[0]
    const shopSlug = await makeUniqueShopSlug(payload.shopSlug)

    if (existing?.status === 'pending') {
      return res.status(409).json({ ok: false, message: 'Đơn đăng ký cửa hàng đang chờ admin duyệt' })
    }

    if (existing?.status === 'approved') {
      return res.status(400).json({ ok: false, message: 'Đơn đăng ký cửa hàng đã được duyệt' })
    }

    if (existing) {
      await query(
        `UPDATE shop_applications
         SET shop_name = ?, shop_slug = ?, contact_phone = ?, contact_email = ?, description = ?,
             address_line1 = ?, ward = ?, district = ?, province = ?, country = ?,
             status = 'pending', reject_reason = NULL, reviewed_by = NULL, reviewed_at = NULL,
             updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [
          payload.shopName,
          shopSlug,
          payload.contactPhone,
          payload.contactEmail,
          payload.description,
          payload.addressLine1,
          payload.ward,
          payload.district,
          payload.province,
          payload.country,
          existing.id,
          userId,
        ],
      )
    } else {
      await query(
        `INSERT INTO shop_applications
           (user_id, shop_name, shop_slug, contact_phone, contact_email, description,
            address_line1, ward, district, province, country, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          userId,
          payload.shopName,
          shopSlug,
          payload.contactPhone,
          payload.contactEmail,
          payload.description,
          payload.addressLine1,
          payload.ward,
          payload.district,
          payload.province,
          payload.country,
        ],
      )
    }

    const application = await readShopApplication(userId)
    return res.status(existing ? 200 : 201).json({
      ok: true,
      data: {
        application,
        shop: null,
      },
      message: 'Đã gửi đơn đăng ký cửa hàng. Vui lòng chờ admin xác minh.',
    })
  }),
)

router.get(
  '/seller/dashboard',
  asyncHandler(async (req, res) => {
    const dashboard = await readSellerDashboard(Number(req.user.sub))
    return res.json({ ok: true, data: dashboard })
  }),
)

router.patch(
  '/seller/shop',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const shop = await readSellerShop(userId)

    if (!shop) {
      return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
    }

    const payload = normalizeShopProfilePayload(req.body)
    if (req.body?.avatarDataUrl) {
      payload.avatarUrl = await saveShopImageDataUrl(shop.id, 'avatar', req.body.avatarDataUrl)
    }
    if (req.body?.coverDataUrl) {
      payload.coverUrl = await saveShopImageDataUrl(shop.id, 'cover', req.body.coverDataUrl)
    }

    await transaction(async (connection) => {
      await connection.execute(
        `UPDATE shops
         SET name = ?, avatar_url = ?, cover_url = ?, description = ?, address_line1 = ?,
             ward = ?, district = ?, province = ?, country = ?, updated_at = NOW()
         WHERE id = ? AND owner_id = ?`,
        [
          payload.shopName,
          payload.avatarUrl,
          payload.coverUrl,
          payload.description,
          payload.addressLine1,
          payload.ward,
          payload.district,
          payload.province,
          payload.country,
          shop.id,
          userId,
        ],
      )

      await connection.execute(
        `UPDATE shop_applications
         SET shop_name = ?, contact_phone = ?, contact_email = ?, description = ?,
             address_line1 = ?, ward = ?, district = ?, province = ?, country = ?, updated_at = NOW()
         WHERE user_id = ? AND shop_id = ?`,
        [
          payload.shopName,
          payload.contactPhone,
          payload.contactEmail,
          payload.description,
          payload.addressLine1,
          payload.ward,
          payload.district,
          payload.province,
          payload.country,
          userId,
          shop.id,
        ],
      )
    })

    const dashboard = await readSellerDashboard(userId)
    return res.json({ ok: true, data: dashboard, message: 'Đã cập nhật hồ sơ cửa hàng.' })
  }),
)

router.get(
  '/seller/products',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const shop = await readSellerShop(userId)

    if (!shop) {
      return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
    }

    const products = await readSellerProducts(userId)
    return res.json({ ok: true, data: { shop, products } })
  }),
)

router.post(
  '/seller/products',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const shop = await readSellerShop(userId)

    if (!shop) {
      return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
    }

    const product = normalizeSellerProductPayload(req.body)

    if (product.categoryId) {
      const categoryRows = await query('SELECT id FROM categories WHERE id = ? AND is_active = 1 LIMIT 1', [
        product.categoryId,
      ])
      if (!categoryRows.length) {
        return res.status(400).json({ ok: false, message: 'Danh mục không tồn tại' })
      }
    }

    const productSlug = await makeUniqueProductSlug(product.slug)
    await transaction(async (connection) => {
      const [createdProduct] = await connection.execute(
        `INSERT INTO products
           (shop_id, category_id, name, slug, description, price, original_price, stock,
            thumbnail_url, status, product_options, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shop.id,
          product.categoryId,
          product.name,
          productSlug,
          product.description,
          product.price,
          product.originalPrice,
          product.stock,
          product.thumbnailUrl,
          product.status,
          JSON.stringify(product.productOptions),
          product.isActive ? 1 : 0,
        ],
      )

      const productId = createdProduct.insertId
      const savedImages = []
      for (const imageDataUrl of product.imageDataUrls) {
        savedImages.push(await saveProductImageDataUrl(productId, imageDataUrl))
      }

      const productImages = [...product.images, ...savedImages]
      if (productImages.length) {
        await replaceProductImages(connection, productId, productImages)
        await connection.execute('UPDATE products SET thumbnail_url = ? WHERE id = ?', [productImages[0], productId])
      }
    })

    const products = await readSellerProducts(userId)
    return res.status(201).json({
      ok: true,
      data: {
        shop,
        products,
      },
      message: 'Đã đăng sản phẩm mới.',
    })
  }),
)

router.patch(
  '/seller/products/:productId',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const productId = Number(req.params.productId)
    const shop = await readSellerShop(userId)

    if (!shop) {
      return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
    }

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({ ok: false, message: 'Sản phẩm không hợp lệ' })
    }

    const existingRows = await query('SELECT id, is_active FROM products WHERE id = ? AND shop_id = ? LIMIT 1', [
      productId,
      shop.id,
    ])
    const existing = existingRows[0]

    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Không tìm thấy sản phẩm' })
    }

    const product = normalizeSellerProductPayload(req.body)

    if (product.categoryId) {
      const categoryRows = await query('SELECT id FROM categories WHERE id = ? AND is_active = 1 LIMIT 1', [
        product.categoryId,
      ])
      if (!categoryRows.length) {
        return res.status(400).json({ ok: false, message: 'Danh mục không tồn tại' })
      }
    }

    const shouldReplaceImages =
      Object.prototype.hasOwnProperty.call(req.body || {}, 'images') ||
      Object.prototype.hasOwnProperty.call(req.body || {}, 'imageDataUrls')

    await transaction(async (connection) => {
      let nextThumbnailUrl = product.thumbnailUrl

      if (shouldReplaceImages) {
        const savedImages = []
        for (const imageDataUrl of product.imageDataUrls) {
          savedImages.push(await saveProductImageDataUrl(productId, imageDataUrl))
        }

        const productImages = [...product.images, ...savedImages]
        await replaceProductImages(connection, productId, productImages)
        nextThumbnailUrl = productImages[0] || null
      }

      await connection.execute(
        `UPDATE products
         SET category_id = ?, name = ?, description = ?, price = ?, original_price = ?,
             stock = ?, thumbnail_url = ?, status = ?, product_options = ?, is_active = ?, updated_at = NOW()
         WHERE id = ? AND shop_id = ?`,
        [
          product.categoryId,
          product.name,
          product.description,
          product.price,
          product.originalPrice,
          product.stock,
          nextThumbnailUrl,
          product.status,
          JSON.stringify(product.productOptions),
          product.isActive ? 1 : 0,
          productId,
          shop.id,
        ],
      )
    })

    const dashboard = await readSellerDashboard(userId)
    return res.json({ ok: true, data: dashboard, message: 'Đã cập nhật sản phẩm.' })
  }),
)

router.patch(
  '/seller/products/:productId/status',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const productId = Number(req.params.productId)
    const shop = await readSellerShop(userId)
    const isActive = Boolean(req.body?.isActive)

    if (!shop) {
      return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
    }

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({ ok: false, message: 'Sản phẩm không hợp lệ' })
    }

    const productRows = await query('SELECT id, stock FROM products WHERE id = ? AND shop_id = ? LIMIT 1', [
      productId,
      shop.id,
    ])
    const product = productRows[0]

    if (!product) {
      return res.status(404).json({ ok: false, message: 'Không tìm thấy sản phẩm' })
    }

    if (isActive && Number(product.stock || 0) <= 0) {
      return res.status(400).json({ ok: false, message: 'Sản phẩm hết hàng, không thể mở bán' })
    }

    await query('UPDATE products SET status = ?, is_active = ?, updated_at = NOW() WHERE id = ? AND shop_id = ?', [
      isActive ? 'active' : 'hidden',
      isActive ? 1 : 0,
      productId,
      shop.id,
    ])

    const dashboard = await readSellerDashboard(userId)
    return res.json({ ok: true, data: dashboard, message: isActive ? 'Đã mở bán sản phẩm.' : 'Đã đóng sản phẩm.' })
  }),
)

router.delete(
  '/seller/products/:productId',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const productId = Number(req.params.productId)
    const shop = await readSellerShop(userId)

    if (!shop) {
      return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
    }

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({ ok: false, message: 'Sản phẩm không hợp lệ' })
    }

    const productRows = await query('SELECT id FROM products WHERE id = ? AND shop_id = ? LIMIT 1', [productId, shop.id])
    if (!productRows.length) {
      return res.status(404).json({ ok: false, message: 'Không tìm thấy sản phẩm' })
    }

    const itemRows = await query('SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?', [productId])
    const hasOrders = Number(itemRows[0]?.count || 0) > 0

    if (hasOrders) {
      await query('UPDATE products SET status = ?, is_active = 0, updated_at = NOW() WHERE id = ? AND shop_id = ?', ['hidden', productId, shop.id])
      const dashboard = await readSellerDashboard(userId)
      return res.json({
        ok: true,
        data: dashboard,
        message: 'Sản phẩm đã có đơn hàng nên đã được đóng bán thay vì xóa.',
      })
    }

    await query('DELETE FROM products WHERE id = ? AND shop_id = ?', [productId, shop.id])

    const dashboard = await readSellerDashboard(userId)
    return res.json({ ok: true, data: dashboard, message: 'Đã xóa sản phẩm.' })
  }),
)

router.patch(
  '/seller/orders/:orderId',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const orderId = Number(req.params.orderId)
    const status = String(req.body?.status || '').trim()
    const allowedStatuses = new Set(['pending', 'processing', 'shipping', 'delivered', 'cancelled'])
    const shop = await readSellerShop(userId)

    if (!shop) {
      return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
    }

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, message: 'Đơn hàng không hợp lệ' })
    }

    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ ok: false, message: 'Trạng thái đơn hàng không hợp lệ' })
    }

    const orderRows = await query(
      `SELECT o.id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = ? AND oi.shop_id = ?
       LIMIT 1`,
      [orderId, shop.id],
    )

    if (!orderRows.length) {
      return res.status(404).json({ ok: false, message: 'Không tìm thấy đơn hàng của cửa hàng' })
    }

    await query('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, orderId])

    const dashboard = await readSellerDashboard(userId)
    return res.json({ ok: true, data: dashboard, message: 'Đã cập nhật đơn hàng.' })
  }),
)

router.get(
  '/addresses',
  asyncHandler(async (req, res) => {
    const addresses = await readAddresses(Number(req.user.sub))
    return res.json({ ok: true, data: addresses })
  }),
)

router.post(
  '/addresses',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const address = normalizeAddressPayload(req.body)

    await transaction(async (connection) => {
      const [existingRows] = await connection.execute('SELECT COUNT(*) AS count FROM user_addresses WHERE user_id = ?', [
        userId,
      ])
      const shouldBeDefault = address.isDefault || Number(existingRows[0]?.count || 0) === 0

      if (shouldBeDefault) {
        await connection.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId])
      }

      await connection.execute(
        `INSERT INTO user_addresses
           (user_id, full_name, phone, line1, line2, ward, district, province, country, postal_code,
            latitude, longitude, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          address.fullName,
          address.phone,
          address.line1,
          address.line2,
          address.ward,
          address.district,
          address.province,
          address.country,
          address.postalCode,
          address.latitude,
          address.longitude,
          shouldBeDefault ? 1 : 0,
        ],
      )
    })

    const addresses = await readAddresses(userId)
    return res.status(201).json({ ok: true, data: addresses, message: 'Đã thêm địa chỉ' })
  }),
)

router.patch(
  '/addresses/:addressId',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const addressId = Number(req.params.addressId)
    const address = normalizeAddressPayload(req.body)

    if (!Number.isSafeInteger(addressId) || addressId <= 0) {
      return res.status(400).json({ ok: false, message: 'Địa chỉ không hợp lệ' })
    }

    const updated = await transaction(async (connection) => {
      const [rows] = await connection.execute('SELECT id FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1', [
        addressId,
        userId,
      ])

      if (!rows.length) return false

      if (address.isDefault) {
        await connection.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId])
      }

      await connection.execute(
        `UPDATE user_addresses
         SET full_name = ?, phone = ?, line1 = ?, line2 = ?, ward = ?, district = ?, province = ?,
             country = ?, postal_code = ?, latitude = ?, longitude = ?, is_default = ?, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [
          address.fullName,
          address.phone,
          address.line1,
          address.line2,
          address.ward,
          address.district,
          address.province,
          address.country,
          address.postalCode,
          address.latitude,
          address.longitude,
          address.isDefault ? 1 : 0,
          addressId,
          userId,
        ],
      )

      return true
    })

    if (!updated) return res.status(404).json({ ok: false, message: 'Không tìm thấy địa chỉ' })

    const addresses = await readAddresses(userId)
    return res.json({ ok: true, data: addresses, message: 'Đã cập nhật địa chỉ' })
  }),
)

router.delete(
  '/addresses/:addressId',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const addressId = Number(req.params.addressId)

    if (!Number.isSafeInteger(addressId) || addressId <= 0) {
      return res.status(400).json({ ok: false, message: 'Địa chỉ không hợp lệ' })
    }

    const deleted = await transaction(async (connection) => {
      const [rows] = await connection.execute(
        'SELECT id, is_default AS isDefault FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1',
        [addressId, userId],
      )

      if (!rows.length) return false

      const wasDefault = Boolean(rows[0].isDefault)
      await connection.execute('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId])

      if (wasDefault) {
        const [remainingRows] = await connection.execute(
          `SELECT id
           FROM user_addresses
           WHERE user_id = ?
           ORDER BY updated_at DESC, id DESC
           LIMIT 1`,
          [userId],
        )

        if (remainingRows.length) {
          await connection.execute('UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [
            remainingRows[0].id,
            userId,
          ])
        }
      }

      return true
    })

    if (!deleted) return res.status(404).json({ ok: false, message: 'Không tìm thấy địa chỉ' })

    const addresses = await readAddresses(userId)
    return res.json({ ok: true, data: addresses, message: 'Đã xóa địa chỉ' })
  }),
)

router.get(
  '/payment-methods',
  asyncHandler(async (req, res) => {
    return res.json({
      ok: true,
      data: {
        bankAccounts: [],
        cards: [],
        message: '',
      },
    })
  }),
)

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const orders = await query(
      `SELECT
         id,
         status,
         items_total AS itemsTotal,
         shipping_fee AS shippingFee,
         discount_total AS discountTotal,
         grand_total AS grandTotal,
         payment_method AS paymentMethod,
         paid_at AS paidAt,
         shipping_full_name AS shippingFullName,
         shipping_phone AS shippingPhone,
         shipping_line1 AS shippingLine1,
         shipping_ward AS shippingWard,
         shipping_district AS shippingDistrict,
         shipping_province AS shippingProvince,
         shipping_country AS shippingCountry,
         shipping_postal_code AS shippingPostalCode,
         note,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    )

    if (!orders.length) return res.json({ ok: true, data: [] })

    const orderIds = orders.map((order) => Number(order.id))
    const placeholders = orderIds.map(() => '?').join(', ')
    const items = await query(
      `SELECT
         oi.id,
         oi.order_id AS orderId,
         oi.product_id AS productId,
         oi.shop_id AS shopId,
         s.name AS shopName,
         oi.name,
         oi.image_url AS imageUrl,
         oi.variant_id AS variantId,
         oi.variant_sku AS variantSku,
         oi.selected_options AS selectedOptions,
         oi.unit_price AS unitPrice,
         oi.quantity,
         oi.line_total AS lineTotal
       FROM order_items oi
       LEFT JOIN shops s ON s.id = oi.shop_id
       WHERE oi.order_id IN (${placeholders})
       ORDER BY oi.id ASC`,
      orderIds,
    )

    const itemsByOrder = new Map()
    items.forEach((item) => {
      const orderItems = itemsByOrder.get(Number(item.orderId)) || []
      orderItems.push({
        id: item.id,
        productId: item.productId,
        shopId: item.shopId,
        shopName: item.shopName || '',
        name: item.name,
        imageUrl: item.imageUrl || '',
        variantId: item.variantId,
        variantSku: item.variantSku || '',
        selectedOptions: normalizeSelectedOptions(item.selectedOptions),
        unitPrice: Number(item.unitPrice || 0),
        quantity: Number(item.quantity || 0),
        lineTotal: Number(item.lineTotal || 0),
      })
      itemsByOrder.set(Number(item.orderId), orderItems)
    })

    return res.json({
      ok: true,
      data: orders.map((order) => toOrder(order, itemsByOrder.get(Number(order.id)) || [])),
    })
  }),
)

router.patch(
  '/password',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const currentPassword = String(req.body?.currentPassword || '')
    const newPassword = String(req.body?.newPassword || '')

    if (!currentPassword) return res.status(400).json({ ok: false, message: 'Thiếu mật khẩu hiện tại' })
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ ok: false, message: 'Mật khẩu mới tối thiểu 6 ký tự' })
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ ok: false, message: 'Mật khẩu mới phải khác mật khẩu hiện tại' })
    }

    const rows = await query('SELECT password_hash FROM users WHERE id = ? AND is_active = 1 LIMIT 1', [userId])
    const user = rows[0]
    if (!user) return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' })
    if (!user.password_hash) {
      return res.status(400).json({ ok: false, message: 'Tài khoản này chưa có mật khẩu nội bộ' })
    }

    const passwordOk = await bcrypt.compare(currentPassword, user.password_hash)
    if (!passwordOk) return res.status(400).json({ ok: false, message: 'Mật khẩu hiện tại không đúng' })

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, userId])

    return res.json({ ok: true, message: 'Đã đổi mật khẩu' })
  }),
)

router.patch(
  '/password/setup',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const newPassword = String(req.body?.newPassword || '')

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ ok: false, message: 'Mật khẩu mới tối thiểu 6 ký tự' })
    }

    const rows = await query(
      'SELECT password_hash FROM users WHERE id = ? AND is_active = 1 LIMIT 1',
      [userId],
    )
    const user = rows[0]
    if (!user) return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' })
    if (user.password_hash) {
      return res.status(400).json({ ok: false, message: 'Tài khoản này đã có mật khẩu nội bộ' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, userId])

    return res.json({ ok: true, message: 'Đã thiết lập mật khẩu' })
  }),
)

module.exports = router
