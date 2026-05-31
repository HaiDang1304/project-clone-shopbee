import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { apiPost, setAuthToken } from '../../lib/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiPost('/api/auth/login', { email, password })
      setAuthToken(data.token)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  async function onGoogleSuccess(credentialResponse) {
    setError('')
    try {
      const data = await apiPost('/api/auth/google', { credential: credentialResponse.credential })
      setAuthToken(data.token)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Đăng nhập Google thất bại')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container rounded-2xl p-6">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Đăng nhập</h1>
        <p className="text-body-md text-on-surface-variant mb-6">Chào mừng quay lại ShopBee</p>

        {error ? (
          <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-4 py-3 text-body-sm">{error}</div>
        ) : null}

        <div className="mb-4">
          <GoogleLogin onSuccess={onGoogleSuccess} onError={() => setError('Không thể đăng nhập Google')} />
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-surface-container flex-1" />
          <span className="text-label-md text-on-surface-variant">hoặc</span>
          <div className="h-px bg-surface-container flex-1" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-label-md text-on-surface-variant">Email</label>
            <input
              className="w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-0 text-body-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              type="password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg disabled:opacity-60"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 text-body-sm text-on-surface-variant">
          Chưa có tài khoản?{' '}
          <Link className="text-primary font-label-md" to="/register">
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  )
}
