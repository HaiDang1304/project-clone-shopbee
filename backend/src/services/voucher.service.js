function normalizeVoucherCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function normalizeVoucherCodes(value) {
  const source = Array.isArray(value) ? value : String(value || '').split(/[,\n;]/)
  return [...new Set(source.map(normalizeVoucherCode).filter(Boolean))].slice(0, 5)
}

function toMoney(value) {
  return Math.max(0, Math.round(Number(value || 0)))
}

function mapVoucher(row) {
  return {
    id: Number(row.id),
    code: row.code,
    title: row.title,
    scope: row.scope,
    shopId: row.shop_id == null ? null : Number(row.shop_id),
    shopName: row.shop_name || '',
    discountType: row.discount_type,
    discountValue: Number(row.discount_value || 0),
    maxDiscountAmount: row.max_discount_amount == null ? null : Number(row.max_discount_amount),
    minOrderAmount: Number(row.min_order_amount || 0),
    usageLimit: row.usage_limit == null ? null : Number(row.usage_limit),
    perUserLimit: row.per_user_limit == null ? null : Number(row.per_user_limit),
    usedCount: Number(row.used_count || 0),
    startsAt: row.starts_at || null,
    endsAt: row.ends_at || null,
    isActive: Boolean(row.is_active),
  }
}

function subtotalByShop(lines) {
  return lines.reduce((result, line) => {
    result[line.shopId] = (result[line.shopId] || 0) + Number(line.lineTotal || 0)
    return result
  }, {})
}

function shippingByShop(shippingQuote) {
  return (shippingQuote?.shops || []).reduce((result, shop) => {
    result[Number(shop.shopId)] = Number(shop.shippingFee || 0)
    return result
  }, {})
}

function calculateVoucherDiscount(voucher, eligibleSubtotal, eligibleShipping) {
  if (eligibleSubtotal < voucher.minOrderAmount) return 0

  if (voucher.discountType === 'free_shipping') {
    const cap = voucher.maxDiscountAmount == null ? eligibleShipping : Math.min(eligibleShipping, voucher.maxDiscountAmount)
    return toMoney(cap)
  }

  if (voucher.discountType === 'percent') {
    const rawDiscount = Math.floor((eligibleSubtotal * voucher.discountValue) / 100)
    return toMoney(voucher.maxDiscountAmount == null ? rawDiscount : Math.min(rawDiscount, voucher.maxDiscountAmount))
  }

  return toMoney(Math.min(voucher.discountValue, eligibleSubtotal))
}

