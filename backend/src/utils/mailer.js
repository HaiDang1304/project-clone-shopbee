const nodemailer = require('nodemailer')

function shouldLogEmail() {
  return String(process.env.EMAIL_DELIVERY || 'console').toLowerCase() === 'console'
}

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
  if (shouldLogEmail()) {
    // eslint-disable-next-line no-console
    console.log(`[ShopBee OTP] ${to}: ${code}`)
    return
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  if (!from) throw new Error('Missing SMTP_FROM/SMTP_USER in environment')

  const transporter = createTransport()
  await transporter.sendMail({
    from,
    to,
    subject: 'ShopBee verification code',
    text: `Your ShopBee verification code is ${code}. It expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.`,
  })
}

module.exports = { sendVerificationEmail }
