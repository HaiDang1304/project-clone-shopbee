const { crypto, query, slugify, toPositiveId } = require('./common')

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
    provinceId: row.province_id == null ? '' : Number(row.province_id),
    wardId: row.ward_id == null ? '' : Number(row.ward_id),
    ward: row.ward || '',
    province: row.province || '',
    country: row.country,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeShopApplicationPayload(body = {}) {
  const shopName = String(body.shopName || '').trim()
  const contactPhone = String(body.contactPhone || '').trim()
  const contactEmail = String(body.contactEmail || '').trim()
  const description = String(body.description || '').trim()
  const addressLine1 = String(body.addressLine1 || '').trim()
  const provinceId = toPositiveId(body.provinceId)
  const wardId = toPositiveId(body.wardId)
  const ward = String(body.ward || '').trim()
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

  if (!province && !provinceId) {
    const err = new Error('Vui lòng nhập tỉnh/thành phố của cửa hàng')
    err.status = 400
    throw err
  }

  if (!ward && !wardId) {
    const err = new Error('Vui lòng chọn phường/xã của cửa hàng')
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
    provinceId,
    wardId,
    ward: ward || null,
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

async function makeUniqueShopSlug(baseSlug) {
  const base = baseSlug || `shop-${crypto.randomUUID().slice(0, 8)}`

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`
    const rows = await query('SELECT id FROM shops WHERE slug = ? LIMIT 1', [slug])
    if (!rows.length) return slug
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`
}

async function readShopApplication(userId) {
  const rows = await query(
    `SELECT id, user_id, shop_id, shop_name, shop_slug, contact_phone, contact_email,
            description, address_line1, province_id, ward_id, ward, province, country, status,
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
    `SELECT s.id, s.name, s.slug, s.avatar_url, s.cover_url, s.description, s.address_line1,
            s.province_id, s.ward_id, s.ward,
            s.province, s.country, s.is_active, s.created_at, s.updated_at,
            sa.contact_phone, sa.contact_email
     FROM shops s
     JOIN users u ON u.id = s.owner_id
     LEFT JOIN shop_applications sa ON sa.shop_id = s.id AND sa.user_id = s.owner_id
     WHERE s.owner_id = ? AND s.is_active = 1 AND u.role = 'seller'
     ORDER BY s.id DESC
     LIMIT 1`,
    [userId],
  )

  return toSellerShop(rows[0])
}

module.exports = {
  toShopApplication,
  toSellerShop,
  normalizeShopApplicationPayload,
  normalizeShopProfilePayload,
  makeUniqueShopSlug,
  readShopApplication,
  readSellerShop,
}
