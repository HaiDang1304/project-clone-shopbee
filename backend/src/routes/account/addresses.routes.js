function registerAddressRoutes(router, context) {
  const {
    transaction,
    asyncHandler,
    normalizeAddressPayload,
    readLocationTree,
    resolveLocationIds,
    readAddresses,
  } = context

  router.get(
    '/locations',
    asyncHandler(async (req, res) => {
      const locations = await readLocationTree()
      return res.json({ ok: true, data: locations })
    }),
  )

  router.get(
    '/addresses',
    asyncHandler(async (req, res) => {
      const addresses = await readAddresses(Number(req.user.sub))
      return res.json({ ok: true, data: addresses })
    }),
  )

  router.post(
    '/addresses',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const address = normalizeAddressPayload(req.body)
      const location = await resolveLocationIds(address.provinceId, address.wardId)
      Object.assign(address, location)

      await transaction(async (connection) => {
        const [existingRows] = await connection.execute('SELECT COUNT(*) AS count FROM user_addresses WHERE user_id = ?', [
          userId,
        ])
        const shouldBeDefault = address.isDefault || Number(existingRows[0]?.count || 0) === 0

        if (shouldBeDefault) {
          await connection.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId])
        }

        await connection.execute(
          `INSERT INTO user_addresses
             (user_id, full_name, phone, line1, province_id, ward_id, ward, province, is_default)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            address.fullName,
            address.phone,
            address.line1,
            address.provinceId,
            address.wardId,
            address.ward,
            address.province,
            shouldBeDefault ? 1 : 0,
          ],
        )
      })

      const addresses = await readAddresses(userId)
      return res.status(201).json({ ok: true, data: addresses, message: 'Đã thêm địa chỉ' })
    }),
  )

  router.patch(
    '/addresses/:addressId',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const addressId = Number(req.params.addressId)
      const address = normalizeAddressPayload(req.body)
      const location = await resolveLocationIds(address.provinceId, address.wardId)
      Object.assign(address, location)

      if (!Number.isSafeInteger(addressId) || addressId <= 0) {
        return res.status(400).json({ ok: false, message: 'Địa chỉ không hợp lệ' })
      }

      const updated = await transaction(async (connection) => {
        const [rows] = await connection.execute('SELECT id FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1', [
          addressId,
          userId,
        ])

        if (!rows.length) return false

        if (address.isDefault) {
          await connection.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId])
        }

        await connection.execute(
          `UPDATE user_addresses
           SET full_name = ?, phone = ?, line1 = ?, province_id = ?, ward_id = ?,
               ward = ?, province = ?, is_default = ?, updated_at = NOW()
           WHERE id = ? AND user_id = ?`,
          [
            address.fullName,
            address.phone,
            address.line1,
            address.provinceId,
            address.wardId,
            address.ward,
            address.province,
            address.isDefault ? 1 : 0,
            addressId,
            userId,
          ],
        )

        return true
      })

      if (!updated) return res.status(404).json({ ok: false, message: 'Không tìm thấy địa chỉ' })

      const addresses = await readAddresses(userId)
      return res.json({ ok: true, data: addresses, message: 'Đã cập nhật địa chỉ' })
    }),
  )

  router.delete(
    '/addresses/:addressId',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const addressId = Number(req.params.addressId)

      if (!Number.isSafeInteger(addressId) || addressId <= 0) {
        return res.status(400).json({ ok: false, message: 'Địa chỉ không hợp lệ' })
      }

      const deleted = await transaction(async (connection) => {
        const [rows] = await connection.execute(
          'SELECT id, is_default AS isDefault FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1',
          [addressId, userId],
        )

        if (!rows.length) return false

        const wasDefault = Boolean(rows[0].isDefault)
        await connection.execute('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId])

        if (wasDefault) {
          const [remainingRows] = await connection.execute(
            `SELECT id
             FROM user_addresses
             WHERE user_id = ?
             ORDER BY updated_at DESC, id DESC
             LIMIT 1`,
            [userId],
          )

          if (remainingRows.length) {
            await connection.execute('UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [
              remainingRows[0].id,
              userId,
            ])
          }
        }

        return true
      })

      if (!deleted) return res.status(404).json({ ok: false, message: 'Không tìm thấy địa chỉ' })

      const addresses = await readAddresses(userId)
      return res.json({ ok: true, data: addresses, message: 'Đã xóa địa chỉ' })
    }),
  )
}

module.exports = registerAddressRoutes
