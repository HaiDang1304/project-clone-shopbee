const express = require('express')
const jwt = require('jsonwebtoken')

const { query } = require('../config/db')
const { requireAuth } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/error')

const router = express.Router()

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
    usedCount: Number(row.used_count || 0),
    startsAt: row.starts_at || null,
    endsAt: row.ends_at || null,
    claimed: Boolean(row.claimed_at),
    claimedAt: row.claimed_at || null,
  }
}

async function readOptionalUserId(req) {
  const header = req.get('authorization') || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token || !process.env.JWT_SECRET) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const rows = await query('SELECT id FROM users WHERE id = ? AND is_active = 1 LIMIT 1', [Number(decoded.sub)])
    return rows[0]?.id ? Number(rows[0].id) : null
  } catch {
    return null
  }
}

async function readVoucherList(userId, { claimedOnly = false } = {}) {
  const claimedJoin = userId
    ? 'LEFT JOIN user_vouchers uv ON uv.voucher_id = v.id AND uv.user_id = ?'
    : 'LEFT JOIN user_vouchers uv ON 1 = 0'
  const claimedWhere = claimedOnly ? 'AND uv.id IS NOT NULL' : ''
  const params = userId ? [userId] : []

  return query(
    `SELECT v.*, s.name AS shop_name, uv.claimed_at
     FROM vouchers v
     LEFT JOIN shops s ON s.id = v.shop_id
     ${claimedJoin}
     WHERE v.is_active = 1
       AND (v.starts_at IS NULL OR v.starts_at <= NOW())
       AND (v.ends_at IS NULL OR v.ends_at >= NOW())
       AND (v.usage_limit IS NULL OR v.used_count < v.usage_limit)
       ${claimedWhere}
     ORDER BY v.scope ASC, v.created_at DESC`,
    params,
  )
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = await readOptionalUserId(req)
    const rows = await readVoucherList(userId)
    const vouchers = rows.map(mapVoucher)

    return res.json({
      ok: true,
      data: {
        platform: vouchers.filter((voucher) => voucher.scope === 'platform'),
        shop: vouchers.filter((voucher) => voucher.scope === 'shop'),
        items: vouchers,
      },
    })
  }),
)

router.get(
  '/my',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const rows = await readVoucherList(userId, { claimedOnly: true })
    const vouchers = rows.map(mapVoucher)

    return res.json({
      ok: true,
      data: {
        platform: vouchers.filter((voucher) => voucher.scope === 'platform'),
        shop: vouchers.filter((voucher) => voucher.scope === 'shop'),
        items: vouchers,
      },
    })
  }),
)

router.post(
  '/:voucherId/claim',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const voucherId = Number(req.params.voucherId)
    if (!Number.isSafeInteger(voucherId) || voucherId <= 0) {
      return res.status(400).json({ ok: false, message: 'Voucher không hợp lệ' })
    }

    const rows = await query(
      `SELECT id
       FROM vouchers
       WHERE id = ?
         AND is_active = 1
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (ends_at IS NULL OR ends_at >= NOW())
         AND (usage_limit IS NULL OR used_count < usage_limit)
       LIMIT 1`,
      [voucherId],
    )

    if (!rows.length) return res.status(404).json({ ok: false, message: 'Voucher không còn khả dụng' })

    await query('INSERT IGNORE INTO user_vouchers (voucher_id, user_id) VALUES (?, ?)', [voucherId, userId])

    const nextRows = await readVoucherList(userId)
    const vouchers = nextRows.map(mapVoucher)
    return res.json({
      ok: true,
      data: {
        platform: vouchers.filter((voucher) => voucher.scope === 'platform'),
        shop: vouchers.filter((voucher) => voucher.scope === 'shop'),
        items: vouchers,
      },
      message: 'Đã lưu voucher',
    })
  }),
)

module.exports = router
