const crypto = require('crypto')

const { query, transaction } = require('../../config/db')
const { asyncHandler } = require('../../middleware/error')
const { buildDailyRevenueTrend, normalizeRevenueRange } = require('../../utils/revenue-range')
const { normalizeVoucherCode } = require('../../services/voucher.service')

const allowedApplicationStatuses = new Set(['pending', 'approved', 'rejected'])
const dashboardOrderStatuses = ['payment_pending', 'pending', 'paid', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded', 'payment_expired']
const allowedUserRoles = new Set(['customer', 'seller', 'admin'])
const platformFeeRate = 0.05

function slugify(value) {
  const slug = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug
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

function formatPercentChange(current, previous) {
  const currentValue = Number(current || 0)
  const previousValue = Number(previous || 0)

  if (!previousValue && !currentValue) return '0%'
  if (!previousValue) return '+100%'

  const percent = Math.round(((currentValue - previousValue) / previousValue) * 100)
  return `${percent > 0 ? '+' : ''}${percent}%`
}

function getInitials(name, email) {
  const source = String(name || email || '').trim()
  if (!source) return 'AD'

  const parts = source.split(/\s+/).filter(Boolean)
  const initials = parts.length > 1 ? `${parts[0][0]}${parts.at(-1)[0]}` : source.slice(0, 2)
  return initials.toUpperCase()
}

function toShopApplication(row) {
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
    provinceId: row.province_id == null ? '' : Number(row.province_id),
    wardId: row.ward_id == null ? '' : Number(row.ward_id),
    ward: row.ward || '',
    province: row.province,
    country: row.country,
    status: row.status,
    rejectReason: row.reject_reason || '',
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      role: row.user_role,
    },
  }
}

function toDashboardOrder(row) {
  return {
    id: `SB-${String(row.id).padStart(4, '0')}`,
    numericId: row.id,
    customer: row.customer_name || row.shipping_full_name || row.customer_email || 'Khách hàng',
    initials: getInitials(row.customer_name || row.shipping_full_name, row.customer_email),
    phone: row.shipping_phone || '',
    store: row.shop_names || 'Nhiều cửa hàng',
    createdAt: row.created_at,
    total: Number(row.grand_total || 0),
    status: row.status,
  }
}

function toPendingShop(row) {
  return {
    id: row.id,
    initials: getInitials(row.shop_name, row.owner_email),
    name: row.shop_name,
    slug: row.shop_slug,
    owner: row.owner_name || row.owner_email || 'Người bán',
    ownerEmail: row.owner_email || '',
    contactPhone: row.contact_phone || '',
    contactEmail: row.contact_email || '',
    description: row.description || '',
    addressLine1: row.address_line1 || '',
    provinceId: row.province_id == null ? '' : Number(row.province_id),
    wardId: row.ward_id == null ? '' : Number(row.ward_id),
    ward: row.ward || '',
    province: row.province || '',
    country: row.country || 'VN',
    createdAt: row.created_at,
    status: 'pending',
  }
}

function toAdminUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    role: row.role,
    isActive: Boolean(row.is_active),
    emailVerified: Boolean(row.email_verified),
    avatarUrl: row.avatar_url || '',
    orderCount: Number(row.order_count || 0),
    totalSpent: Number(row.total_spent || 0),
    shopCount: Number(row.shop_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toAdminShop(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    avatarUrl: row.avatar_url || '',
    coverUrl: row.cover_url || '',
    description: row.description || '',
    addressLine1: row.address_line1 || '',
    ward: row.ward || '',
    province: row.province || '',
    country: row.country,
    ratingAvg: Number(row.rating_avg || 0),
    ratingCount: Number(row.rating_count || 0),
    followerCount: Number(row.follower_count || 0),
    isActive: Boolean(row.is_active),
    productCount: Number(row.product_count || 0),
    orderCount: Number(row.order_count || 0),
    revenue: Number(row.revenue || 0),
    deliveredRevenue: Number(row.delivered_revenue || 0),
    platformFeeRevenue: Number(row.platform_fee_revenue || 0),
    monthlyDeliveredRevenue: Number(row.monthly_delivered_revenue || 0),
    monthlyPlatformFee: Number(row.monthly_platform_fee || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    owner: {
      id: row.owner_id,
      name: row.owner_name,
      email: row.owner_email,
      phone: row.owner_phone || '',
      isActive: Boolean(row.owner_active),
    },
  }
}

function toAdminCategory(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id == null ? null : Number(row.parent_id),
    sortOrder: Number(row.sort_order || 0),
    isActive: Boolean(row.is_active),
    productCount: Number(row.product_count || 0),
    childCount: Number(row.child_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toAdminReview(row) {
  return {
    id: row.id,
    rating: Number(row.rating || 0),
    comment: row.comment || '',
    isVisible: Boolean(row.is_visible),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    orderId: row.order_id || null,
    user: {
      id: row.user_id,
      name: row.user_name || '',
      email: row.user_email || '',
      avatarUrl: row.user_avatar_url || '',
    },
    product: {
      id: row.product_id,
      name: row.product_name || '',
      slug: row.product_slug || '',
      thumbnailUrl: row.product_thumbnail_url || '',
    },
    shop: {
      id: row.shop_id,
      name: row.shop_name || '',
      slug: row.shop_slug || '',
    },
  }
}

function toAdminVoucher(row) {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    scope: row.scope,
    shopId: row.shop_id == null ? null : Number(row.shop_id),
    shopName: row.shop_name || '',
    discountType: row.discount_type,
    discountValue: Number(row.discount_value || 0),
    maxDiscountAmount: row.max_discount_amount == null ? '' : Number(row.max_discount_amount),
    minOrderAmount: Number(row.min_order_amount || 0),
    usageLimit: row.usage_limit == null ? '' : Number(row.usage_limit),
    perUserLimit: row.per_user_limit == null ? '' : Number(row.per_user_limit),
    usedCount: Number(row.used_count || 0),
    startsAt: row.starts_at || '',
    endsAt: row.ends_at || '',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toNullablePositiveNumber(value, fieldName) {
  if (value === undefined || value === null || value === '') return null
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    const err = new Error(`${fieldName} khong hop le`)
    err.status = 400
    throw err
  }
  return numberValue
}

function toNullablePositiveInteger(value, fieldName) {
  if (value === undefined || value === null || value === '') return null
  const numberValue = Number(value)
  if (!Number.isSafeInteger(numberValue) || numberValue <= 0) {
    const err = new Error(`${fieldName} khong hop le`)
    err.status = 400
    throw err
  }
  return numberValue
}

function normalizeDateTimeInput(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    const err = new Error('Thoi gian voucher khong hop le')
    err.status = 400
    throw err
  }
  return date
}

function normalizeVoucherPayload(body, { partial = false } = {}) {
  const payload = {}

  if (!partial || body.code !== undefined) {
    const code = normalizeVoucherCode(body.code)
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
      const err = new Error('Ma voucher phai tu 3 den 40 ky tu, chi gom chu, so, _ hoac -')
      err.status = 400
      throw err
    }
    payload.code = code
  }

  if (!partial || body.title !== undefined) {
    const title = String(body.title || '').trim()
    if (!title || title.length > 160) {
      const err = new Error('Ten chuong trinh voucher khong hop le')
      err.status = 400
      throw err
    }
    payload.title = title
  }

  if (!partial || body.scope !== undefined) {
    const scope = ['platform', 'shop'].includes(body.scope) ? body.scope : ''
    if (!scope) {
      const err = new Error('Pham vi voucher khong hop le')
      err.status = 400
      throw err
    }
    payload.scope = scope
  }

  if (!partial || body.shopId !== undefined || payload.scope === 'shop') {
    const shopId = body.shopId === undefined || body.shopId === null || body.shopId === '' ? null : Number(body.shopId)
    if (shopId !== null && (!Number.isSafeInteger(shopId) || shopId <= 0)) {
      const err = new Error('Cua hang ap dung voucher khong hop le')
      err.status = 400
      throw err
    }
    payload.shopId = shopId
  }

  if (!partial || body.discountType !== undefined) {
    const discountType = ['percent', 'fixed', 'free_shipping'].includes(body.discountType) ? body.discountType : ''
    if (!discountType) {
      const err = new Error('Kieu giam gia khong hop le')
      err.status = 400
      throw err
    }
    payload.discountType = discountType
  }

  if (!partial || body.discountValue !== undefined) {
    const discountValue = Number(body.discountValue || 0)
    if (!Number.isFinite(discountValue) || discountValue < 0 || discountValue > 100000000) {
      const err = new Error('Gia tri giam gia khong hop le')
      err.status = 400
      throw err
    }
    payload.discountValue = discountValue
  }

  if (!partial || body.maxDiscountAmount !== undefined) {
    payload.maxDiscountAmount = toNullablePositiveNumber(body.maxDiscountAmount, 'Muc giam toi da')
  }
  if (!partial || body.minOrderAmount !== undefined) {
    payload.minOrderAmount = Number(body.minOrderAmount || 0)
    if (!Number.isFinite(payload.minOrderAmount) || payload.minOrderAmount < 0) {
      const err = new Error('Gia tri don toi thieu khong hop le')
      err.status = 400
      throw err
    }
  }
  if (!partial || body.usageLimit !== undefined) payload.usageLimit = toNullablePositiveInteger(body.usageLimit, 'Tong luot dung')
  if (!partial || body.perUserLimit !== undefined) payload.perUserLimit = toNullablePositiveInteger(body.perUserLimit, 'Luot dung moi nguoi')
  if (!partial || body.startsAt !== undefined) payload.startsAt = normalizeDateTimeInput(body.startsAt)
  if (!partial || body.endsAt !== undefined) payload.endsAt = normalizeDateTimeInput(body.endsAt)
  if (!partial || body.isActive !== undefined) payload.isActive = body.isActive === undefined ? true : Boolean(body.isActive)

  if ((payload.scope || body.scope) === 'shop' && !payload.shopId && !partial) {
    const err = new Error('Voucher cua hang phai chon shop ap dung')
    err.status = 400
    throw err
  }
  if ((payload.scope || body.scope) === 'platform') payload.shopId = null
  if ((payload.discountType || body.discountType) === 'percent' && payload.discountValue > 100) {
    const err = new Error('Voucher phan tram khong duoc vuot qua 100%')
    err.status = 400
    throw err
  }
  if (payload.startsAt && payload.endsAt && payload.startsAt > payload.endsAt) {
    const err = new Error('Thoi gian bat dau khong duoc lon hon thoi gian ket thuc')
    err.status = 400
    throw err
  }

  return payload
}

function normalizeCategoryPayload(body, { partial = false } = {}) {
  const payload = {}

  if (!partial || body.name !== undefined) {
    const name = String(body.name || '').trim()
    if (!name || name.length < 2 || name.length > 120) {
      const err = new Error('Ten danh muc phai tu 2 den 120 ky tu')
      err.status = 400
      throw err
    }
    payload.name = name
  }

  if (!partial || body.slug !== undefined || payload.name) {
    const slug = slugify(body.slug || payload.name)
    if (!slug || slug.length > 160) {
      const err = new Error('Slug danh muc khong hop le')
      err.status = 400
      throw err
    }
    payload.slug = slug
  }

  if (!partial || body.parentId !== undefined) {
    const parentId = body.parentId === undefined || body.parentId === null || body.parentId === '' ? null : Number(body.parentId)
    if (parentId !== null && (!Number.isSafeInteger(parentId) || parentId <= 0)) {
      const err = new Error('Danh muc cha khong hop le')
      err.status = 400
      throw err
    }
    payload.parentId = parentId
  }

  if (!partial || body.sortOrder !== undefined) {
    const sortOrder = body.sortOrder === undefined || body.sortOrder === '' ? 0 : Number(body.sortOrder)
    if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 999999) {
      const err = new Error('Thu tu hien thi khong hop le')
      err.status = 400
      throw err
    }
    payload.sortOrder = sortOrder
  }

  if (!partial || body.isActive !== undefined) {
    payload.isActive = body.isActive === undefined ? true : Boolean(body.isActive)
  }

  return payload
}

