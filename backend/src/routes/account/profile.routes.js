function registerProfileRoutes(router, context) {
  const {
    query,
    asyncHandler,
    signUserToken,
    allowedGenders,
    saveAvatarDataUrl,
    normalizePhoneNumber,
    normalizeDateOfBirth,
    readProfile,
  } = context

  router.get(
    '/profile',
    asyncHandler(async (req, res) => {
      const profile = await readProfile(Number(req.user.sub))
      if (!profile || !profile.isActive) {
        return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' })
      }

      return res.json({ ok: true, data: profile })
    }),
  )

  router.patch(
    '/profile',
    asyncHandler(async (req, res) => {
      const userId = Number(req.user.sub)
      const fields = []
      const params = []

      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'name')) {
        const name = String(req.body.name || '').trim()
        if (!name || name.length < 2) return res.status(400).json({ ok: false, message: 'Tên không hợp lệ' })

        fields.push('name = ?')
        params.push(name)
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'phone')) {
        const phone = normalizePhoneNumber(req.body.phone)
        fields.push('phone = ?')
        params.push(phone)
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'gender')) {
        const gender = String(req.body.gender || '').trim()
        if (gender && !allowedGenders.has(gender)) {
          return res.status(400).json({ ok: false, message: 'Giới tính không hợp lệ' })
        }

        fields.push('gender = ?')
        params.push(gender || null)
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'dateOfBirth')) {
        fields.push('date_of_birth = ?')
        params.push(normalizeDateOfBirth(req.body.dateOfBirth))
      }

      if (Object.prototype.hasOwnProperty.call(req.body || {}, 'avatarDataUrl')) {
        const avatarUrl = req.body.avatarDataUrl ? await saveAvatarDataUrl(userId, req.body.avatarDataUrl) : ''
        fields.push('avatar_url = ?')
        params.push(avatarUrl || null)
      }

      if (!fields.length) {
        const profile = await readProfile(userId)
        if (!profile) return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' })
        return res.json({ ok: true, data: profile, token: signUserToken(profile) })
      }

      await query(
        `UPDATE users
         SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = ? AND is_active = 1`,
        [...params, userId],
      )

      const profile = await readProfile(userId)
      if (!profile) return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' })

      return res.json({ ok: true, data: profile, token: signUserToken(profile) })
    }),
  )
}

module.exports = registerProfileRoutes
