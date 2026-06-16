const { query } = require('./common')
const { normalizeVoucherCode } = require('../../../services/voucher.service')

function toSellerVoucher(row) {
  return {
    id: Number(row.id),
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

function throwVoucherError(message, status = 400) {
  const err = new Error(message)
  err.status = status
  throw err
}

function toNullablePositiveNumber(value, fieldName) {
  if (value === undefined || value === null || value === '') return null
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throwVoucherError(`${fieldName} không hợp lệ`)
  }
  return numberValue
}

function toNullablePositiveInteger(value, fieldName) {
  if (value === undefined || value === null || value === '') return null
  const numberValue = Number(value)
  if (!Number.isSafeInteger(numberValue) || numberValue <= 0) {
    throwVoucherError(`${fieldName} không hợp lệ`)
  }
  return numberValue
}

function normalizeDateTimeInput(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throwVoucherError('Thời gian voucher không hợp lệ')
  return date
}

function normalizeSellerVoucherPayload(body = {}, shopId, { partial = false } = {}) {
  const payload = {
    scope: 'shop',
    shopId,
  }

  if (!partial || body.code !== undefined) {
    const code = normalizeVoucherCode(body.code)
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
      throwVoucherError('Mã voucher phải từ 3 đến 40 ký tự, chỉ gồm chữ, số, _ hoặc -')
    }
    payload.code = code
  }

  if (!partial || body.title !== undefined) {
    const title = String(body.title || '').trim()
    if (!title || title.length > 160) throwVoucherError('Tên chương trình voucher không hợp lệ')
    payload.title = title
  }

  if (!partial || body.discountType !== undefined) {
    const discountType = ['percent', 'fixed', 'free_shipping'].includes(body.discountType) ? body.discountType : ''
    if (!discountType) throwVoucherError('Kiểu giảm giá không hợp lệ')
    payload.discountType = discountType
  }

  if (!partial || body.discountValue !== undefined) {
    const discountValue = Number(body.discountValue || 0)
    if (!Number.isFinite(discountValue) || discountValue < 0 || discountValue > 100000000) {
      throwVoucherError('Giá trị giảm giá không hợp lệ')
    }
    payload.discountValue = discountValue
  }

  if (!partial || body.maxDiscountAmount !== undefined) {
    payload.maxDiscountAmount = toNullablePositiveNumber(body.maxDiscountAmount, 'Mức giảm tối đa')
  }

  if (!partial || body.minOrderAmount !== undefined) {
    const minOrderAmount = Number(body.minOrderAmount || 0)
    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
      throwVoucherError('Giá trị đơn tối thiểu không hợp lệ')
    }
    payload.minOrderAmount = minOrderAmount
  }

  if (!partial || body.usageLimit !== undefined) payload.usageLimit = toNullablePositiveInteger(body.usageLimit, 'Tổng lượt dùng')
  if (!partial || body.perUserLimit !== undefined) payload.perUserLimit = toNullablePositiveInteger(body.perUserLimit, 'Lượt dùng mỗi người')
  if (!partial || body.startsAt !== undefined) payload.startsAt = normalizeDateTimeInput(body.startsAt)
  if (!partial || body.endsAt !== undefined) payload.endsAt = normalizeDateTimeInput(body.endsAt)
  if (!partial || body.isActive !== undefined) payload.isActive = body.isActive === undefined ? true : Boolean(body.isActive)

  const nextDiscountType = payload.discountType || body.discountType
  if (nextDiscountType === 'percent' && payload.discountValue > 100) {
    throwVoucherError('Voucher phần trăm không được vượt quá 100%')
  }
  if (payload.startsAt && payload.endsAt && payload.startsAt > payload.endsAt) {
    throwVoucherError('Thời gian bắt đầu không được lớn hơn thời gian kết thúc')
  }

  return payload
}

function voucherDateParam(value) {
  return value ? new Date(value) : null
}

async function readSellerVouchersData(shopId) {
  const rows = await query(
    `SELECT v.*, s.name AS shop_name
     FROM vouchers v
     JOIN shops s ON s.id = v.shop_id
     WHERE v.scope = 'shop' AND v.shop_id = ?
     ORDER BY v.created_at DESC, v.id DESC
     LIMIT 200`,
    [shopId],
  )
  const items = rows.map(toSellerVoucher)

  return {
    stats: {
      total: items.length,
      active: items.filter((voucher) => voucher.isActive).length,
      inactive: items.filter((voucher) => !voucher.isActive).length,
      used: items.reduce((sum, voucher) => sum + Number(voucher.usedCount || 0), 0),
    },
    items,
  }
}

async function createSellerVoucher(shopId, body) {
  const payload = normalizeSellerVoucherPayload(body, shopId)

  try {
    await query(
      `INSERT INTO vouchers
         (code, title, scope, shop_id, discount_type, discount_value, max_discount_amount,
          min_order_amount, usage_limit, per_user_limit, starts_at, ends_at, is_active)
       VALUES (?, ?, 'shop', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.code,
        payload.title,
        shopId,
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
      err.message = 'Mã voucher đã tồn tại'
    }
    throw err
  }

  return readSellerVouchersData(shopId)
}

async function updateSellerVoucher(shopId, voucherId, body) {
  const id = Number(voucherId)
  if (!Number.isSafeInteger(id) || id <= 0) throwVoucherError('Voucher không hợp lệ')

  const existingRows = await query('SELECT * FROM vouchers WHERE id = ? AND scope = ? AND shop_id = ? LIMIT 1', [id, 'shop', shopId])
  const current = existingRows[0]
  if (!current) throwVoucherError('Không tìm thấy voucher của cửa hàng', 404)

  const payload = normalizeSellerVoucherPayload(body, shopId, { partial: true })
  const nextDiscountType = payload.discountType || current.discount_type
  const nextDiscountValue = payload.discountValue === undefined ? Number(current.discount_value || 0) : payload.discountValue
  if (nextDiscountType === 'percent' && nextDiscountValue > 100) {
    throwVoucherError('Voucher phần trăm không được vượt quá 100%')
  }
  const fields = []
  const params = []
  const fieldMap = {
    code: 'code',
    title: 'title',
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

  if (!fields.length) return readSellerVouchersData(shopId)

  try {
    await query(`UPDATE vouchers SET ${fields.join(', ')}, scope = 'shop', shop_id = ?, updated_at = NOW() WHERE id = ? AND shop_id = ?`, [
      ...params,
      shopId,
      id,
      shopId,
    ])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      err.status = 409
      err.message = 'Mã voucher đã tồn tại'
    }
    throw err
  }

  return readSellerVouchersData(shopId)
}

async function deleteSellerVoucher(shopId, voucherId) {
  const id = Number(voucherId)
  if (!Number.isSafeInteger(id) || id <= 0) throwVoucherError('Voucher không hợp lệ')

  await query('DELETE FROM vouchers WHERE id = ? AND scope = ? AND shop_id = ?', [id, 'shop', shopId])
  return readSellerVouchersData(shopId)
}

module.exports = {
  createSellerVoucher,
  deleteSellerVoucher,
  readSellerVouchersData,
  updateSellerVoucher,
}
