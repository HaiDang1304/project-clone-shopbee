const jwt = require('jsonwebtoken')

function signUserToken(user) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('Missing JWT_SECRET in environment')

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      email: user.email,
      name: user.name,
    },
    secret,
    { expiresIn },
  )
}

module.exports = { signUserToken }
