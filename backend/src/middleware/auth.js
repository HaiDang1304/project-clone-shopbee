const jwt = require('jsonwebtoken')

const { query } = require('../config/db')

async function requireAuth(req, res, next) {
  const header = req.get('authorization') || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ ok: false, message: 'Cần đăng nhập' })
  }

  let decoded

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('Missing JWT_SECRET in environment')

    decoded = jwt.verify(token, secret)
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Token không hợp lệ hoặc đã hết hạn' })
  }

  try {
    const rows = await query('SELECT role, is_active FROM users WHERE id = ? LIMIT 1', [Number(decoded.sub)])
    const user = rows[0]

    if (!user || !Number(user.is_active)) {
      return res.status(401).json({ ok: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa' })
    }

    req.user = {
      ...decoded,
      role: user.role,
    }

    return next()
  } catch (err) {
    return next(err)
  }
}

function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, message: 'Cần đăng nhập' })
    }

    const rows = await query('SELECT role, is_active FROM users WHERE id = ? LIMIT 1', [Number(req.user.sub)])
    const user = rows[0]

    if (!user || !Number(user.is_active)) {
      return res.status(401).json({ ok: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa' })
    }

    req.user.role = user.role

    if (!roles.includes(user.role)) {
      return res.status(403).json({ ok: false, message: 'Bạn không có quyền thực hiện thao tác này' })
    }

    return next()
  }
}

module.exports = { requireAuth, requireRole }
