const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  const header = req.get('authorization') || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ ok: false, message: 'Cần đăng nhập' })
  }

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('Missing JWT_SECRET in environment')

    req.user = jwt.verify(token, secret)
    return next()
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Token không hợp lệ hoặc đã hết hạn' })
  }
}

module.exports = { requireAuth }
