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
const maxAvatarSize = 10 * 1024 * 1024
const allowedGenders = new Set(['male', 'female', 'other'])

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
