const crypto = require('crypto')

function generateOtpCode() {
  // 6 digits
  return String(Math.floor(100000 + Math.random() * 900000))
}

function hashOtp(code, otpSecret) {
  if (!otpSecret) throw new Error('Missing OTP_SECRET in environment')
  return crypto.createHash('sha256').update(`${code}:${otpSecret}`).digest('hex')
}

module.exports = { generateOtpCode, hashOtp }
