import { useState } from 'react'

import { apiPost } from '../../lib/api'

const initialRegister = { name: '', email: '', password: '' }

export default function RegisterForm({
  loading,
  setError,
  setLoading,
  setMessage,
  onNeedsVerification,
  onSwitchMode,
}) {
  const [form, setForm] = useState(initialRegister)

  async function handleRegister(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const data = await apiPost('/api/auth/register', form)

      if (data?.needsVerification) {
        onNeedsVerification({
          email: data.email || form.email,
          devCode: data.devVerificationCode,
        })
        setForm(initialRegister)
        return
      }

      onSwitchMode('login')
      setMessage('Dang ky thanh cong. Vui long dang nhap.')
      setForm(initialRegister)
    } catch (err) {
      setError(err.message || 'Dang ky that bai')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleRegister}>
      <div className="space-y-2">
        <label className="text-label-md text-on-surface-variant">Ho ten</label>
        <input
          className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 text-body-md focus:border-primary focus:ring-0"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Nguyen Van A"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-label-md text-on-surface-variant">Email Gmail</label>
        <input
          className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 text-body-md focus:border-primary focus:ring-0"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="example@gmail.com"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-label-md text-on-surface-variant">Mat khau</label>
        <input
          className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 text-body-md focus:border-primary focus:ring-0"
          type="password"
          minLength={6}
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          placeholder="Toi thieu 6 ky tu"
          required
        />
      </div>
      <button
        className="h-11 w-full rounded-lg bg-primary text-label-lg font-label-lg text-on-primary disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Dang xu ly...' : 'Dang ky'}
      </button>
    </form>
  )
}
