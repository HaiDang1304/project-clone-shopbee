import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiPost } from '../../lib/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiPost('/api/auth/register', { name, email, password })
      if (data?.needsVerification) {
        const next = encodeURIComponent(data.email || email)
        navigate(`/verify-email?email=${next}`)
        return
      }
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container rounded-2xl p-6">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Đăng ký</h1>
        <p className="text-body-md text-on-surface-variant mb-6">Tạo tài khoản ShopBee</p>

        {error ? (
          <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-4 py-3 text-body-sm">{error}</div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-label-md text-on-surface-variant">Họ tên</label>
            <input
              className="w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-0 text-body-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-label-md text-on-surface-variant">Email (Gmail)</label>
            <input
              className="w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-0 text-body-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              type="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-label-md text-on-surface-variant">Mật khẩu</label>
            <input
              className="w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-0 text-body-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              type="password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg disabled:opacity-60"
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <div className="mt-6 text-body-sm text-on-surface-variant">
          Đã có tài khoản?{' '}
          <Link className="text-primary font-label-md" to="/login">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