async function assertCategoryParent(parentId, currentId = null) {
  if (!parentId) return
  if (Number(parentId) === Number(currentId)) {
    const err = new Error('Danh muc khong the chon chinh no lam danh muc cha')
    err.status = 400
    throw err
  }

  const rows = await query('SELECT id, parent_id FROM categories WHERE id = ? LIMIT 1', [parentId])
  if (!rows.length) {
    const err = new Error('Danh muc cha khong ton tai')
    err.status = 400
    throw err
  }

  let nextParentId = rows[0].parent_id
  while (nextParentId) {
    if (Number(nextParentId) === Number(currentId)) {
      const err = new Error('Khong the tao vong lap danh muc cha con')
      err.status = 400
      throw err
    }

    const parentRows = await query('SELECT parent_id FROM categories WHERE id = ? LIMIT 1', [nextParentId])
    nextParentId = parentRows[0]?.parent_id || null
  }
}

async function readAdminCategoriesData() {
  const rows = await query(
    `SELECT c.id, c.name, c.slug, c.parent_id, c.sort_order, c.is_active, c.created_at, c.updated_at,
            COALESCE(product_summary.product_count, 0) AS product_count,
            COALESCE(child_summary.child_count, 0) AS child_count
     FROM categories c
     LEFT JOIN (
       SELECT category_id, COUNT(*) AS product_count
       FROM products
       WHERE category_id IS NOT NULL
       GROUP BY category_id
     ) product_summary ON product_summary.category_id = c.id
     LEFT JOIN (
       SELECT parent_id, COUNT(*) AS child_count
       FROM categories
       WHERE parent_id IS NOT NULL
       GROUP BY parent_id
     ) child_summary ON child_summary.parent_id = c.id
     ORDER BY c.sort_order ASC, c.name ASC`,
  )

  const items = rows.map(toAdminCategory)
  const stats = {
    total: items.length,
    active: items.filter((category) => category.isActive).length,
    inactive: items.filter((category) => !category.isActive).length,
    roots: items.filter((category) => !category.parentId).length,
  }

  return { stats, items }
}

async function createAdminCategory(body) {
  const payload = normalizeCategoryPayload(body)
  await assertCategoryParent(payload.parentId)

  try {
    await query(
      `INSERT INTO categories (name, slug, parent_id, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [payload.name, payload.slug, payload.parentId, payload.sortOrder, payload.isActive ? 1 : 0],
    )
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      err.status = 409
      err.message = 'Slug danh muc da ton tai'
    }
    throw err
  }

  return readAdminCategoriesData()
}

async function updateAdminCategory(categoryId, body) {
  const id = Number(categoryId)
  if (!Number.isSafeInteger(id) || id <= 0) {
    const err = new Error('Danh muc khong hop le')
    err.status = 400
    throw err
  }

  const existing = await query('SELECT id FROM categories WHERE id = ? LIMIT 1', [id])
  if (!existing.length) {
    const err = new Error('Khong tim thay danh muc')
    err.status = 404
    throw err
  }

  const payload = normalizeCategoryPayload(body, { partial: true })
  await assertCategoryParent(payload.parentId, id)

  const fields = []
  const params = []
  if (payload.name !== undefined) {
    fields.push('name = ?')
    params.push(payload.name)
  }
  if (payload.slug !== undefined) {
    fields.push('slug = ?')
    params.push(payload.slug)
  }
  if (payload.parentId !== undefined) {
    fields.push('parent_id = ?')
    params.push(payload.parentId)
  }
  if (payload.sortOrder !== undefined) {
    fields.push('sort_order = ?')
    params.push(payload.sortOrder)
  }
  if (payload.isActive !== undefined) {
    fields.push('is_active = ?')
    params.push(payload.isActive ? 1 : 0)
  }

  if (!fields.length) return readAdminCategoriesData()

  try {
    await query(`UPDATE categories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, [...params, id])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      err.status = 409
      err.message = 'Slug danh muc da ton tai'
    }
    throw err
  }

  return readAdminCategoriesData()
}

