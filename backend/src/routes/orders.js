const express = require('express')

const { query, transaction } = require('../config/db')
const { requireAuth } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/error')
const { createNotification } = require('../utils/notifications')
const { calculateShippingForCart } = require('../services/shipping.service')

const router = express.Router()
const allowedPaymentMethods = new Set(['cod', 'bank', 'momo', 'vnpay'])

function safeParseJson(value, fallback) {
  if (!value) return fallback
  if (typeof value === 'object') return value

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
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

function toPositiveId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function throwStatus(message, status = 400) {
  const err = new Error(message)
  err.status = status
  throw err
}

function getAggregateDistanceType(shops = []) {
  const priority = ['SAME_WARD', 'SAME_PROVINCE', 'SAME_REGION', 'DIFFERENT_REGION']
  return shops.reduce((result, shop) => {
    const currentIndex = priority.indexOf(result)
    const nextIndex = priority.indexOf(shop.distanceType)
    if (nextIndex < 0) return result
    if (currentIndex < 0) return shop.distanceType
    return nextIndex > currentIndex ? shop.distanceType : result
  }, 'SAME_WARD')
}

function toCheckoutLine(row, quantity, selectedOptions) {
  const hasVariant = row.variantId !== null && row.variantId !== undefined
  const variantOptions = normalizeSelectedOptions(row.variantAttributes)
  const finalSelectedOptions = Object.keys(normalizeSelectedOptions(selectedOptions)).length
    ? normalizeSelectedOptions(selectedOptions)
    : variantOptions
  const stock = Number(hasVariant ? row.variantStock : row.productStock)
  const unitPrice = Number(hasVariant ? row.variantPrice : row.productPrice)
  const lineQuantity = Number(quantity)
  const weightGrams = Number(row.weightGrams || 0)

  if (Number(row.isActive) !== 1 || row.status !== 'active') {
    throwStatus(`Sản phẩm "${row.name}" đã ngừng bán`)
  }

  if (!Number.isSafeInteger(lineQuantity) || lineQuantity < 1) {
    throwStatus(`Số lượng của "${row.name}" không hợp lệ`)
  }

  if (lineQuantity > stock) {
    throwStatus(`Số lượng "${row.name}" vượt quá tồn kho`)
  }

  if (!Number.isFinite(weightGrams) || weightGrams <= 0) {
    throwStatus(`Sản phẩm "${row.name}" chưa có khối lượng để tính phí vận chuyển`)
  }

  return {
    cartItemId: row.cartItemId == null ? null : Number(row.cartItemId),
    productId: Number(row.productId),
    shopId: Number(row.shopId),
    name: row.name,
    imageUrl: row.imageUrl || '',
    variantId: hasVariant ? Number(row.variantId) : null,
    variantSku: row.variantSku || '',
    selectedOptions: finalSelectedOptions,
    unitPrice,
    quantity: lineQuantity,
    weightGrams,
    lineTotal: unitPrice * lineQuantity,
    shopName: row.shopName || '',
    shopAddress: {
      provinceId: row.shopProvinceId == null ? null : Number(row.shopProvinceId),
      wardId: row.shopWardId == null ? null : Number(row.shopWardId),
      region: row.shopRegion || '',
      zoneType: row.shopZoneType || 'NORMAL',
    },
  }
}

async function calculateShippingForLines(address, lines) {
  try {
    return calculateShippingForCart(lines, address)
  } catch (err) {
    throwStatus(err.message || 'Khong tinh duoc phi van chuyen')
  }
}

async function readAddress(connection, userId, addressId) {
  const [rows] = await connection.execute(
    `SELECT ua.id, ua.full_name AS fullName, ua.phone, ua.line1,
            ua.province_id AS provinceId, ua.ward_id AS wardId,
            ua.ward, ua.province,
            p.region, w.zone_type AS zoneType
     FROM user_addresses ua
     LEFT JOIN provinces p ON p.id = ua.province_id
     LEFT JOIN wards w ON w.id = ua.ward_id
     WHERE ua.id = ? AND ua.user_id = ?
     LIMIT 1`,
    [addressId, userId],
  )

  return rows[0] || null
}

async function readCartLines(connection, userId, cartItemIds) {
  const ids = [...new Set(cartItemIds.map(toPositiveId).filter(Boolean))]
  if (!ids.length) throwStatus('Vui lòng chọn sản phẩm cần thanh toán')

  const placeholders = ids.map(() => '?').join(', ')
  const [rows] = await connection.execute(
    `SELECT
       ci.id AS cartItemId,
       ci.product_id AS productId,
       ci.variant_id AS variantId,
       ci.selected_options AS selectedOptions,
       ci.quantity,
       p.name,
       p.shop_id AS shopId,
       s.name AS shopName,
       s.province_id AS shopProvinceId,
       s.ward_id AS shopWardId,
       sp.region AS shopRegion,
       sw.zone_type AS shopZoneType,
       p.price AS productPrice,
       p.stock AS productStock,
       p.weight_grams AS weightGrams,
       p.is_active AS isActive,
       p.status,
       pv.price AS variantPrice,
       pv.stock AS variantStock,
       pv.sku AS variantSku,
       pv.attributes AS variantAttributes,
       COALESCE(pv.image_url, p.thumbnail_url,
         (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1)
       ) AS imageUrl
     FROM cart_items ci
     JOIN carts cart ON cart.id = ci.cart_id
     JOIN products p ON p.id = ci.product_id
     JOIN shops s ON s.id = p.shop_id
     LEFT JOIN provinces sp ON sp.id = s.province_id
     LEFT JOIN wards sw ON sw.id = s.ward_id
     LEFT JOIN product_variants pv ON pv.id = ci.variant_id
     WHERE cart.user_id = ? AND ci.id IN (${placeholders})`,
    [userId, ...ids],
  )

  if (rows.length !== ids.length) throwStatus('Giỏ hàng đã thay đổi, vui lòng kiểm tra lại')

  const rowsById = new Map(rows.map((row) => [Number(row.cartItemId), row]))
  return ids.map((id) => {
    const row = rowsById.get(id)
    return toCheckoutLine(row, Number(row.quantity), row.selectedOptions)
  })
}

async function readDirectLines(connection, items) {
  const normalizedItems = Array.isArray(items)
    ? items
        .map((item) => ({
          productId: toPositiveId(item?.productId),
          variantId: item?.variantId == null ? null : toPositiveId(item.variantId),
          quantity: Number.parseInt(item?.quantity || 1, 10),
          selectedOptions: normalizeSelectedOptions(item?.selectedOptions),
        }))
        .filter((item) => item.productId)
    : []

  if (!normalizedItems.length) throwStatus('Không có sản phẩm để thanh toán')

  const lines = []

  for (const item of normalizedItems) {
    const [rows] = await connection.execute(
      `SELECT
         p.id AS productId,
         p.name,
         p.shop_id AS shopId,
         s.name AS shopName,
         s.province_id AS shopProvinceId,
         s.ward_id AS shopWardId,
         sp.region AS shopRegion,
         sw.zone_type AS shopZoneType,
         p.price AS productPrice,
         p.stock AS productStock,
         p.weight_grams AS weightGrams,
         p.is_active AS isActive,
         p.status,
         pv.id AS variantId,
         pv.price AS variantPrice,
         pv.stock AS variantStock,
         pv.sku AS variantSku,
         pv.attributes AS variantAttributes,
         COALESCE(pv.image_url, p.thumbnail_url,
           (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1)
         ) AS imageUrl
       FROM products p
       JOIN shops s ON s.id = p.shop_id
       LEFT JOIN provinces sp ON sp.id = s.province_id
       LEFT JOIN wards sw ON sw.id = s.ward_id
       LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.id = ?
       WHERE p.id = ?
       LIMIT 1`,
      [item.variantId || 0, item.productId],
    )

    const row = rows[0]
    if (!row) throwStatus('Sản phẩm không tồn tại', 404)
    if (item.variantId && !row.variantId) throwStatus('Phiên bản sản phẩm không tồn tại', 404)

    lines.push(toCheckoutLine(row, item.quantity, item.selectedOptions))
  }

  return lines
}

async function insertOrderItems(connection, orderId, lines) {
  for (const line of lines) {
    await connection.execute(
      `INSERT INTO order_items
         (order_id, product_id, shop_id, name, image_url, variant_id, variant_sku,
          selected_options, unit_price, quantity, line_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        line.productId,
        line.shopId,
        line.name,
        line.imageUrl || null,
        line.variantId,
        line.variantSku || null,
        JSON.stringify(line.selectedOptions || {}),
        line.unitPrice,
        line.quantity,
        line.lineTotal,
      ],
    )
  }
}

async function insertOrderShopSnapshots(connection, orderId, shops) {
  for (const shop of shops) {
    await connection.execute(
      `INSERT INTO order_shops
         (order_id, shop_id, shop_name, shop_subtotal, total_weight_grams, distance_type, shipping_fee, shop_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        shop.shopId,
        shop.shopName || '',
        shop.shopSubtotal,
        shop.totalWeightGrams,
        shop.distanceType,
        shop.shippingFee,
        shop.shopTotal,
      ],
    )
  }
}

async function updateInventory(connection, lines) {
  for (const line of lines) {
    if (line.variantId) {
      const [result] = await connection.execute(
        'UPDATE product_variants SET stock = stock - ?, updated_at = NOW() WHERE id = ? AND stock >= ?',
        [line.quantity, line.variantId, line.quantity],
      )
      if (!result.affectedRows) throwStatus(`Số lượng "${line.name}" vượt quá tồn kho`)
    } else {
      const [result] = await connection.execute(
        'UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ? AND stock >= ?',
        [line.quantity, line.productId, line.quantity],
      )
      if (!result.affectedRows) throwStatus(`Số lượng "${line.name}" vượt quá tồn kho`)
    }

    await connection.execute('UPDATE products SET sold_count = sold_count + ?, updated_at = NOW() WHERE id = ?', [
      line.quantity,
      line.productId,
    ])
  }
}

async function deleteCheckedCartItems(connection, userId, lines) {
  const ids = lines.map((line) => line.cartItemId).filter(Boolean)
  if (!ids.length) return

  const placeholders = ids.map(() => '?').join(', ')
  await connection.execute(
    `DELETE ci FROM cart_items ci
     JOIN carts cart ON cart.id = ci.cart_id
     WHERE cart.user_id = ? AND ci.id IN (${placeholders})`,
    [userId, ...ids],
  )
  await connection.execute('UPDATE carts SET updated_at = NOW() WHERE user_id = ?', [userId])
}

async function readOrder(userId, orderId) {
  const orders = await query(
    `SELECT
       id,
       status,
       items_total AS itemsTotal,
       shipping_fee AS shippingFee,
       discount_total AS discountTotal,
       grand_total AS grandTotal,
       payment_method AS paymentMethod,
       shipping_full_name AS shippingFullName,
       shipping_phone AS shippingPhone,
       shipping_line1 AS shippingLine1,
       shipping_ward AS shippingWard,
       shipping_province AS shippingProvince,
       shipping_distance_type AS shippingDistanceType,
       shipping_weight_grams AS shippingWeightGrams,
       shipping_address_snapshot AS shippingAddressSnapshot,
       shipping_country AS shippingCountry,
       shipping_postal_code AS shippingPostalCode,
       note,
       created_at AS createdAt,
       updated_at AS updatedAt
     FROM orders
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [orderId, userId],
  )

  const order = orders[0]
  if (!order) return null

  const items = await query(
    `SELECT
       oi.id,
       oi.product_id AS productId,
       oi.shop_id AS shopId,
       s.name AS shopName,
       oi.name,
       oi.image_url AS imageUrl,
       oi.variant_id AS variantId,
       oi.variant_sku AS variantSku,
       oi.selected_options AS selectedOptions,
       oi.unit_price AS unitPrice,
       oi.quantity,
       oi.line_total AS lineTotal
     FROM order_items oi
     LEFT JOIN shops s ON s.id = oi.shop_id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [orderId],
  )

  return {
    id: Number(order.id),
    status: order.status,
    itemsTotal: Number(order.itemsTotal || 0),
    shippingFee: Number(order.shippingFee || 0),
    discountTotal: Number(order.discountTotal || 0),
    grandTotal: Number(order.grandTotal || 0),
    paymentMethod: order.paymentMethod,
    shipping: {
      fullName: order.shippingFullName,
      phone: order.shippingPhone,
      line1: order.shippingLine1,
      ward: order.shippingWard || '',
      province: order.shippingProvince,
      country: order.shippingCountry,
      postalCode: order.shippingPostalCode || '',
      distanceType: order.shippingDistanceType || '',
      weightGrams: Number(order.shippingWeightGrams || 0),
      snapshot: safeParseJson(order.shippingAddressSnapshot, null),
    },
    note: order.note || '',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: items.map((item) => ({
      id: Number(item.id),
      productId: Number(item.productId),
      shopId: Number(item.shopId),
      shopName: item.shopName || '',
      name: item.name,
      imageUrl: item.imageUrl || '',
      variantId: item.variantId == null ? null : Number(item.variantId),
      variantSku: item.variantSku || '',
      selectedOptions: normalizeSelectedOptions(item.selectedOptions),
      unitPrice: Number(item.unitPrice || 0),
      quantity: Number(item.quantity || 0),
      lineTotal: Number(item.lineTotal || 0),
    })),
  }
}

router.use(requireAuth)

router.post(
  '/shipping-fee',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const source = req.body?.source === 'cart' ? 'cart' : 'buyNow'
    const addressId = toPositiveId(req.body?.addressId)

    if (!addressId) return res.status(400).json({ ok: false, message: 'Vui lòng chọn địa chỉ nhận hàng' })

    const quote = await transaction(async (connection) => {
      const address = await readAddress(connection, userId, addressId)
      if (!address) throwStatus('Không tìm thấy địa chỉ nhận hàng', 404)

      const lines =
        source === 'cart'
          ? await readCartLines(connection, userId, req.body?.cartItemIds || [])
          : await readDirectLines(connection, req.body?.items || [])
      if (!lines.length) throwStatus('Không có sản phẩm để tính phí vận chuyển')

      return calculateShippingForLines(address, lines)
    })

    return res.json({ ok: true, data: quote })
  }),
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const source = req.body?.source === 'cart' ? 'cart' : 'buyNow'
    const addressId = toPositiveId(req.body?.addressId)
    const paymentMethod = String(req.body?.paymentMethod || 'cod').trim()
    const note = String(req.body?.note || '').trim()

    if (!addressId) return res.status(400).json({ ok: false, message: 'Vui lòng chọn địa chỉ nhận hàng' })
    if (!allowedPaymentMethods.has(paymentMethod)) {
      return res.status(400).json({ ok: false, message: 'Phương thức thanh toán không hợp lệ' })
    }

    const orderId = await transaction(async (connection) => {
      const address = await readAddress(connection, userId, addressId)
      if (!address) throwStatus('Không tìm thấy địa chỉ nhận hàng', 404)

      const lines =
        source === 'cart'
          ? await readCartLines(connection, userId, req.body?.cartItemIds || [])
          : await readDirectLines(connection, req.body?.items || [])
      if (!lines.length) throwStatus('Không có sản phẩm để thanh toán')

      const itemsTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
      const shippingQuote = await calculateShippingForLines(address, lines)
      const shippingFee = shippingQuote.totalShippingFee
      const discountTotal = 0
      const grandTotal = itemsTotal + shippingFee - discountTotal
      const shippingWeightGrams = (shippingQuote.shops || []).reduce(
        (sum, shop) => sum + Number(shop.totalWeightGrams || 0),
        0,
      )
      const shippingDistanceType = getAggregateDistanceType(shippingQuote.shops || [])
      const shippingAddressSnapshot = {
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        wardId: address.wardId,
        ward: address.ward || '',
        provinceId: address.provinceId,
        province: address.province,
        country: 'VN',
        postalCode: '',
      }

      await updateInventory(connection, lines)

      const [createdOrder] = await connection.execute(
        `INSERT INTO orders
           (user_id, status, items_total, shipping_fee, discount_total, grand_total, payment_method,
            shipping_full_name, shipping_phone, shipping_line1, shipping_ward, shipping_province,
            shipping_distance_type, shipping_weight_grams, shipping_address_snapshot,
            shipping_country, shipping_postal_code, note)
         VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          itemsTotal,
          shippingFee,
          discountTotal,
          grandTotal,
          paymentMethod,
          address.fullName,
          address.phone,
          address.line1,
          address.ward || null,
          address.province,
          shippingDistanceType,
          shippingWeightGrams,
          JSON.stringify(shippingAddressSnapshot),
          'VN',
          null,
          note || null,
        ],
      )

      await insertOrderItems(connection, createdOrder.insertId, lines)
      await insertOrderShopSnapshots(connection, createdOrder.insertId, shippingQuote.shops || [])
      if (source === 'cart') await deleteCheckedCartItems(connection, userId, lines)

      await createNotification({
        connection,
        userId,
        type: 'order',
        title: 'Đặt hàng thành công',
        message: `Đơn hàng #${createdOrder.insertId} đã được ghi nhận và đang chờ người bán xác nhận.`,
        actionUrl: '/orders',
        orderId: createdOrder.insertId,
        metadata: {
          status: 'pending',
          itemCount: lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0),
        },
      })

      return createdOrder.insertId
    })

    const order = await readOrder(userId, orderId)
    return res.status(201).json({ ok: true, data: order, message: 'Đặt hàng thành công' })
  }),
)

router.get(
  '/:orderId',
  asyncHandler(async (req, res) => {
    const userId = Number(req.user.sub)
    const orderId = toPositiveId(req.params.orderId)

    if (!orderId) return res.status(400).json({ ok: false, message: 'Đơn hàng không hợp lệ' })

    const order = await readOrder(userId, orderId)
    if (!order) return res.status(404).json({ ok: false, message: 'Không tìm thấy đơn hàng' })

    return res.json({ ok: true, data: order })
  }),
)

module.exports = router
