function registerUserRoutes(router, context) {
  const {
    query,
    transaction,
    asyncHandler,
    allowedUserRoles,
    readAdminUsersData,
  } = context

  router.get(
    '/users',
    asyncHandler(async (req, res) => {
      const users = await readAdminUsersData()
      return res.json({ ok: true, data: users })
    }),
  )

  router.patch(
    '/users/:userId',
    asyncHandler(async (req, res) => {
      const userId = Number(req.params.userId)
      const adminId = Number(req.user.sub)
      const fields = []
      const params = []
      let nextRole = null

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(400).json({ ok: false, message: 'Người dùng không hợp lệ' })
      }

      const rows = await query('SELECT id, role, is_active FROM users WHERE id = ? LIMIT 1', [userId])
      const user = rows[0]

      if (!user) {
        return res.status(404).json({ ok: false, message: 'Không tìm thấy người dùng' })
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'role')) {
        const role = String(req.body.role || '').trim()
        if (!allowedUserRoles.has(role)) {
          return res.status(400).json({ ok: false, message: 'Vai trò không hợp lệ' })
        }

        if (userId === adminId && role !== 'admin') {
          return res.status(400).json({ ok: false, message: 'Không thể tự hạ quyền tài khoản admin hiện tại' })
        }

        nextRole = role
        fields.push('role = ?')
        params.push(role)
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'isActive')) {
        const isActiveValue = req.body.isActive
        const isActive =
          isActiveValue === true || isActiveValue === 1 || isActiveValue === '1' || isActiveValue === 'true'

        if (userId === adminId && !isActive) {
          return res.status(400).json({ ok: false, message: 'Không thể tự khóa tài khoản đang đăng nhập' })
        }

        fields.push('is_active = ?')
        params.push(isActive ? 1 : 0)
      }

      if (!fields.length) {
        const users = await readAdminUsersData()
        return res.json({ ok: true, data: users })
      }

      await transaction(async (connection) => {
        await connection.execute(
          `UPDATE users
           SET ${fields.join(', ')}, updated_at = NOW()
           WHERE id = ?`,
          [...params, userId],
        )

        if (user.role === 'seller' && nextRole && nextRole !== 'seller') {
          await connection.execute(
            `UPDATE products p
             JOIN shops s ON s.id = p.shop_id
             SET p.status = 'hidden', p.is_active = 0, p.updated_at = NOW()
             WHERE s.owner_id = ?`,
            [userId],
          )
          await connection.execute('UPDATE shops SET is_active = 0, updated_at = NOW() WHERE owner_id = ?', [userId])
        }
      })

      const users = await readAdminUsersData()
      return res.json({ ok: true, data: users, message: 'Đã cập nhật người dùng.' })
    }),
  )

  router.delete(
    '/users/:userId',
    asyncHandler(async (req, res) => {
      const userId = Number(req.params.userId)
      const adminId = Number(req.user.sub)

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(400).json({ ok: false, message: 'Người dùng không hợp lệ' })
      }

      if (userId === adminId) {
        return res.status(400).json({ ok: false, message: 'Không thể tự xóa tài khoản đang đăng nhập' })
      }

      const userRows = await query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId])
      if (!userRows.length) {
        return res.status(404).json({ ok: false, message: 'Không tìm thấy người dùng' })
      }

      const [orderRows, shopRows] = await Promise.all([
        query('SELECT COUNT(*) AS count FROM orders WHERE user_id = ?', [userId]),
        query('SELECT COUNT(*) AS count FROM shops WHERE owner_id = ?', [userId]),
      ])
      const orderCount = Number(orderRows[0]?.count || 0)
      const shopCount = Number(shopRows[0]?.count || 0)

      if (orderCount || shopCount) {
        return res.status(409).json({
          ok: false,
          message: 'Không thể xóa người dùng đã có đơn hàng hoặc cửa hàng. Hãy khóa tài khoản nếu cần ngừng hoạt động.',
        })
      }

      await query('DELETE FROM users WHERE id = ?', [userId])

      const users = await readAdminUsersData()
      return res.json({ ok: true, data: users, message: 'Đã xóa người dùng.' })
    }),
  )
}

module.exports = registerUserRoutes
