const crypto = require('crypto')

const PAYOS_API_BASE_URL = 'https://api-merchant.payos.vn'

function getPayosConfig() {
  const fallbackFrontendUrl =
    process.env.FRONTEND_URL || (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*' ? process.env.CORS_ORIGIN : '') || 'http://localhost:5173'

  return {
    clientId: process.env.PAYOS_CLIENT_ID || '',
    apiKey: process.env.PAYOS_API_KEY || '',
    checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
    returnUrl: process.env.PAYOS_RETURN_URL || '',
    cancelUrl: process.env.PAYOS_CANCEL_URL || '',
    frontendUrl: fallbackFrontendUrl,
  }
}

function assertPayosConfig(config) {
  if (!config.clientId || !config.apiKey || !config.checksumKey) {
    const err = new Error('Chưa cấu hình PAYOS_CLIENT_ID, PAYOS_API_KEY hoặc PAYOS_CHECKSUM_KEY')
    err.status = 500
    throw err
  }
}

function createSignature(data, checksumKey) {
  const rawData = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key] ?? ''}`)
    .join('&')

  return crypto.createHmac('sha256', checksumKey).update(rawData).digest('hex')
}

function buildPayosItems(order) {
  const items = Array.isArray(order?.items) ? order.items : []
  if (!items.length) {
    return [
      {
        name: `Don hang #${order.id}`,
        quantity: 1,
        price: Number(order.grandTotal || 0),
      },
    ]
  }

  return items.slice(0, 20).map((item) => ({
    name: String(item.name || `San pham #${item.productId || item.id || ''}`).slice(0, 255),
    quantity: Math.max(1, Number(item.quantity || 1)),
    price: Math.max(0, Math.round(Number(item.unitPrice || 0))),
  }))
}

function buildOrderUrl(baseUrl, orderId, status) {
  const url = new URL('/order-success', baseUrl)
  url.searchParams.set('orderId', String(orderId))
  if (status) url.searchParams.set('paymentStatus', status)
  return url.toString()
}

async function createPayosPaymentLink(order) {
  const config = getPayosConfig()
  assertPayosConfig(config)

  const amount = Math.round(Number(order.grandTotal || 0))
  const orderCode = Number(order.id)
  const description = `DH${orderCode}`
  const returnUrl = config.returnUrl || buildOrderUrl(config.frontendUrl, orderCode, 'success')
  const cancelUrl = config.cancelUrl || buildOrderUrl(config.frontendUrl, orderCode, 'cancel')
  const expiredAt = order.paymentExpiresAt
    ? Math.floor(new Date(order.paymentExpiresAt).getTime() / 1000)
    : Math.floor(Date.now() / 1000) + 5 * 60
  const signaturePayload = {
    amount,
    cancelUrl,
    description,
    orderCode,
    returnUrl,
  }

  const body = {
    ...signaturePayload,
    buyerName: order.shipping?.fullName || '',
    buyerEmail: order.customerEmail || '',
    buyerPhone: order.shipping?.phone || '',
    buyerAddress: [order.shipping?.line1, order.shipping?.ward, order.shipping?.province, order.shipping?.country].filter(Boolean).join(', '),
    items: buildPayosItems(order),
    expiredAt,
    signature: createSignature(signaturePayload, config.checksumKey),
  }

  const response = await fetch(`${PAYOS_API_BASE_URL}/v2/payment-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': config.clientId,
      'x-api-key': config.apiKey,
    },
    body: JSON.stringify(body),
  })
  const result = await response.json().catch(() => null)

  if (!response.ok || result?.code !== '00') {
    const err = new Error(result?.desc || result?.message || 'Không tạo được mã QR PayOS')
    err.status = response.status || 502
    err.data = result
    throw err
  }

  return {
    provider: 'payos',
    orderCode,
    amount,
    description,
    checkoutUrl: result.data?.checkoutUrl || '',
    qrCode: result.data?.qrCode || '',
    paymentLinkId: result.data?.paymentLinkId || result.data?.id || '',
    status: result.data?.status || '',
    expiresAt: order.paymentExpiresAt || new Date(expiredAt * 1000).toISOString(),
  }
}

function verifyPayosWebhook(data, signature) {
  const config = getPayosConfig()
  assertPayosConfig(config)
  if (!data || !signature) return false
  return createSignature(data, config.checksumKey) === signature
}

module.exports = {
  createSignature,
  createPayosPaymentLink,
  verifyPayosWebhook,
}
