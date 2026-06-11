const crypto = require('crypto')

const { query, transaction } = require('../../config/db')
const { asyncHandler } = require('../../middleware/error')
const { buildDailyRevenueTrend, normalizeRevenueRange } = require('../../utils/revenue-range')

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
  deleteAdminCategory,
  deleteAdminReview,
  readAdminCategoriesData,
  readAdminReviewsData,
  readAdminShopsData,
  readAdminUsersData,
  readDashboardData,
  updateAdminReview,
  updateAdminCategory,
  makeUniqueShopSlug,
  readApplications,
}