async function deleteAdminCategory(categoryId) {
  const id = Number(categoryId)
  if (!Number.isSafeInteger(id) || id <= 0) {
    const err = new Error('Danh muc khong hop le')
    err.status = 400
    throw err
  }

  const usageRows = await query(
    `SELECT
       (SELECT COUNT(*) FROM products WHERE category_id = ?) AS productCount,
       (SELECT COUNT(*) FROM categories WHERE parent_id = ?) AS childCount`,
    [id, id],
  )
  const usage = usageRows[0] || {}
  if (Number(usage.productCount || 0) > 0) {
    const err = new Error('Khong the xoa danh muc dang co san pham')
    err.status = 409
    throw err
  }
  if (Number(usage.childCount || 0) > 0) {
    const err = new Error('Khong the xoa danh muc dang co danh muc con')
    err.status = 409
    throw err
  }

  await query('DELETE FROM categories WHERE id = ?', [id])
  return readAdminCategoriesData()
}

async function recalculateProductAndShopRatings(connection, productId) {
  const [productRows] = await connection.execute('SELECT shop_id FROM products WHERE id = ? LIMIT 1', [productId])
  const shopId = productRows[0]?.shop_id

  await connection.execute(
    `UPDATE products p
     SET rating_avg = COALESCE((
           SELECT ROUND(AVG(r.rating), 2)
           FROM reviews r
           WHERE r.product_id = p.id AND r.is_visible = 1
         ), 0),
         rating_count = (
           SELECT COUNT(*)
           FROM reviews r
           WHERE r.product_id = p.id AND r.is_visible = 1
         ),
         updated_at = NOW()
     WHERE p.id = ?`,
    [productId],
  )

  if (!shopId) return

  await connection.execute(
    `UPDATE shops s
     SET rating_avg = COALESCE((
           SELECT ROUND(AVG(r.rating), 2)
           FROM reviews r
           JOIN products p ON p.id = r.product_id
           WHERE p.shop_id = s.id AND r.is_visible = 1
         ), 0),
         rating_count = (
           SELECT COUNT(*)
           FROM reviews r
           JOIN products p ON p.id = r.product_id
           WHERE p.shop_id = s.id AND r.is_visible = 1
         ),
         updated_at = NOW()
     WHERE s.id = ?`,
    [shopId],
  )
}

async function readAdminReviewsData() {
  const rows = await query(
    `SELECT r.id, r.product_id, r.user_id, r.order_id, r.rating, r.comment, r.is_visible,
            r.created_at, r.updated_at,
            u.name AS user_name, u.email AS user_email, u.avatar_url AS user_avatar_url,
            p.name AS product_name, p.slug AS product_slug, p.thumbnail_url AS product_thumbnail_url,
            s.id AS shop_id, s.name AS shop_name, s.slug AS shop_slug
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     JOIN products p ON p.id = r.product_id
     JOIN shops s ON s.id = p.shop_id
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT 300`,
  )
  const items = rows.map(toAdminReview)
  const stats = {
    total: items.length,
    visible: items.filter((review) => review.isVisible).length,
    hidden: items.filter((review) => !review.isVisible).length,
    lowRating: items.filter((review) => review.rating <= 2).length,
  }

  return { stats, items }
}

async function updateAdminReview(reviewId, body) {
  const id = Number(reviewId)
  if (!Number.isSafeInteger(id) || id <= 0) {
    const err = new Error('Binh luan khong hop le')
    err.status = 400
    throw err
  }

  const rows = await query('SELECT id, product_id FROM reviews WHERE id = ? LIMIT 1', [id])
  const review = rows[0]
  if (!review) {
    const err = new Error('Khong tim thay binh luan')
    err.status = 404
    throw err
  }

  const isVisible = Boolean(body.isVisible)
  await transaction(async (connection) => {
    await connection.execute('UPDATE reviews SET is_visible = ?, updated_at = NOW() WHERE id = ?', [isVisible ? 1 : 0, id])
    await recalculateProductAndShopRatings(connection, review.product_id)
  })

  return readAdminReviewsData()
}

async function deleteAdminReview(reviewId) {
  const id = Number(reviewId)
  if (!Number.isSafeInteger(id) || id <= 0) {
    const err = new Error('Binh luan khong hop le')
    err.status = 400
    throw err
  }

  const rows = await query('SELECT id, product_id FROM reviews WHERE id = ? LIMIT 1', [id])
  const review = rows[0]
  if (!review) {
    const err = new Error('Khong tim thay binh luan')
    err.status = 404
    throw err
  }

  await transaction(async (connection) => {
    await connection.execute('DELETE FROM reviews WHERE id = ?', [id])
    await recalculateProductAndShopRatings(connection, review.product_id)
  })

  return readAdminReviewsData()
}

