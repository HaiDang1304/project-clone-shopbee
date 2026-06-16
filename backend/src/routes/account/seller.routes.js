function registerSellerRoutes(router, context) {
  const {
    query,
    transaction,
    asyncHandler,
    createNotification,
    signUserToken,
    buyerOrderStatusNotifications,
    saveShopImageDataUrl,
    saveProductImageDataUrl,
    normalizeShopApplicationPayload,
    normalizeShopProfilePayload,
    resolveLocationIds,
    normalizeSellerProductPayload,
    replaceProductImages,
    makeUniqueShopSlug,
    makeUniqueProductSlug,
    readShopApplication,
    readSellerShop,
    readSellerProducts,
    readSellerDashboard,
    readSellerVouchersData,
    createSellerVoucher,
    updateSellerVoucher,
    deleteSellerVoucher,
    readOrderReviewProducts,
    readProfile,
  } = context

  router.get(
    '/seller-registration',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const [profile, application, shop] = await Promise.all([
        readProfile(userId),
        readShopApplication(userId),
        readSellerShop(userId),
      ])

      const token = profile && profile.role !== req.user.role ? signUserToken(profile) : null

      return res.json({
        ok: true,
        data: {
          application,
          shop,
        },
        ...(token ? { token } : {}),
      })
    }),
  )

  router.post(
    '/seller-registration',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const payload = normalizeShopApplicationPayload(req.body)
      const location = await resolveLocationIds(payload.provinceId, payload.wardId)
      Object.assign(payload, location)
      const existingShop = await readSellerShop(userId)

      if (existingShop) {
        return res.status(400).json({ ok: false, message: 'Tài khoản này đã có cửa hàng được duyệt' })
      }

      const existingRows = await query(
        `SELECT id, status
         FROM shop_applications
         WHERE user_id = ?
         LIMIT 1`,
        [userId],
      )
      const existing = existingRows[0]
      const shopSlug = await makeUniqueShopSlug(payload.shopSlug)

      if (existing?.status === 'pending') {
        return res.status(409).json({ ok: false, message: 'Đơn đăng ký cửa hàng đang chờ admin duyệt' })
      }

      if (existing?.status === 'approved') {
        return res.status(400).json({ ok: false, message: 'Đơn đăng ký cửa hàng đã được duyệt' })
      }

      if (existing) {
        await query(
          `UPDATE shop_applications
           SET shop_name = ?, shop_slug = ?, contact_phone = ?, contact_email = ?, description = ?,
               address_line1 = ?, province_id = ?, ward_id = ?, ward = ?, province = ?, country = ?,
               status = 'pending', reject_reason = NULL, reviewed_by = NULL, reviewed_at = NULL,
               updated_at = NOW()
           WHERE id = ? AND user_id = ?`,
          [
            payload.shopName,
            shopSlug,
            payload.contactPhone,
            payload.contactEmail,
            payload.description,
            payload.addressLine1,
            payload.provinceId,
            payload.wardId,
            payload.ward,
            payload.province,
            payload.country,
            existing.id,
            userId,
          ],
        )
      } else {
        await query(
          `INSERT INTO shop_applications
             (user_id, shop_name, shop_slug, contact_phone, contact_email, description,
              address_line1, province_id, ward_id, ward, province, country, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            userId,
            payload.shopName,
            shopSlug,
            payload.contactPhone,
            payload.contactEmail,
            payload.description,
            payload.addressLine1,
            payload.provinceId,
            payload.wardId,
            payload.ward,
            payload.province,
            payload.country,
          ],
        )
      }

      const application = await readShopApplication(userId)
      return res.status(existing ? 200 : 201).json({
        ok: true,
        data: {
          application,
          shop: null,
        },
        message: 'Đã gửi đơn đăng ký cửa hàng. Vui lòng chờ admin xác minh.',
      })
    }),
  )

  router.get(
    '/seller/dashboard',
    asyncHandler(async (req, res) => {
      const dashboard = await readSellerDashboard(Number(req.user.sub), req.query)
      return res.json({ ok: true, data: dashboard })
    }),
  )

  router.get(
    '/seller/flash-sales',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const shop = await readSellerShop(userId)
      if (!shop) return res.status(403).json({ ok: false, message: 'Cua hang chua duoc admin duyet' })

      const [events, registrations] = await Promise.all([
        query(
          `SELECT id, name, description, starts_at AS startsAt, ends_at AS endsAt,
                  registration_starts_at AS registrationStartsAt,
                  registration_ends_at AS registrationEndsAt,
                  is_active AS isActive
           FROM flash_sale_events
           WHERE is_active = 1 AND ends_at >= NOW()
           ORDER BY starts_at ASC
           LIMIT 50`,
        ),
        query(
          `SELECT r.id, r.event_id AS eventId, r.product_id AS productId, r.sale_price AS salePrice,
                  r.registered_stock AS registeredStock, r.sold_count AS soldCount, r.status,
                  r.reject_reason AS rejectReason, r.created_at AS createdAt,
                  e.name AS eventName, e.starts_at AS startsAt, e.ends_at AS endsAt,
                  p.name AS productName, p.price AS productPrice, p.stock AS productStock,
                  p.thumbnail_url AS thumbnailUrl
           FROM flash_sale_registrations r
           JOIN flash_sale_events e ON e.id = r.event_id
           JOIN products p ON p.id = r.product_id
           WHERE r.shop_id = ?
           ORDER BY r.created_at DESC
           LIMIT 100`,
          [shop.id],
        ),
      ])

      return res.json({
        ok: true,
        data: {
          events: events.map((event) => ({
            ...event,
            isActive: Boolean(event.isActive),
            registrationOpen:
              Boolean(event.isActive) &&
              (!event.registrationStartsAt || new Date(event.registrationStartsAt) <= new Date()) &&
              (!event.registrationEndsAt || new Date(event.registrationEndsAt) >= new Date()),
          })),
          registrations: registrations.map((item) => ({
            ...item,
            salePrice: Number(item.salePrice || 0),
            registeredStock: Number(item.registeredStock || 0),
            soldCount: Number(item.soldCount || 0),
            productPrice: Number(item.productPrice || 0),
            productStock: Number(item.productStock || 0),
          })),
        },
      })
    }),
  )

  router.post(
    '/seller/flash-sales/register',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const shop = await readSellerShop(userId)
      if (!shop) return res.status(403).json({ ok: false, message: 'Cua hang chua duoc admin duyet' })

      const eventId = Number(req.body?.eventId)
      const productId = Number(req.body?.productId)
      const salePrice = Number(req.body?.salePrice)
      const registeredStock = Number(req.body?.registeredStock)
      if (!Number.isSafeInteger(eventId) || eventId <= 0) return res.status(400).json({ ok: false, message: 'Flash sale khong hop le' })
      if (!Number.isSafeInteger(productId) || productId <= 0) return res.status(400).json({ ok: false, message: 'San pham khong hop le' })
      if (!Number.isFinite(salePrice) || salePrice <= 0) return res.status(400).json({ ok: false, message: 'Gia flash sale khong hop le' })
      if (!Number.isSafeInteger(registeredStock) || registeredStock <= 0) return res.status(400).json({ ok: false, message: 'So luong dang ky khong hop le' })

      const [eventRows, productRows] = await Promise.all([
        query(
          `SELECT id, registration_starts_at, registration_ends_at, starts_at, ends_at, is_active
           FROM flash_sale_events
           WHERE id = ? LIMIT 1`,
          [eventId],
        ),
        query(
          `SELECT id, shop_id, name, price, stock, status, is_active
           FROM products
           WHERE id = ? AND shop_id = ?
           LIMIT 1`,
          [productId, shop.id],
        ),
      ])
      const event = eventRows[0]
      const product = productRows[0]
      const now = new Date()
      if (!event || Number(event.is_active) !== 1 || new Date(event.ends_at) < now) return res.status(400).json({ ok: false, message: 'Flash sale khong kha dung' })
      if (event.registration_starts_at && new Date(event.registration_starts_at) > now) return res.status(400).json({ ok: false, message: 'Chua den thoi gian dang ky' })
      if (event.registration_ends_at && new Date(event.registration_ends_at) < now) return res.status(400).json({ ok: false, message: 'Da het thoi gian dang ky' })
      if (!product || product.status !== 'active' || Number(product.is_active) !== 1) return res.status(400).json({ ok: false, message: 'San pham khong du dieu kien dang ky' })
      if (salePrice >= Number(product.price || 0)) return res.status(400).json({ ok: false, message: 'Gia flash sale phai thap hon gia ban hien tai' })
      if (registeredStock > Number(product.stock || 0)) return res.status(400).json({ ok: false, message: 'So luong dang ky vuot qua ton kho' })

      await query(
        `INSERT INTO flash_sale_registrations (event_id, shop_id, product_id, sale_price, registered_stock, status)
         VALUES (?, ?, ?, ?, ?, 'pending')
         ON DUPLICATE KEY UPDATE
           sale_price = VALUES(sale_price),
           registered_stock = VALUES(registered_stock),
           status = IF(status = 'approved', status, 'pending'),
           reject_reason = NULL,
           updated_at = NOW()`,
        [eventId, shop.id, productId, salePrice, registeredStock],
      )

      return res.status(201).json({ ok: true, message: 'Da gui dang ky flash sale' })
    }),
  )

  router.get(
    '/seller/vouchers',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const shop = await readSellerShop(userId)
      if (!shop) return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })

      const vouchers = await readSellerVouchersData(shop.id)
      return res.json({ ok: true, data: vouchers })
    }),
  )

  router.post(
    '/seller/vouchers',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const shop = await readSellerShop(userId)
      if (!shop) return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })

      const vouchers = await createSellerVoucher(shop.id, req.body)
      return res.status(201).json({ ok: true, data: vouchers, message: 'Đã tạo voucher của shop' })
    }),
  )

  router.patch(
    '/seller/vouchers/:voucherId',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const shop = await readSellerShop(userId)
      if (!shop) return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })

      const vouchers = await updateSellerVoucher(shop.id, req.params.voucherId, req.body)
      return res.json({ ok: true, data: vouchers, message: 'Đã cập nhật voucher của shop' })
    }),
  )

  router.delete(
    '/seller/vouchers/:voucherId',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const shop = await readSellerShop(userId)
      if (!shop) return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })

      const vouchers = await deleteSellerVoucher(shop.id, req.params.voucherId)
      return res.json({ ok: true, data: vouchers, message: 'Đã xóa voucher của shop' })
    }),
  )

  router.patch(
    '/seller/shop',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const shop = await readSellerShop(userId)

      if (!shop) {
        return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
      }

      const payload = normalizeShopProfilePayload(req.body)
      const location = await resolveLocationIds(payload.provinceId, payload.wardId)
      Object.assign(payload, location)
      if (req.body?.avatarDataUrl) {
        payload.avatarUrl = await saveShopImageDataUrl(shop.id, 'avatar', req.body.avatarDataUrl)
      }
      if (req.body?.coverDataUrl) {
        payload.coverUrl = await saveShopImageDataUrl(shop.id, 'cover', req.body.coverDataUrl)
      }

      await transaction(async (connection) => {
        await connection.execute(
          `UPDATE shops
           SET name = ?, avatar_url = ?, cover_url = ?, description = ?, address_line1 = ?,
               province_id = ?, ward_id = ?, ward = ?, province = ?, country = ?, updated_at = NOW()
            WHERE id = ? AND owner_id = ?`,
          [
            payload.shopName,
            payload.avatarUrl,
            payload.coverUrl,
            payload.description,
            payload.addressLine1,
            payload.provinceId,
            payload.wardId,
            payload.ward,
            payload.province,
            payload.country,
            shop.id,
            userId,
          ],
        )

        await connection.execute(
          `UPDATE shop_applications
           SET shop_name = ?, contact_phone = ?, contact_email = ?, description = ?,
               address_line1 = ?, province_id = ?, ward_id = ?, ward = ?, province = ?, country = ?, updated_at = NOW()
            WHERE user_id = ? AND shop_id = ?`,
          [
            payload.shopName,
            payload.contactPhone,
            payload.contactEmail,
            payload.description,
            payload.addressLine1,
            payload.provinceId,
            payload.wardId,
            payload.ward,
            payload.province,
            payload.country,
            userId,
            shop.id,
          ],
        )
      })

      const dashboard = await readSellerDashboard(userId)
      return res.json({ ok: true, data: dashboard, message: 'Đã cập nhật hồ sơ cửa hàng.' })
    }),
  )

  router.get(
    '/seller/products',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const shop = await readSellerShop(userId)

      if (!shop) {
        return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
      }

      const products = await readSellerProducts(userId)
      return res.json({ ok: true, data: { shop, products } })
    }),
  )

  router.post(
    '/seller/products',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const shop = await readSellerShop(userId)

      if (!shop) {
        return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
      }

      const product = normalizeSellerProductPayload(req.body)

      if (product.categoryId) {
        const categoryRows = await query('SELECT id FROM categories WHERE id = ? AND is_active = 1 LIMIT 1', [
          product.categoryId,
        ])
        if (!categoryRows.length) {
          return res.status(400).json({ ok: false, message: 'Danh mục không tồn tại' })
        }
      }

      const productSlug = await makeUniqueProductSlug(product.slug)
      await transaction(async (connection) => {
        const [createdProduct] = await connection.execute(
          `INSERT INTO products
             (shop_id, category_id, name, slug, description, price, original_price, stock, weight_grams,
              thumbnail_url, status, product_options, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            shop.id,
            product.categoryId,
            product.name,
            productSlug,
            product.description,
            product.price,
            product.originalPrice,
            product.stock,
            product.weightGrams,
            product.thumbnailUrl,
            product.status,
            JSON.stringify(product.productOptions),
            product.isActive ? 1 : 0,
          ],
        )

        const productId = createdProduct.insertId
        const savedImages = []
        for (const imageDataUrl of product.imageDataUrls) {
          savedImages.push(await saveProductImageDataUrl(productId, imageDataUrl))
        }

        const productImages = [...product.images, ...savedImages]
        if (productImages.length) {
          await replaceProductImages(connection, productId, productImages)
          await connection.execute('UPDATE products SET thumbnail_url = ? WHERE id = ?', [productImages[0], productId])
        }
      })

      const products = await readSellerProducts(userId)
      return res.status(201).json({
        ok: true,
        data: {
          shop,
          products,
        },
        message: 'Đã đăng sản phẩm mới.',
      })
    }),
  )

  router.patch(
    '/seller/products/:productId',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const productId = Number(req.params.productId)
      const shop = await readSellerShop(userId)

      if (!shop) {
        return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
      }

      if (!Number.isSafeInteger(productId) || productId <= 0) {
        return res.status(400).json({ ok: false, message: 'Sản phẩm không hợp lệ' })
      }

      const existingRows = await query('SELECT id, is_active FROM products WHERE id = ? AND shop_id = ? LIMIT 1', [
        productId,
        shop.id,
      ])
      const existing = existingRows[0]

      if (!existing) {
        return res.status(404).json({ ok: false, message: 'Không tìm thấy sản phẩm' })
      }

      const product = normalizeSellerProductPayload(req.body)

      if (product.categoryId) {
        const categoryRows = await query('SELECT id FROM categories WHERE id = ? AND is_active = 1 LIMIT 1', [
          product.categoryId,
        ])
        if (!categoryRows.length) {
          return res.status(400).json({ ok: false, message: 'Danh mục không tồn tại' })
        }
      }

      const shouldReplaceImages =
        Object.prototype.hasOwnProperty.call(req.body || {}, 'images') ||
        Object.prototype.hasOwnProperty.call(req.body || {}, 'imageDataUrls')

      await transaction(async (connection) => {
        let nextThumbnailUrl = product.thumbnailUrl

        if (shouldReplaceImages) {
          const savedImages = []
          for (const imageDataUrl of product.imageDataUrls) {
            savedImages.push(await saveProductImageDataUrl(productId, imageDataUrl))
          }

          const productImages = [...product.images, ...savedImages]
          await replaceProductImages(connection, productId, productImages)
          nextThumbnailUrl = productImages[0] || null
        }

        await connection.execute(
          `UPDATE products
           SET category_id = ?, name = ?, description = ?, price = ?, original_price = ?,
               stock = ?, weight_grams = ?, thumbnail_url = ?, status = ?, product_options = ?, is_active = ?, updated_at = NOW()
            WHERE id = ? AND shop_id = ?`,
          [
            product.categoryId,
            product.name,
            product.description,
            product.price,
            product.originalPrice,
            product.stock,
            product.weightGrams,
            nextThumbnailUrl,
            product.status,
            JSON.stringify(product.productOptions),
            product.isActive ? 1 : 0,
            productId,
            shop.id,
          ],
        )
      })

      const dashboard = await readSellerDashboard(userId)
      return res.json({ ok: true, data: dashboard, message: 'Đã cập nhật sản phẩm.' })
    }),
  )

  router.patch(
    '/seller/products/:productId/status',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const productId = Number(req.params.productId)
      const shop = await readSellerShop(userId)
      const isActive = Boolean(req.body?.isActive)

      if (!shop) {
        return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
      }

      if (!Number.isSafeInteger(productId) || productId <= 0) {
        return res.status(400).json({ ok: false, message: 'Sản phẩm không hợp lệ' })
      }

      const productRows = await query('SELECT id, stock FROM products WHERE id = ? AND shop_id = ? LIMIT 1', [
        productId,
        shop.id,
      ])
      const product = productRows[0]

      if (!product) {
        return res.status(404).json({ ok: false, message: 'Không tìm thấy sản phẩm' })
      }

      if (isActive && Number(product.stock || 0) <= 0) {
        return res.status(400).json({ ok: false, message: 'Sản phẩm hết hàng, không thể mở bán' })
      }

      await query('UPDATE products SET status = ?, is_active = ?, updated_at = NOW() WHERE id = ? AND shop_id = ?', [
        isActive ? 'active' : 'hidden',
        isActive ? 1 : 0,
        productId,
        shop.id,
      ])

      const dashboard = await readSellerDashboard(userId)
      return res.json({ ok: true, data: dashboard, message: isActive ? 'Đã mở bán sản phẩm.' : 'Đã đóng sản phẩm.' })
    }),
  )

  router.delete(
    '/seller/products/:productId',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const productId = Number(req.params.productId)
      const shop = await readSellerShop(userId)

      if (!shop) {
        return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
      }

      if (!Number.isSafeInteger(productId) || productId <= 0) {
        return res.status(400).json({ ok: false, message: 'Sản phẩm không hợp lệ' })
      }

      const productRows = await query('SELECT id FROM products WHERE id = ? AND shop_id = ? LIMIT 1', [productId, shop.id])
      if (!productRows.length) {
        return res.status(404).json({ ok: false, message: 'Không tìm thấy sản phẩm' })
      }

      const itemRows = await query('SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?', [productId])
      const hasOrders = Number(itemRows[0]?.count || 0) > 0

      if (hasOrders) {
        await query('UPDATE products SET status = ?, is_active = 0, updated_at = NOW() WHERE id = ? AND shop_id = ?', ['hidden', productId, shop.id])
        const dashboard = await readSellerDashboard(userId)
        return res.json({
          ok: true,
          data: dashboard,
          message: 'Sản phẩm đã có đơn hàng nên đã được đóng bán thay vì xóa.',
        })
      }

      await query('DELETE FROM products WHERE id = ? AND shop_id = ?', [productId, shop.id])

      const dashboard = await readSellerDashboard(userId)
      return res.json({ ok: true, data: dashboard, message: 'Đã xóa sản phẩm.' })
    }),
  )

  router.patch(
    '/seller/orders/:orderId',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const orderId = Number(req.params.orderId)
      const status = String(req.body?.status || '').trim()
      const allowedStatuses = new Set(['pending', 'processing', 'shipping', 'delivered', 'cancelled'])
      const shop = await readSellerShop(userId)

      if (!shop) {
        return res.status(403).json({ ok: false, message: 'Cửa hàng chưa được admin duyệt' })
      }

      if (!Number.isSafeInteger(orderId) || orderId <= 0) {
        return res.status(400).json({ ok: false, message: 'Đơn hàng không hợp lệ' })
      }

      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ ok: false, message: 'Trạng thái đơn hàng không hợp lệ' })
      }

      const orderRows = await query(
        `SELECT o.id, o.user_id AS userId, o.status AS currentStatus
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         WHERE o.id = ? AND oi.shop_id = ?
         LIMIT 1`,
        [orderId, shop.id],
      )

      if (!orderRows.length) {
        return res.status(404).json({ ok: false, message: 'Không tìm thấy đơn hàng của cửa hàng' })
      }

      const order = orderRows[0]

      if (order.currentStatus === status) {
        const dashboard = await readSellerDashboard(userId)
        return res.json({ ok: true, data: dashboard, message: 'Trạng thái đơn hàng không thay đổi.' })
      }

      if (order.currentStatus === 'delivered') {
        return res.status(400).json({
          ok: false,
          message: 'Đơn hàng đã giao không thể thay đổi trạng thái.',
        })
      }

      await transaction(async (connection) => {
        await connection.execute('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, orderId])

        const statusNotification = buyerOrderStatusNotifications[status]
        if (statusNotification) {
          await createNotification({
            connection,
            userId: Number(order.userId),
            type: 'order',
            title: statusNotification.title,
            message: statusNotification.message(orderId),
            actionUrl: '/orders',
            orderId,
            metadata: { status, previousStatus: order.currentStatus },
          })
        }

        if (status === 'delivered') {
          const products = await readOrderReviewProducts(connection, orderId, shop.id)
          if (products.length) {
            await createNotification({
              connection,
              userId: Number(order.userId),
              type: 'review',
              title: 'Bạn có thể để lại góp ý cho sản phẩm',
              message: `Đơn hàng #${orderId} đã giao thành công. Hãy đánh giá sản phẩm bạn vừa mua.`,
              actionUrl: '/orders',
              orderId,
              productId: products[0].productId,
              metadata: {
                orderId,
                products,
              },
            })
          }
        }
      })

      const dashboard = await readSellerDashboard(userId)
      return res.json({ ok: true, data: dashboard, message: 'Đã cập nhật đơn hàng.' })
    }),
  )
}

module.exports = registerSellerRoutes
