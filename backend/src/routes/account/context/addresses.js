const { normalizePhoneNumber, query, toPositiveId } = require('./common')

function toAddress(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    line1: row.line1,
    provinceId: row.province_id == null ? '' : Number(row.province_id),
    wardId: row.ward_id == null ? '' : Number(row.ward_id),
    ward: row.ward || '',
    province: row.province,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeAddressPayload(body = {}) {
  const fullName = String(body.fullName || '').trim()
  const phone = normalizePhoneNumber(body.phone)
  const line1 = String(body.line1 || '').trim()
  const provinceId = toPositiveId(body.provinceId)
  const wardId = toPositiveId(body.wardId)
  const ward = String(body.ward || '').trim()
  const province = String(body.province || '').trim()
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

  if (!province && !provinceId) {
    const err = new Error('Vui lòng nhập tỉnh/thành phố')
    err.status = 400
    throw err
  }

  if (!ward && !wardId) {
    const err = new Error('Vui lòng chọn phường/xã')
    err.status = 400
    throw err
  }

  return {
    fullName,
    phone,
    line1,
    provinceId,
    wardId,
    ward: ward || null,
    province,
    isDefault,
  }
}

async function readAddresses(userId) {
  const rows = await query(
    `SELECT id, full_name, phone, line1, province_id, ward_id,
            ward, province, is_default, created_at, updated_at
     FROM user_addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, updated_at DESC, id DESC`,
    [userId],
  )

  return rows.map(toAddress)
}

module.exports = {
  toAddress,
  normalizeAddressPayload,
  readAddresses,
}