async function readAdminVouchersData() {
  const [voucherRows, shopRows] = await Promise.all([
    query(
      `SELECT v.*, s.name AS shop_name
       FROM vouchers v
       LEFT JOIN shops s ON s.id = v.shop_id
       ORDER BY v.created_at DESC, v.id DESC
       LIMIT 300`,
    ),
    query('SELECT id, name, slug FROM shops ORDER BY name ASC LIMIT 300'),
  ])
  const items = voucherRows.map(toAdminVoucher)
  const stats = {
    total: items.length,
    active: items.filter((voucher) => voucher.isActive).length,
    inactive: items.filter((voucher) => !voucher.isActive).length,
    platform: items.filter((voucher) => voucher.scope === 'platform').length,
    shop: items.filter((voucher) => voucher.scope === 'shop').length,
  }

  return {
    stats,
    shops: shopRows.map((shop) => ({ id: shop.id, name: shop.name, slug: shop.slug })),
    items,
  }
}

async function assertVoucherShop(shopId) {
  if (!shopId) return
  const rows = await query('SELECT id FROM shops WHERE id = ? LIMIT 1', [shopId])
  if (!rows.length) {
    const err = new Error('Khong tim thay shop ap dung voucher')
    err.status = 400
    throw err
  }
}

function voucherDateParam(value) {
  return value ? new Date(value) : null
}

async function createAdminVoucher(body) {
  const payload = normalizeVoucherPayload(body)
  await assertVoucherShop(payload.shopId)

  try {
    await query(
      `INSERT INTO vouchers
         (code, title, scope, shop_id, discount_type, discount_value, max_discount_amount,
          min_order_amount, usage_limit, per_user_limit, starts_at, ends_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.code,
        payload.title,
        payload.scope,
        payload.shopId,
        payload.discountType,
        payload.discountValue,
        payload.maxDiscountAmount,
        payload.minOrderAmount,
        payload.usageLimit,
        payload.perUserLimit,
        voucherDateParam(payload.startsAt),
        voucherDateParam(payload.endsAt),
        payload.isActive ? 1 : 0,
      ],
    )
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      err.status = 409
      err.message = 'Ma voucher da ton tai'
    }
    throw err
  }

  return readAdminVouchersData()
}

async function updateAdminVoucher(voucherId, body) {
  const id = Number(voucherId)
  if (!Number.isSafeInteger(id) || id <= 0) {
    const err = new Error('Voucher khong hop le')
    err.status = 400
    throw err
  }

  const existing = await query('SELECT * FROM vouchers WHERE id = ? LIMIT 1', [id])
  const current = existing[0]
  if (!current) {
    const err = new Error('Khong tim thay voucher')
    err.status = 404
    throw err
  }

  const payload = normalizeVoucherPayload(body, { partial: true })
  const nextScope = payload.scope || current.scope
  const nextShopId = payload.shopId !== undefined ? payload.shopId : current.shop_id
  if (nextScope === 'shop' && !nextShopId) {
    const err = new Error('Voucher cua hang phai chon shop ap dung')
    err.status = 400
    throw err
  }
  await assertVoucherShop(nextScope === 'platform' ? null : nextShopId)

  const fields = []
  const params = []
  const fieldMap = {
    code: 'code',
    title: 'title',
    scope: 'scope',
    shopId: 'shop_id',
    discountType: 'discount_type',
    discountValue: 'discount_value',
    maxDiscountAmount: 'max_discount_amount',
    minOrderAmount: 'min_order_amount',
    usageLimit: 'usage_limit',
    perUserLimit: 'per_user_limit',
    startsAt: 'starts_at',
    endsAt: 'ends_at',
    isActive: 'is_active',
  }

  Object.entries(fieldMap).forEach(([key, column]) => {
    if (payload[key] === undefined) return
    fields.push(`${column} = ?`)
    if (key === 'startsAt' || key === 'endsAt') params.push(voucherDateParam(payload[key]))
    else if (key === 'isActive') params.push(payload[key] ? 1 : 0)
    else params.push(payload[key])
  })
  if (payload.scope === 'platform') {
    fields.push('shop_id = ?')
    params.push(null)
  }

  if (!fields.length) return readAdminVouchersData()

  try {
    await query(`UPDATE vouchers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, [...params, id])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      err.status = 409
      err.message = 'Ma voucher da ton tai'
    }
    throw err
  }

  return readAdminVouchersData()
}

async function deleteAdminVoucher(voucherId) {
  const id = Number(voucherId)
  if (!Number.isSafeInteger(id) || id <= 0) {
    const err = new Error('Voucher khong hop le')
    err.status = 400
    throw err
  }

  await query('DELETE FROM vouchers WHERE id = ?', [id])
  return readAdminVouchersData()
}

function toDashboardNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    actionUrl: row.action_url || '',
    readAt: row.read_at || null,
    createdAt: row.created_at,
    user: {
      id: row.user_id,
      name: row.user_name || '',
      email: row.user_email || '',
    },
  }
}

function toPlatformFeeShop(row) {
  const monthlyDeliveredRevenue = Number(row.monthly_delivered_revenue || 0)
  const monthlyPlatformFee = Number(row.monthly_platform_fee || 0)

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    avatarUrl: row.avatar_url || '',
    owner: {
      id: row.owner_id,
      name: row.owner_name || '',
      email: row.owner_email || '',
    },
    deliveredOrderCount: Number(row.delivered_order_count || 0),
    monthlyDeliveredRevenue,
    monthlyPlatformFee,
    monthlyPayout: Math.max(0, monthlyDeliveredRevenue - monthlyPlatformFee),
    platformFeeRate,
  }
}

async function readAdminShopsData() {
  const [statRows, shopRows] = await Promise.all([
    query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive,
         COALESCE((SELECT COUNT(*) FROM shop_applications WHERE status = 'pending'), 0) AS pendingApplications,
         COALESCE((SELECT COUNT(*) FROM products), 0) AS products,
         COALESCE((
           SELECT ROUND(COALESCE(SUM(oi.line_total), 0) * ?)
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           WHERE o.status = 'delivered'
             AND o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         ), 0) AS monthlyPlatformFee
       FROM shops`,
      [platformFeeRate],
    ),
    query(
      `SELECT s.id, s.owner_id, s.name, s.slug, s.avatar_url, s.cover_url, s.description,
              s.address_line1, s.province_id, s.ward_id, s.ward, s.province, s.country, s.rating_avg,
              s.rating_count, s.follower_count, s.is_active, s.created_at, s.updated_at,
              u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone,
              u.is_active AS owner_active,
              COALESCE(product_summary.product_count, 0) AS product_count,
              COALESCE(order_summary.order_count, 0) AS order_count,
              COALESCE(order_summary.revenue, 0) AS revenue,
              COALESCE(order_summary.delivered_revenue, 0) AS delivered_revenue,
              COALESCE(order_summary.platform_fee_revenue, 0) AS platform_fee_revenue,
              COALESCE(order_summary.monthly_delivered_revenue, 0) AS monthly_delivered_revenue,
              COALESCE(order_summary.monthly_platform_fee, 0) AS monthly_platform_fee
       FROM shops s
       JOIN users u ON u.id = s.owner_id
       LEFT JOIN (
         SELECT shop_id, COUNT(*) AS product_count
         FROM products
         GROUP BY shop_id
       ) product_summary ON product_summary.shop_id = s.id
       LEFT JOIN (
         SELECT oi.shop_id,
                COUNT(DISTINCT oi.order_id) AS order_count,
                COALESCE(SUM(CASE WHEN o.status NOT IN ('payment_pending', 'payment_expired', 'cancelled', 'refunded') THEN oi.line_total ELSE 0 END), 0) AS revenue,
                COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN oi.line_total ELSE 0 END), 0) AS delivered_revenue,
                ROUND(COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN oi.line_total ELSE 0 END), 0) * ?) AS platform_fee_revenue,
                COALESCE(SUM(CASE WHEN o.status = 'delivered'
                                    AND o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                                   THEN oi.line_total ELSE 0 END), 0) AS monthly_delivered_revenue,
                ROUND(COALESCE(SUM(CASE WHEN o.status = 'delivered'
                                          AND o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                                         THEN oi.line_total ELSE 0 END), 0) * ?) AS monthly_platform_fee
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         GROUP BY oi.shop_id
       ) order_summary ON order_summary.shop_id = s.id
       ORDER BY s.created_at DESC, s.id DESC
       LIMIT 200`,
      [platformFeeRate, platformFeeRate],
    ),
  ])

  const stats = statRows[0] || {}

  return {
    stats: {
      total: Number(stats.total || 0),
      active: Number(stats.active || 0),
      inactive: Number(stats.inactive || 0),
      pendingApplications: Number(stats.pendingApplications || 0),
      products: Number(stats.products || 0),
      monthlyPlatformFee: Number(stats.monthlyPlatformFee || 0),
    },
    items: shopRows.map(toAdminShop),
  }
}

async function updateAdminShop(shopId, body) {
  const id = Number(shopId)
  if (!Number.isSafeInteger(id) || id <= 0) {
    const err = new Error('Cửa hàng không hợp lệ')
    err.status = 400
    throw err
  }

  const existing = await query('SELECT id FROM shops WHERE id = ? LIMIT 1', [id])
  if (!existing.length) {
    const err = new Error('Không tìm thấy cửa hàng')
    err.status = 404
    throw err
  }

  const fields = []
  const params = []
  if (Object.prototype.hasOwnProperty.call(body || {}, 'isActive')) {
    const isActiveValue = body.isActive
    const isActive =
      isActiveValue === true || isActiveValue === 1 || isActiveValue === '1' || isActiveValue === 'true'
    fields.push('is_active = ?')
    params.push(isActive ? 1 : 0)
  }

  if (!fields.length) return readAdminShopsData()

  await query(`UPDATE shops SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, [...params, id])
  return readAdminShopsData()
}

