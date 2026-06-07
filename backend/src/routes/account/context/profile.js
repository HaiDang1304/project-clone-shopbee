const { query } = require('./common')

function toProfile(row) {
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    gender: row.gender || '',
    dateOfBirth: row.dateOfBirth || '',
    avatarUrl: row.avatar_url || '',
    role: row.role,
    hasPassword: Number(row.has_password) === 1,
    hasGoogle: Number(row.has_google) === 1,
    emailVerified: Boolean(row.email_verified),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeDateOfBirth(value) {
  const date = String(value || '').trim()
  if (!date) return null

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const err = new Error('Ngày sinh không hợp lệ')
    err.status = 400
    throw err
  }

  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  const validDate =
    parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day

  if (!validDate) {
    const err = new Error('Ngày sinh không hợp lệ')
    err.status = 400
    throw err
  }

  const now = new Date()
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 10)
  if (date > today) {
    const err = new Error('Ngày sinh không được lớn hơn ngày hiện tại')
    err.status = 400
    throw err
  }

  return date
}

async function readProfile(userId) {
  const rows = await query(
    `SELECT id, name, email, phone, gender, DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS dateOfBirth,
            avatar_url, role,
            (password_hash IS NOT NULL) AS has_password,
            (google_sub IS NOT NULL) AS has_google,
            email_verified, is_active, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId],
  )

  return toProfile(rows[0])
}

module.exports = {
  toProfile,
  normalizeDateOfBirth,
  readProfile,
}
