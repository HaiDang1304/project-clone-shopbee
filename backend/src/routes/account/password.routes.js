function registerPasswordRoutes(router, context) {
  const {
    bcrypt,
    query,
    asyncHandler,
  } = context

  router.patch(
    '/password',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const currentPassword = String(req.body?.currentPassword || '')
      const newPassword = String(req.body?.newPassword || '')

      if (!currentPassword) return res.status(400).json({ ok: false, message: 'Thiếu mật khẩu hiện tại' })
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ ok: false, message: 'Mật khẩu mới tối thiểu 6 ký tự' })
      }
      if (currentPassword === newPassword) {
        return res.status(400).json({ ok: false, message: 'Mật khẩu mới phải khác mật khẩu hiện tại' })
      }

      const rows = await query('SELECT password_hash FROM users WHERE id = ? AND is_active = 1 LIMIT 1', [userId])
      const user = rows[0]
      if (!user) return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' })
      if (!user.password_hash) {
        return res.status(400).json({ ok: false, message: 'Tài khoản này chưa có mật khẩu nội bộ' })
      }

      const passwordOk = await bcrypt.compare(currentPassword, user.password_hash)
      if (!passwordOk) return res.status(400).json({ ok: false, message: 'Mật khẩu hiện tại không đúng' })

      const passwordHash = await bcrypt.hash(newPassword, 10)
      await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, userId])

      return res.json({ ok: true, message: 'Đã đổi mật khẩu' })
    }),
  )

  router.patch(
    '/password/setup',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const newPassword = String(req.body?.newPassword || '')

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ ok: false, message: 'Mật khẩu mới tối thiểu 6 ký tự' })
      }

      const rows = await query(
        'SELECT password_hash FROM users WHERE id = ? AND is_active = 1 LIMIT 1',
        [userId],
      )
      const user = rows[0]
      if (!user) return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' })
      if (user.password_hash) {
        return res.status(400).json({ ok: false, message: 'Tài khoản này đã có mật khẩu nội bộ' })
      }

      const passwordHash = await bcrypt.hash(newPassword, 10)
      await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, userId])

      return res.json({ ok: true, message: 'Đã thiết lập mật khẩu' })
    }),
  )
}

module.exports = registerPasswordRoutes
