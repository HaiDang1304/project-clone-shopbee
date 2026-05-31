const nodemailer = require('nodemailer')

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('Missing SMTP_HOST/SMTP_USER/SMTP_PASS in environment')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

async function sendVerificationEmail({ to, code }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  if (!from) throw new Error('Missing SMTP_FROM/SMTP_USER in environment')

  const transporter = createTransport()

  await transporter.sendMail({
    from,
    to,
    subject: 'Mã xác nhận đăng ký ShopBee',
    text: `Mã xác nhận của bạn là: ${code}. Mã có hiệu lực trong 10 phút.`,
  })
}

module.exports = { sendVerificationEmail }
