import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'

import { apiPost } from '../../lib/api'

const initialLogin = { email: '', password: '' }

export default function LoginForm({ loading, setError, setLoading, onAuthenticated }) {
  const [form, setForm] = useState(initialLogin)

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiPost('/api/auth/login', form)
      onAuthenticated(data.token)
      setForm(initialLogin)
    } catch (err) {
      setError(err.message || 'Dang nhap that bai')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError('')
    setLoading(true)

    try {
      const data = await apiPost('/api/auth/google', {
        credential: credentialResponse.credential,
      })
      onAuthenticated(data.token)
      setForm(initialLogin)
    } catch (err) {
      setError(err.message || 'Dang nhap Google that bai')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-4">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Khong the dang nhap Google')}
        />
      </div>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-surface-container" />
        <span className="text-label-md text-on-surface-variant">hoac</span>
        <div className="h-px flex-1 bg-surface-container" />
      </div>

      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-2">
          <label className="text-label-md text-on-surface-variant">Email</label>
          <input
            className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 text-body-md focus:border-primary focus:ring-0"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-label-md text-on-surface-variant">Mat khau</label>
          <input
            className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 text-body-md focus:border-primary focus:ring-0"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
        </div>
        <button
          className="h-11 w-full rounded-lg bg-primary text-label-lg font-label-lg text-on-primary disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Dang dang nhap...' : 'Dang nhap'}
        </button>
      </form>
    </>
  )
}
