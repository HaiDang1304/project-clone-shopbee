function registerApplicationRoutes(router, context) {
  const {
    transaction,
    asyncHandler,
    makeUniqueShopSlug,
    readApplications,
  } = context

  router.get(
    '/seller-applications',
    asyncHandler(async (req, res) => {
      const status = String(req.query.status || '').trim()
      const applications = await readApplications(status)
      return res.json({ ok: true, data: applications })
    }),
  )

  router.patch(
    '/seller-applications/:applicationId',
    asyncHandler(async (req, res) => {
      const applicationId = Number(req.params.applicationId)
      const action = String(req.body?.action || '').trim()
      const rejectReason = String(req.body?.rejectReason || '').trim()
      const adminId = Number(req.user.sub)

      if (!Number.isSafeInteger(applicationId) || applicationId <= 0) {
        return res.status(400).json({ ok: false, message: 'Đơn đăng ký không hợp lệ' })
      }

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ ok: false, message: 'Thao tác duyệt không hợp lệ' })
      }

      if (action === 'reject' && !rejectReason) {
        return res.status(400).json({ ok: false, message: 'Vui lòng nhập lý do từ chối' })
      }

      await transaction(async (connection) => {
        const [rows] = await connection.execute(
          `SELECT id, user_id, shop_id, shop_name, shop_slug, contact_phone, contact_email,
                  description, address_line1, province_id, ward_id, ward, province, country, status
           FROM shop_applications
           WHERE id = ?
           LIMIT 1
           FOR UPDATE`,
          [applicationId],
        )
        const application = rows[0]

        if (!application) {
          const err = new Error('Không tìm thấy đơn đăng ký')
          err.status = 404
          throw err
        }

        if (application.status !== 'pending') {
          const err = new Error('Chỉ có thể xử lý đơn đang chờ duyệt')
          err.status = 400
          throw err
        }

        if (action === 'reject') {
          await connection.execute(
            `UPDATE shop_applications
             SET status = 'rejected', reject_reason = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
             WHERE id = ?`,
            [rejectReason, adminId, applicationId],
          )
          return
        }

        const [existingShopRows] = await connection.execute(
          'SELECT id FROM shops WHERE owner_id = ? ORDER BY id DESC LIMIT 1',
          [application.user_id],
        )

        let shopId = existingShopRows[0]?.id || null

        if (!shopId) {
          const shopSlug = await makeUniqueShopSlug(connection, application.shop_slug)
          const [createdShop] = await connection.execute(
            `INSERT INTO shops
               (owner_id, name, slug, description, address_line1, province_id, ward_id, ward, province, country, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              application.user_id,
              application.shop_name,
              shopSlug,
              application.description,
              application.address_line1,
              application.province_id,
              application.ward_id,
              application.ward,
              application.province,
              application.country,
            ],
          )
          shopId = createdShop.insertId
        }

        await connection.execute('UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?', ['seller', application.user_id])
        await connection.execute(
          `UPDATE shop_applications
           SET status = 'approved', shop_id = ?, reject_reason = NULL, reviewed_by = ?, reviewed_at = NOW(),
               updated_at = NOW()
           WHERE id = ?`,
          [shopId, adminId, applicationId],
        )
      })

      const applications = await readApplications('pending')
      return res.json({
        ok: true,
        data: applications,
        message: action === 'approve' ? 'Đã duyệt cửa hàng.' : 'Đã từ chối đơn đăng ký.',
      })
    }),
  )
}

module.exports = registerApplicationRoutes
