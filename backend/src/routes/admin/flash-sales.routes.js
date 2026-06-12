const { query, transaction } = require('../../config/db')
const { asyncHandler } = require('../../middleware/error')

function toPositiveId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function throwStatus(message, status = 400) {
  const err = new Error(message)
  err.status = status
  throw err
}

function parseDate(value, label) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) throwStatus(`${label} khong hop le`)
  return date
}

function mapEvent(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    registrationStartsAt: row.registration_starts_at || '',
    registrationEndsAt: row.registration_ends_at || '',
    isActive: Boolean(row.is_active),
    registrationCount: Number(row.registration_count || 0),
    approvedCount: Number(row.approved_count || 0),
    pendingCount: Number(row.pending_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapRegistration(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    salePrice: Number(row.sale_price || 0),
    registeredStock: Number(row.registered_stock || 0),
    soldCount: Number(row.sold_count || 0),
    status: row.status,
    rejectReason: row.reject_reason || '',
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at || '',
    product: {
      id: row.product_id,
      name: row.product_name,
      price: Number(row.product_price || 0),
      stock: Number(row.product_stock || 0),
      thumbnailUrl: row.thumbnail_url || '',
    },
    shop: {
      id: row.shop_id,
      name: row.shop_name,
      ownerName: row.owner_name || '',
      ownerEmail: row.owner_email || '',
    },
  }
}

async function readFlashSalesData() {
  const [eventRows, registrationRows] = await Promise.all([
    query(
      `SELECT e.*,
              COUNT(r.id) AS registration_count,
              SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
              SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) AS pending_count
       FROM flash_sale_events e
       LEFT JOIN flash_sale_registrations r ON r.event_id = e.id
       GROUP BY e.id
       ORDER BY e.starts_at DESC, e.id DESC
       LIMIT 100`,
    ),
    query(
      `SELECT r.*, p.name AS product_name, p.price AS product_price, p.stock AS product_stock,
              p.thumbnail_url, s.name AS shop_name, u.name AS owner_name, u.email AS owner_email
       FROM flash_sale_registrations r
       JOIN products p ON p.id = r.product_id
       JOIN shops s ON s.id = r.shop_id
       JOIN users u ON u.id = s.owner_id
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT 300`,
    ),
  ])
  const events = eventRows.map(mapEvent)
  const registrations = registrationRows.map(mapRegistration)

  return {
    stats: {
      events: events.length,
      activeEvents: events.filter((event) => event.isActive).length,
      pendingRegistrations: registrations.filter((item) => item.status === 'pending').length,
      approvedRegistrations: registrations.filter((item) => item.status === 'approved').length,
    },
    events,
    registrations,
  }
}

function normalizeEventPayload(body, partial = false) {
  const payload = {}
  if (!partial || body.name !== undefined) {
    const name = String(body.name || '').trim()
    if (!name || name.length > 160) throwStatus('Ten flash sale khong hop le')
    payload.name = name
  }
  if (!partial || body.description !== undefined) payload.description = String(body.description || '').trim()
  if (!partial || body.startsAt !== undefined) payload.startsAt = parseDate(body.startsAt, 'Thoi gian bat dau')
  if (!partial || body.endsAt !== undefined) payload.endsAt = parseDate(body.endsAt, 'Thoi gian ket thuc')
  if (!partial || body.registrationStartsAt !== undefined) {
    payload.registrationStartsAt = body.registrationStartsAt ? parseDate(body.registrationStartsAt, 'Thoi gian mo dang ky') : null
  }
  if (!partial || body.registrationEndsAt !== undefined) {
    payload.registrationEndsAt = body.registrationEndsAt ? parseDate(body.registrationEndsAt, 'Thoi gian dong dang ky') : null
  }
  if (!partial || body.isActive !== undefined) payload.isActive = body.isActive === undefined ? true : Boolean(body.isActive)

  const startsAt = payload.startsAt
  const endsAt = payload.endsAt
  if (startsAt && endsAt && startsAt >= endsAt) throwStatus('Thoi gian ket thuc phai lon hon thoi gian bat dau')
  if (payload.registrationStartsAt && payload.registrationEndsAt && payload.registrationStartsAt > payload.registrationEndsAt) {
    throwStatus('Thoi gian dong dang ky phai sau thoi gian mo dang ky')
  }

  return payload
}

async function syncApprovedProduct(connection, registrationId) {
  const [rows] = await connection.execute(
    `SELECT r.*, e.starts_at, e.ends_at, p.price
     FROM flash_sale_registrations r
     JOIN flash_sale_events e ON e.id = r.event_id
     JOIN products p ON p.id = r.product_id
     WHERE r.id = ?
     LIMIT 1`,
    [registrationId],
  )
  const item = rows[0]
  if (!item) throwStatus('Khong tim thay dang ky flash sale', 404)

  const discountPercent = Math.max(0, Math.min(99, Math.round(((Number(item.price) - Number(item.sale_price)) / Number(item.price)) * 100)))
  await connection.execute(
    `UPDATE products
     SET flash_sale_active = 1,
         flash_sale_price = ?,
         flash_sale_discount_percent = ?,
         flash_sale_start_at = ?,
         flash_sale_end_at = ?,
         flash_sale_sold = ?,
         flash_sale_stock = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [item.sale_price, discountPercent, item.starts_at, item.ends_at, item.sold_count, item.registered_stock, item.product_id],
  )
}

function registerFlashSaleRoutes(router) {
  router.get('/flash-sales', asyncHandler(async (req, res) => res.json({ ok: true, data: await readFlashSalesData() })))

  router.post('/flash-sales', asyncHandler(async (req, res) => {
    const payload = normalizeEventPayload(req.body)
    await query(
      `INSERT INTO flash_sale_events
         (name, description, starts_at, ends_at, registration_starts_at, registration_ends_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.name,
        payload.description || null,
        payload.startsAt,
        payload.endsAt,
        payload.registrationStartsAt,
        payload.registrationEndsAt,
        payload.isActive ? 1 : 0,
      ],
    )
    return res.status(201).json({ ok: true, data: await readFlashSalesData() })
  }))

  router.patch('/flash-sales/:eventId', asyncHandler(async (req, res) => {
    const eventId = toPositiveId(req.params.eventId)
    if (!eventId) throwStatus('Flash sale khong hop le')
    const payload = normalizeEventPayload(req.body, true)
    const fields = []
    const params = []
    const map = {
      name: 'name',
      description: 'description',
      startsAt: 'starts_at',
      endsAt: 'ends_at',
      registrationStartsAt: 'registration_starts_at',
      registrationEndsAt: 'registration_ends_at',
      isActive: 'is_active',
    }
    Object.entries(map).forEach(([key, column]) => {
      if (payload[key] === undefined) return
      fields.push(`${column} = ?`)
      params.push(key === 'isActive' ? (payload[key] ? 1 : 0) : payload[key])
    })
    if (fields.length) await query(`UPDATE flash_sale_events SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, [...params, eventId])
    return res.json({ ok: true, data: await readFlashSalesData() })
  }))

  router.patch('/flash-sales/registrations/:registrationId', asyncHandler(async (req, res) => {
    const registrationId = toPositiveId(req.params.registrationId)
    const action = String(req.body?.action || '').trim()
    const rejectReason = String(req.body?.rejectReason || '').trim()
    if (!registrationId || !['approve', 'reject'].includes(action)) throwStatus('Thao tac dang ky khong hop le')

    await transaction(async (connection) => {
      if (action === 'approve') {
        await connection.execute(
          `UPDATE flash_sale_registrations
           SET status = 'approved', reject_reason = NULL, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
           WHERE id = ?`,
          [Number(req.user.sub), registrationId],
        )
        await syncApprovedProduct(connection, registrationId)
      } else {
        await connection.execute(
          `UPDATE flash_sale_registrations
           SET status = 'rejected', reject_reason = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
           WHERE id = ?`,
          [rejectReason || 'Khong dat dieu kien flash sale', Number(req.user.sub), registrationId],
        )
      }
    })

    return res.json({ ok: true, data: await readFlashSalesData() })
  }))
}

module.exports = registerFlashSaleRoutes
