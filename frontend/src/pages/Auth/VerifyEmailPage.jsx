import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiPost, setAuthToken } from '../../lib/api'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const query = useQuery()
  const email = query.get('email') || ''

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiPost('/api/auth/verify-email', { email, code })
      setAuthToken(data.token)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Xác nhận thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container rounded-2xl p-6">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Xác nhận email</h1>
        <p className="text-body-md text-on-surface-variant mb-6">
          Nhập mã 6 số đã gửi tới: <span className="text-on-surface font-label-md">{email || '(chưa có email)'}</span>
        </p>

        {error ? (
          <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-4 py-3 text-body-sm">{error}</div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-label-md text-on-surface-variant">Mã xác nhận</label>
            <input
              className="w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-0 text-body-md tracking-[0.3em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="______"
              inputMode="numeric"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full h-11 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg disabled:opacity-60"
          >
            {loading ? 'Đang xác nhận...' : 'Xác nhận'}
          </button>
        </form>

        <div className="mt-6 text-body-sm text-on-surface-variant">
          Quay lại{' '}
          <Link className="text-primary font-label-md" to="/register">
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  )
}
