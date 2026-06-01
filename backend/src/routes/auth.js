const express = require('express')
const bcrypt = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')

const { query } = require('../config/db')
const { asyncHandler } = require('../middleware/error')
const { generateOtpCode, getOtpExpiresAt, hashOtp } = require('../utils/otp')
const { sendVerificationEmail } = require('../utils/mailer')
const { signUserToken } = require('../utils/jwt')

const router = express.Router()

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function toUser(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    googleSub: row.google_sub,
    avatarUrl: row.avatar_url,
    emailVerified: Boolean(row.email_verified),
    verificationCodeHash: row.verification_code_hash,
    verificationExpiresAt: row.verification_expires_at,
    role: row.role,
    isActive: Boolean(row.is_active),
  }
}

function includeDevCode(payload, code) {
  if (process.env.NODE_ENV !== 'production' && process.env.RETURN_OTP_IN_RESPONSE === 'true') {
    return { ...payload, devVerificationCode: code }
  }

  return payload
}

async function createVerificationCode() {
  const code = generateOtpCode()
  return {
    code,
    codeHash: hashOtp(code, process.env.OTP_SECRET),
    expiresAt: getOtpExpiresAt(),
  }
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name || '').trim()
    const email = normalizeEmail(req.body?.email)
    const password = String(req.body?.password || '')

    if (!name || name.length < 2) return res.status(400).json({ ok: false, message: 'Ten khong hop le' })
    if (!isValidEmail(email)) return res.status(400).json({ ok: false, message: 'Email khong hop le' })
    if (!password || password.length < 6)
      return res.status(400).json({ ok: false, message: 'Mat khau toi thieu 6 ky tu' })

    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
    const existing = toUser(rows[0])

    if (existing?.emailVerified) {
      return res.status(409).json({ ok: false, message: 'Email da ton tai' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const verification = await createVerificationCode()

    if (existing) {
      await query(
        `UPDATE users
         SET name = ?, password_hash = ?, verification_code_hash = ?, verification_expires_at = ?,
             verification_last_sent_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [name, passwordHash, verification.codeHash, verification.expiresAt, existing.id],
      )
    } else {
      await query(
        `INSERT INTO users
           (name, email, password_hash, email_verified, verification_code_hash, verification_expires_at,
            verification_last_sent_at, role, is_active)
         VALUES (?, ?, ?, 0, ?, ?, NOW(), 'customer', 1)`,
        [name, email, passwordHash, verification.codeHash, verification.expiresAt],
      )
    }

    await sendVerificationEmail({ to: email, code: verification.code })

    return res.json(includeDevCode({ ok: true, needsVerification: true, email }, verification.code))
  }),
)

router.post(
  '/resend-verification',
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email)
    if (!isValidEmail(email)) return res.status(400).json({ ok: false, message: 'Email khong hop le' })

    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
    const user = toUser(rows[0])

    if (!user) return res.status(404).json({ ok: false, message: 'Khong tim thay tai khoan' })
    if (user.emailVerified) return res.json({ ok: true, alreadyVerified: true })

    const verification = await createVerificationCode()
    await query(
      `UPDATE users
       SET verification_code_hash = ?, verification_expires_at = ?, verification_last_sent_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [verification.codeHash, verification.expiresAt, user.id],
    )
    await sendVerificationEmail({ to: email, code: verification.code })

    return res.json(includeDevCode({ ok: true, needsVerification: true, email }, verification.code))
  }),
)

router.post(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email)
    const code = String(req.body?.code || '').trim()

    if (!isValidEmail(email)) return res.status(400).json({ ok: false, message: 'Email khong hop le' })
    if (!/^[0-9]{6}$/.test(code)) return res.status(400).json({ ok: false, message: 'Ma xac nhan khong hop le' })

    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
    const user = toUser(rows[0])

    if (!user) return res.status(404).json({ ok: false, message: 'Khong tim thay tai khoan' })
    if (!user.isActive) return res.status(403).json({ ok: false, message: 'Tai khoan da bi khoa' })

    if (user.emailVerified) {
      return res.json({ ok: true, token: signUserToken(user) })
    }

    if (!user.verificationCodeHash || !user.verificationExpiresAt) {
      return res.status(400).json({ ok: false, message: 'Chua co ma xac nhan, vui long dang ky lai' })
    }

    if (new Date(user.verificationExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ ok: false, message: 'Ma da het han' })
    }

    const codeHash = hashOtp(code, process.env.OTP_SECRET)
    if (codeHash !== user.verificationCodeHash) {
      return res.status(400).json({ ok: false, message: 'Ma xac nhan khong dung' })
    }

    await query(
      `UPDATE users
       SET email_verified = 1, verification_code_hash = NULL, verification_expires_at = NULL, updated_at = NOW()
       WHERE id = ?`,
      [user.id],
    )

    return res.json({ ok: true, token: signUserToken({ ...user, emailVerified: true }) })
  }),
)

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email)
    const password = String(req.body?.password || '')

    if (!isValidEmail(email)) return res.status(400).json({ ok: false, message: 'Email khong hop le' })
    if (!password) return res.status(400).json({ ok: false, message: 'Thieu mat khau' })

    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
    const user = toUser(rows[0])

    if (!user || !user.isActive) return res.status(401).json({ ok: false, message: 'Sai email hoac mat khau' })
    if (!user.passwordHash) {
      return res.status(400).json({ ok: false, message: 'Tai khoan nay chi dang nhap bang Google' })
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash)
    if (!passwordOk) return res.status(401).json({ ok: false, message: 'Sai email hoac mat khau' })

    if (!user.emailVerified) {
      return res.status(403).json({ ok: false, message: 'Vui long xac nhan email truoc khi dang nhap' })
    }

    return res.json({ ok: true, token: signUserToken(user) })
  }),
)

router.post(
  '/google',
  asyncHandler(async (req, res) => {
    const credential = String(req.body?.credential || '').trim()
    if (!credential) return res.status(400).json({ ok: false, message: 'Thieu credential' })

    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) return res.status(500).json({ ok: false, message: 'Server chua cau hinh GOOGLE_CLIENT_ID' })

    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    })

    const payload = ticket.getPayload()
    if (!payload?.email || !payload?.sub) {
      return res.status(400).json({ ok: false, message: 'Google token khong hop le' })
    }

    const email = normalizeEmail(payload.email)
    const rows = await query('SELECT * FROM users WHERE google_sub = ? OR email = ? LIMIT 1', [payload.sub, email])
    let user = toUser(rows[0])

    if (user) {
      await query(
        `UPDATE users
         SET google_sub = COALESCE(google_sub, ?), avatar_url = COALESCE(avatar_url, ?),
             email_verified = 1, updated_at = NOW()
         WHERE id = ?`,
        [payload.sub, payload.picture || null, user.id],
      )
      user = {
        ...user,
        googleSub: user.googleSub || payload.sub,
        avatarUrl: user.avatarUrl || payload.picture || null,
        emailVerified: true,
      }
    } else {
      const result = await query(
        `INSERT INTO users (name, email, google_sub, avatar_url, email_verified, role, is_active)
         VALUES (?, ?, ?, ?, 1, 'customer', 1)`,
        [payload.name || email, email, payload.sub, payload.picture || null],
      )
      user = {
        id: result.insertId,
        name: payload.name || email,
        email,
        role: 'customer',
        emailVerified: true,
        isActive: true,
      }
    }

    return res.json({ ok: true, token: signUserToken(user) })
  }),
)

module.exports = router
