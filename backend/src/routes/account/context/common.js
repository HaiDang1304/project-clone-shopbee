const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const { query, transaction } = require('../../../config/db')
const { asyncHandler } = require('../../../middleware/error')
const { createNotification } = require('../../../utils/notifications')
const { signUserToken } = require('../../../utils/jwt')

const platformFeeRate = 0.05
const allowedGenders = new Set(['male', 'female', 'other'])
const allowedProductStatuses = new Set(['draft', 'active', 'hidden'])
const buyerOrderStatusNotifications = {
  processing: {
    title: 'Đơn hàng đã được xác nhận',
    message: (orderId) => `Người bán đã xác nhận đơn hàng #${orderId} và đang chuẩn bị hàng.`,
  },
  shipping: {
    title: 'Đơn hàng đang giao',
    message: (orderId) => `Đơn hàng #${orderId} đang trên đường giao đến bạn.`,
  },
  delivered: {
    title: 'Đơn hàng đã giao thành công',
    message: (orderId) => `Đơn hàng #${orderId} đã được xác nhận giao thành công.`,
  },
  cancelled: {
    title: 'Đơn hàng đã bị hủy',
    message: (orderId) => `Đơn hàng #${orderId} đã được cập nhật sang trạng thái đã hủy.`,
  },
}

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

function throwStatus(message, status = 400) {
  const err = new Error(message)
  err.status = status
  throw err
}

function normalizePhoneNumber(value, message = 'Số điện thoại phải gồm đúng 10 chữ số') {
  const phone = String(value || '').trim()
  if (!/^[0-9]{10}$/.test(phone)) {
    throwStatus(message)
  }

  return phone
}

function toPositiveId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
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

module.exports = {
  bcrypt,
  crypto,
  query,
  transaction,
  asyncHandler,
  createNotification,
  signUserToken,
  platformFeeRate,
  allowedGenders,
  allowedProductStatuses,
  buyerOrderStatusNotifications,
  slugify,
  formatDateKey,
  addDays,
  formatTrendLabel,
  throwStatus,
  normalizePhoneNumber,
  toPositiveId,
  safeParseJson,
  normalizeProductOptionValues,
  normalizeProductOptions,
  normalizeSelectedOptions,
}
