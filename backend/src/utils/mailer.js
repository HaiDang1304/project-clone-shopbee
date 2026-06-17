const path = require('path')
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

function buildVerificationEmail({ code }) {
  const expiresMinutes = process.env.OTP_EXPIRES_MINUTES || 10
  const spacedCode = String(code).split('').join(' ')
  const text = [
    'ShopBee verification code',
    '',
    `Your OTP code is ${code}.`,
    `This code expires in ${expiresMinutes} minutes.`,
    'If you did not request this code, you can safely ignore this email.',
  ].join('\n')

  const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ShopBee OTP</title>
  </head>
  <body style="margin:0;background:#f5f2ef;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#2c1810;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f2ef;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;overflow:hidden;border-radius:20px;background:#ffffff;box-shadow:0 18px 48px rgba(55,35,24,0.14);">
            <tr>
              <td style="background:#fff7f0;padding:26px 28px 18px;border-bottom:1px solid #f0d8cb;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width:62px;vertical-align:middle;">
                      <img src="cid:shopbee-logo" width="54" height="54" alt="ShopBee" style="display:block;border:0;border-radius:14px;">
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-size:22px;font-weight:800;line-height:1;color:#c73709;">ShopBee</div>
                      <div style="margin-top:6px;font-size:13px;line-height:18px;color:#7a5748;">Xác minh tài khoản mua sắm của bạn</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 10px;">
                <div style="display:inline-block;border-radius:999px;background:#fff0e7;padding:7px 12px;color:#c73709;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;">Mã xác minh OTP</div>
                <h1 style="margin:18px 0 10px;font-size:26px;line-height:34px;color:#25150f;">Hoàn tất đăng ký ShopBee</h1>
                <p style="margin:0;font-size:15px;line-height:24px;color:#6b4c3f;">Nhập mã bên dưới vào màn hình xác minh để kích hoạt tài khoản. Mã chỉ dùng một lần và sẽ hết hạn sau ${expiresMinutes} phút.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 26px;">
                <div style="border:1px solid #ffd1bf;border-radius:18px;background:#fff8f4;padding:24px 18px;text-align:center;">
                  <div style="font-size:36px;line-height:46px;font-weight:800;letter-spacing:10px;color:#d53f10;">${spacedCode}</div>
                  <div style="margin-top:12px;font-size:13px;line-height:20px;color:#8a6658;">Không chia sẻ mã này với bất kỳ ai.</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 30px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:14px;background:#faf7f5;">
                  <tr>
                    <td style="padding:16px 18px;font-size:13px;line-height:21px;color:#745548;">
                      Nếu bạn không yêu cầu mã này, hãy bỏ qua email. Tài khoản của bạn vẫn an toàn.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#2c1810;padding:18px 28px;text-align:center;font-size:12px;line-height:18px;color:#f7ded2;">
                © ${new Date().getFullYear()} ShopBee. Nền tảng thương mại điện tử tích hợp AI thông minh.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { html, text }
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
  const { html, text } = buildVerificationEmail({ code })
  const logoPath = path.resolve(__dirname, '..', '..', '..', 'frontend', 'public', 'logo_shop.png')

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Mã OTP xác minh tài khoản ShopBee',
      text,
      html,
      attachments: [
        {
          filename: 'logo_shop.png',
          path: logoPath,
          cid: 'shopbee-logo',
        },
      ],
    })
  } catch (err) {
    err.publicMessage = 'Không gửi được mã OTP. Vui lòng kiểm tra cấu hình email SMTP.'
    throw err
  }
}

module.exports = { sendVerificationEmail }
