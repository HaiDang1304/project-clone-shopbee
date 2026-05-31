const express = require('express')
const bcrypt = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')

const { generateOtpCode, hashOtp } = require('../utils/otp')
const { sendVerificationEmail } = require('../utils/mailer')
const { signUserToken } = require('../utils/jwt')

const User = require('../models/User')

const router = express.Router()

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

router.post('/register', async (req, res) => {
  const name = String(req.body?.name || '').trim()
  const email = normalizeEmail(req.body?.email)
  const password = String(req.body?.password || '')

  if (!name || name.length < 2) return res.status(400).json({ ok: false, message: 'Tên không hợp lệ' })
  if (!isValidEmail(email)) return res.status(400).json({ ok: false, message: 'Email không hợp lệ' })
  if (!password || password.length < 6)
    return res.status(400).json({ ok: false, message: 'Mật khẩu tối thiểu 6 ký tự' })

  const existing = await User.findOne({ email })
  if (existing) return res.status(409).json({ ok: false, message: 'Email đã tồn tại' })

  const passwordHash = await bcrypt.hash(password, 10)

  const code = generateOtpCode()
  const codeHash = hashOtp(code, process.env.OTP_SECRET)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  const user = await User.create({
    name,
    email,
    passwordHash,
    emailVerified: false,
    emailVerification: { codeHash, expiresAt, lastSentAt: new Date() },
  })

  await sendVerificationEmail({ to: email, code })

  return res.json({ ok: true, needsVerification: true, email: user.email })
})

router.post('/verify-email', async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const code = String(req.body?.code || '').trim()

  if (!isValidEmail(email)) return res.status(400).json({ ok: false, message: 'Email không hợp lệ' })
  if (!/^[0-9]{6}$/.test(code)) return res.status(400).json({ ok: false, message: 'Mã xác nhận không hợp lệ' })

  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ ok: false, message: 'Không tìm thấy tài khoản' })

  if (user.emailVerified) {
    const token = signUserToken(user)
    return res.json({ ok: true, token })
  }

  const codeHash = hashOtp(code, process.env.OTP_SECRET)
  const stored = user.emailVerification?.codeHash
  const expiresAt = user.emailVerification?.expiresAt

  if (!stored || !expiresAt) return res.status(400).json({ ok: false, message: 'Chưa có mã xác nhận, vui lòng đăng ký lại' })
  if (new Date(expiresAt).getTime() < Date.now())
    return res.status(400).json({ ok: false, message: 'Mã đã hết hạn' })
  if (stored !== codeHash) return res.status(400).json({ ok: false, message: 'Mã xác nhận không đúng' })

  user.emailVerified = true
  user.emailVerification = { codeHash: undefined, expiresAt: undefined, lastSentAt: user.emailVerification?.lastSentAt }
  await user.save()

  const token = signUserToken(user)
  return res.json({ ok: true, token })
})

router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const password = String(req.body?.password || '')

  if (!isValidEmail(email)) return res.status(400).json({ ok: false, message: 'Email không hợp lệ' })
  if (!password) return res.status(400).json({ ok: false, message: 'Thiếu mật khẩu' })

  const user = await User.findOne({ email })
  if (!user) return res.status(401).json({ ok: false, message: 'Sai email hoặc mật khẩu' })

  if (!user.passwordHash) return res.status(400).json({ ok: false, message: 'Tài khoản này chỉ đăng nhập bằng Google' })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ ok: false, message: 'Sai email hoặc mật khẩu' })

  if (!user.emailVerified) return res.status(403).json({ ok: false, message: 'Vui lòng xác nhận email trước khi đăng nhập' })

  const token = signUserToken(user)
  return res.json({ ok: true, token })
})

router.post('/google', async (req, res) => {
  const credential = String(req.body?.credential || '').trim()
  if (!credential) return res.status(400).json({ ok: false, message: 'Thiếu credential' })

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return res.status(500).json({ ok: false, message: 'Server chưa cấu hình GOOGLE_CLIENT_ID' })

  const client = new OAuth2Client(clientId)

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId,
  })

  const payload = ticket.getPayload()
  if (!payload?.email || !payload?.sub) return res.status(400).json({ ok: false, message: 'Google token không hợp lệ' })

  const email = normalizeEmail(payload.email)

  let user = await User.findOne({ $or: [{ googleSub: payload.sub }, { email }] })

  if (!user) {
    user = await User.create({
      name: payload.name || email,
      email,
      googleSub: payload.sub,
      avatarUrl: payload.picture,
      emailVerified: true,
      role: 'customer',
    })
  } else {
    if (!user.googleSub) user.googleSub = payload.sub
    if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture
    if (!user.emailVerified) user.emailVerified = true
    await user.save()
  }

  const token = signUserToken(user)
  return res.json({ ok: true, token })
})

module.exports = router
