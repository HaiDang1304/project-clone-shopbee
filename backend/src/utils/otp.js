const crypto = require('crypto')

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000))
}

function hashOtp(code, otpSecret) {
  if (!otpSecret) throw new Error('Missing OTP_SECRET in environment')
  return crypto.createHash('sha256').update(`${code}:${otpSecret}`).digest('hex')
}

function getOtpExpiresAt() {
  const minutes = Number(process.env.OTP_EXPIRES_MINUTES || 10)
  return new Date(Date.now() + minutes * 60 * 1000)
}

module.exports = {
  generateOtpCode,
  getOtpExpiresAt,
  hashOtp,
}