async function calculateVoucherDiscounts(connection, { userId, codes, lines, shippingQuote }) {
  const normalizedCodes = normalizeVoucherCodes(codes)
  if (!normalizedCodes.length) {
    return {
      codes: [],
      applied: [],
      rejected: [],
      discountTotal: 0,
      platformDiscountTotal: 0,
      shopDiscountTotal: 0,
      shippingDiscountTotal: 0,
      shopDiscounts: {},
    }
  }

  const placeholders = normalizedCodes.map(() => '?').join(', ')
  const [voucherRows] = await connection.execute(
    `SELECT v.*, s.name AS shop_name
     FROM vouchers v
     LEFT JOIN shops s ON s.id = v.shop_id
     WHERE v.code IN (${placeholders})`,
    normalizedCodes,
  )
  const vouchersByCode = new Map(voucherRows.map((row) => [row.code, mapVoucher(row)]))
  const [usageRows] = voucherRows.length
    ? await connection.execute(
        `SELECT voucher_id, COUNT(*) AS user_count
         FROM voucher_redemptions
         WHERE user_id = ? AND voucher_id IN (${voucherRows.map(() => '?').join(', ')})
         GROUP BY voucher_id`,
        [userId, ...voucherRows.map((row) => row.id)],
      )
    : [[]]
  const userUsageByVoucher = new Map(usageRows.map((row) => [Number(row.voucher_id), Number(row.user_count || 0)]))
  const [claimedRows] = voucherRows.length
    ? await connection.execute(
        `SELECT voucher_id
         FROM user_vouchers
         WHERE user_id = ? AND voucher_id IN (${voucherRows.map(() => '?').join(', ')})`,
        [userId, ...voucherRows.map((row) => row.id)],
      )
    : [[]]
  const claimedVoucherIds = new Set(claimedRows.map((row) => Number(row.voucher_id)))
  const itemsTotal = lines.reduce((sum, line) => sum + Number(line.lineTotal || 0), 0)
  const subtotalMap = subtotalByShop(lines)
  const shippingMap = shippingByShop(shippingQuote)
  const applied = []
  const rejected = []
  const shopDiscounts = {}
  let platformItemDiscount = 0
  let platformDiscountTotal = 0
  let shopDiscountTotal = 0
  let shippingDiscountTotal = 0

  normalizedCodes.forEach((code) => {
    const voucher = vouchersByCode.get(code)
    if (!voucher) {
      rejected.push({ code, reason: 'Mã voucher không tồn tại' })
      return
    }
    if (!claimedVoucherIds.has(voucher.id)) {
      rejected.push({ code, reason: 'Bạn chưa lưu voucher này' })
      return
    }
    if (!voucher.isActive) {
      rejected.push({ code, reason: 'Voucher đang tạm tắt' })
      return
    }
    const now = new Date()
    if (voucher.startsAt && new Date(voucher.startsAt) > now) {
      rejected.push({ code, reason: 'Voucher chưa đến thời gian sử dụng' })
      return
    }
    if (voucher.endsAt && new Date(voucher.endsAt) < now) {
      rejected.push({ code, reason: 'Voucher đã hết hạn' })
      return
    }
    if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
      rejected.push({ code, reason: 'Voucher đã hết lượt sử dụng' })
      return
    }
    if (voucher.perUserLimit !== null && (userUsageByVoucher.get(voucher.id) || 0) >= voucher.perUserLimit) {
      rejected.push({ code, reason: 'Bạn đã dùng voucher này tối đa số lần cho phép' })
      return
    }

    const eligibleSubtotal =
      voucher.scope === 'shop'
        ? Number(subtotalMap[voucher.shopId] || 0) - Number(shopDiscounts[voucher.shopId] || 0)
        : Math.max(0, itemsTotal - shopDiscountTotal - platformItemDiscount)
    const eligibleShipping =
      voucher.scope === 'shop'
        ? Number(shippingMap[voucher.shopId] || 0)
        : Number(shippingQuote?.totalShippingFee || 0) - shippingDiscountTotal

    if (voucher.scope === 'shop' && eligibleSubtotal <= 0 && voucher.discountType !== 'free_shipping') {
      rejected.push({ code, reason: 'Giỏ hàng không có sản phẩm của shop áp dụng voucher' })
      return
    }

    const discountAmount = calculateVoucherDiscount(voucher, eligibleSubtotal, eligibleShipping)
    if (discountAmount <= 0) {
      rejected.push({ code, reason: 'Đơn hàng chưa đạt điều kiện áp dụng voucher' })
      return
    }

    if (voucher.discountType === 'free_shipping') {
      shippingDiscountTotal += discountAmount
    } else if (voucher.scope === 'shop') {
      shopDiscounts[voucher.shopId] = Number(shopDiscounts[voucher.shopId] || 0) + discountAmount
      shopDiscountTotal += discountAmount
    } else {
      platformItemDiscount += discountAmount
      platformDiscountTotal += discountAmount
    }

    applied.push({
      id: voucher.id,
      code: voucher.code,
      title: voucher.title,
      scope: voucher.scope,
      shopId: voucher.shopId,
      shopName: voucher.shopName,
      discountType: voucher.discountType,
      discountAmount,
    })
  })

  return {
    codes: normalizedCodes,
    applied,
    rejected,
    discountTotal: toMoney(platformDiscountTotal + shopDiscountTotal + shippingDiscountTotal),
    platformDiscountTotal: toMoney(platformDiscountTotal),
    shopDiscountTotal: toMoney(shopDiscountTotal),
    shippingDiscountTotal: toMoney(shippingDiscountTotal),
    shopDiscounts,
  }
}

module.exports = {
  calculateVoucherDiscounts,
  normalizeVoucherCode,
  normalizeVoucherCodes,
}