async function readAdminUsersData() {
  const [statRows, userRows] = await Promise.all([
    query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) AS customers,
         SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) AS sellers,
         SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins
       FROM users`,
    ),
    query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.email_verified,
              u.avatar_url, u.created_at, u.updated_at,
              COALESCE(order_summary.order_count, 0) AS order_count,
              COALESCE(order_summary.total_spent, 0) AS total_spent,
              COALESCE(shop_summary.shop_count, 0) AS shop_count
       FROM users u
       LEFT JOIN (
         SELECT user_id,
                COUNT(*) AS order_count,
                COALESCE(SUM(CASE WHEN status NOT IN ('payment_pending', 'payment_expired', 'cancelled', 'refunded') THEN grand_total ELSE 0 END), 0) AS total_spent
         FROM orders
         GROUP BY user_id
       ) order_summary ON order_summary.user_id = u.id
       LEFT JOIN (
         SELECT owner_id, COUNT(*) AS shop_count
         FROM shops
         GROUP BY owner_id
       ) shop_summary ON shop_summary.owner_id = u.id
       ORDER BY u.created_at DESC, u.id DESC
       LIMIT 200`,
    ),
  ])

  const stats = statRows[0] || {}

  return {
    stats: {
      total: Number(stats.total || 0),
      active: Number(stats.active || 0),
      customers: Number(stats.customers || 0),
      sellers: Number(stats.sellers || 0),
      admins: Number(stats.admins || 0),
    },
    items: userRows.map(toAdminUser),
  }
}

