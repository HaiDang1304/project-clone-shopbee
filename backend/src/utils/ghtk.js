const DEFAULT_GHTK_FEE_URL = 'https://services.giaohangtietkiem.vn/services/shipment/fee'

function requiredConfig(name) {
  const value = String(process.env[name] || '').trim()
  return value || null
}

function toPositiveInteger(value) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : null
}

function buildPickupParams() {
  const pickAddressId = requiredConfig('GHTK_PICK_ADDRESS_ID')
  if (pickAddressId) return { pick_address_id: pickAddressId }

  const pickProvince = requiredConfig('GHTK_PICK_PROVINCE')
  const pickDistrict = requiredConfig('GHTK_PICK_DISTRICT')

  if (!pickProvince || !pickDistrict) {
    const err = new Error('Thiếu cấu hình GHTK_PICK_PROVINCE/GHTK_PICK_DISTRICT hoặc GHTK_PICK_ADDRESS_ID')
    err.status = 500
    throw err
  }

  return {
    pick_address: requiredConfig('GHTK_PICK_ADDRESS') || undefined,
    pick_province: pickProvince,
    pick_district: pickDistrict,
    pick_ward: requiredConfig('GHTK_PICK_WARD') || undefined,
    pick_street: requiredConfig('GHTK_PICK_STREET') || undefined,
  }
}

async function calculateGhtkShippingFee({ address, province, district, ward, weight, value, transport = 'road' }) {
  const token = requiredConfig('GHTK_TOKEN')
  if (!token) {
    const err = new Error('Thiếu cấu hình GHTK_TOKEN')
    err.status = 500
    throw err
  }

  const weightGrams = toPositiveInteger(weight)
  if (!weightGrams) {
    const err = new Error('Khối lượng đơn hàng không hợp lệ')
    err.status = 400
    throw err
  }

  if (!province || !district) {
    const err = new Error('Địa chỉ giao hàng cần có tỉnh/thành phố và quận/huyện để tính phí GHTK')
    err.status = 400
    throw err
  }

  const params = new URLSearchParams()
  const payload = {
    ...buildPickupParams(),
    address: address || undefined,
    province,
    district,
    ward: ward || undefined,
    weight: String(weightGrams),
    value: String(Math.max(0, Math.round(Number(value || 0)))),
    transport,
  }

  Object.entries(payload).forEach(([key, currentValue]) => {
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      params.set(key, String(currentValue))
    }
  })

  const response = await fetch(`${process.env.GHTK_FEE_URL || DEFAULT_GHTK_FEE_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      Token: token,
      ...(process.env.GHTK_PARTNER_CODE ? { 'X-Client-Source': process.env.GHTK_PARTNER_CODE } : {}),
    },
  })
  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.success) {
    const err = new Error(data?.message || 'Không tính được phí vận chuyển GHTK')
    err.status = response.ok ? 400 : response.status
    err.details = data || null
    throw err
  }

  return {
    provider: 'ghtk',
    fee: Number(data.fee?.fee || 0),
    insuranceFee: Number(data.fee?.insurance_fee || 0),
    delivery: Boolean(data.fee?.delivery),
    raw: data.fee,
  }
}

module.exports = { calculateGhtkShippingFee }