async function readDashboardData(rangeOptions = {}) {
  const revenueRange = normalizeRevenueRange(rangeOptions)
  const [
    currentRevenueRows,
    previousRevenueRows,
    currentPlatformFeeRows,
    previousPlatformFeeRows,
    currentOrderRows,
    previousOrderRows,
    currentUserRows,
    previousUserRows,
    pendingShopCountRows,
    trendRows,
    pendingShopRows,
    statusRows,
    latestOrderRows,
    notificationRows,
    platformFeeShopRows,
  ] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(grand_total), 0) AS total
       FROM orders
       WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND status NOT IN ('payment_pending', 'payment_expired', 'cancelled', 'refunded')`,
    ),
    query(
      `SELECT COALESCE(SUM(grand_total), 0) AS total
       FROM orders
       WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
         AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND status NOT IN ('payment_pending', 'payment_expired', 'cancelled', 'refunded')`,
    ),
    query(
      `SELECT ROUND(COALESCE(SUM(oi.line_total), 0) * ?) AS total
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND o.status = 'delivered'`,
      [platformFeeRate],
    ),
    query(
      `SELECT ROUND(COALESCE(SUM(oi.line_total), 0) * ?) AS total
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
         AND o.created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND o.status = 'delivered'`,
      [platformFeeRate],
    ),
    query(
      `SELECT COUNT(*) AS count
       FROM orders
       WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
    ),
    query(
      `SELECT COUNT(*) AS count
       FROM orders
       WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
         AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
    ),
    query(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
    ),
    query(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
         AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
    ),
    query("SELECT COUNT(*) AS count FROM shop_applications WHERE status = 'pending'"),
    query(
      `SELECT DATE(created_at) AS date_key, COALESCE(SUM(grand_total), 0) AS revenue
       FROM orders
       WHERE created_at >= ?
         AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
         AND status NOT IN ('payment_pending', 'payment_expired', 'cancelled', 'refunded')
       GROUP BY DATE(created_at)
       ORDER BY date_key ASC`,
      [revenueRange.startDate, revenueRange.endDate],
    ),
    query(
      `SELECT sa.id, sa.shop_name, sa.shop_slug, sa.contact_phone, sa.contact_email,
              sa.description, sa.address_line1, sa.province_id, sa.ward_id, sa.ward, sa.province,
              sa.country, sa.created_at,
              u.name AS owner_name, u.email AS owner_email
       FROM shop_applications sa
       JOIN users u ON u.id = sa.user_id
       WHERE sa.status = 'pending'
       ORDER BY sa.created_at DESC
       LIMIT 5`,
    ),
    query('SELECT status, COUNT(*) AS count FROM orders GROUP BY status'),
    query(
      `SELECT o.id, o.status, o.grand_total, o.created_at, o.shipping_full_name, o.shipping_phone,
              u.name AS customer_name, u.email AS customer_email,
              COALESCE(shop_summary.shop_names, '') AS shop_names
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN (
         SELECT oi.order_id, GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS shop_names
         FROM order_items oi
         JOIN shops s ON s.id = oi.shop_id
         GROUP BY oi.order_id
       ) shop_summary ON shop_summary.order_id = o.id
      ORDER BY o.created_at DESC
      LIMIT 20`,
    ),
    query(
      `SELECT n.id, n.user_id, n.type, n.title, n.message, n.action_url, n.read_at,
              n.created_at, u.name AS user_name, u.email AS user_email
       FROM notifications n
       JOIN users u ON u.id = n.user_id
       ORDER BY n.created_at DESC, n.id DESC
       LIMIT 8`,
    ),
    query(
      `SELECT s.id, s.name, s.slug, s.avatar_url, s.owner_id,
              u.name AS owner_name, u.email AS owner_email,
              COUNT(DISTINCT CASE WHEN o.status = 'delivered'
                                    AND o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                                   THEN o.id END) AS delivered_order_count,
              COALESCE(SUM(CASE WHEN o.status = 'delivered'
                                  AND o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                                 THEN oi.line_total ELSE 0 END), 0) AS monthly_delivered_revenue,
              ROUND(COALESCE(SUM(CASE WHEN o.status = 'delivered'
                                        AND o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                                       THEN oi.line_total ELSE 0 END), 0) * ?) AS monthly_platform_fee
       FROM shops s
       JOIN users u ON u.id = s.owner_id
       LEFT JOIN order_items oi ON oi.shop_id = s.id
       LEFT JOIN orders o ON o.id = oi.order_id
       GROUP BY s.id, s.name, s.slug, s.avatar_url, s.owner_id, u.name, u.email
       ORDER BY monthly_platform_fee DESC, monthly_delivered_revenue DESC, s.id DESC
       LIMIT 100`,
      [platformFeeRate],
    ),
  ])

  const revenueTrend = buildDailyRevenueTrend(trendRows, revenueRange)

  const statusCounts = new Map(statusRows.map((row) => [row.status, Number(row.count || 0)]))
  const totalOrders = [...statusCounts.values()].reduce((sum, count) => sum + count, 0)
  const orderTabs = [
    { value: 'all', count: totalOrders },
    ...dashboardOrderStatuses.map((status) => ({
      value: status,
      count: statusCounts.get(status) || 0,
    })),
  ]

  const currentRevenue = Number(currentRevenueRows[0]?.total || 0)
  const previousRevenue = Number(previousRevenueRows[0]?.total || 0)
  const currentPlatformFee = Number(currentPlatformFeeRows[0]?.total || 0)
  const previousPlatformFee = Number(previousPlatformFeeRows[0]?.total || 0)
  const currentOrders = Number(currentOrderRows[0]?.count || 0)
  const previousOrders = Number(previousOrderRows[0]?.count || 0)
  const currentUsers = Number(currentUserRows[0]?.count || 0)
  const previousUsers = Number(previousUserRows[0]?.count || 0)
  const pendingShopsCount = Number(pendingShopCountRows[0]?.count || 0)

  return {
    stats: {
      monthlyRevenue: currentRevenue,
      monthlyRevenueChange: formatPercentChange(currentRevenue, previousRevenue),
      monthlyPlatformFeeRevenue: currentPlatformFee,
      monthlyPlatformFeeRevenueChange: formatPercentChange(currentPlatformFee, previousPlatformFee),
      platformFeeRate,
      newOrders: currentOrders,
      newOrdersChange: formatPercentChange(currentOrders, previousOrders),
      newUsers: currentUsers,
      newUsersChange: formatPercentChange(currentUsers, previousUsers),
      pendingShops: pendingShopsCount,
      pendingActions: pendingShopsCount,
    },
    revenueTrend,
    revenueRange,
    platformFeeShops: platformFeeShopRows.map(toPlatformFeeShop),
    pendingShops: pendingShopRows.map(toPendingShop),
    notifications: notificationRows.map(toDashboardNotification),
    orders: {
      tabs: orderTabs,
      items: latestOrderRows.map(toDashboardOrder),
    },
  }
}

async function makeUniqueShopSlug(connection, baseSlug) {
  const base = baseSlug || `shop-${crypto.randomUUID().slice(0, 8)}`

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`
    const [rows] = await connection.execute('SELECT id FROM shops WHERE slug = ? LIMIT 1', [slug])
    if (!rows.length) return slug
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`
}

async function readApplications(status) {
  const where = []
  const params = []

  if (status && allowedApplicationStatuses.has(status)) {
    where.push('sa.status = ?')
    params.push(status)
  }

  const rows = await query(
    `SELECT
       sa.id, sa.user_id, sa.shop_id, sa.shop_name, sa.shop_slug, sa.contact_phone,
       sa.contact_email, sa.description, sa.address_line1, sa.province_id, sa.ward_id,
       sa.ward, sa.province, sa.country, sa.status, sa.reject_reason, sa.reviewed_by,
       sa.reviewed_at, sa.created_at, sa.updated_at,
       u.name AS user_name, u.email AS user_email, u.role AS user_role
     FROM shop_applications sa
     JOIN users u ON u.id = sa.user_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY FIELD(sa.status, 'pending', 'rejected', 'approved'), sa.created_at DESC
     LIMIT 100`,
    params,
  )

  return rows.map(toShopApplication)
}

module.exports = {
  query,
  transaction,
  asyncHandler,
  allowedUserRoles,
  createAdminCategory,
  createAdminVoucher,
  deleteAdminCategory,
  deleteAdminReview,
  deleteAdminVoucher,
  readAdminCategoriesData,
  readAdminReviewsData,
  readAdminVouchersData,
  readAdminShopsData,
  readAdminUsersData,
  readDashboardData,
  updateAdminShop,
  updateAdminReview,
  updateAdminCategory,
  updateAdminVoucher,
  makeUniqueShopSlug,
  readApplications,
}
