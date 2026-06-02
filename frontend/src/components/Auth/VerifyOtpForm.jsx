import { useState } from 'react'

import { apiPost } from '../../lib/api'

export default function VerifyOtpForm({
  email,
  loading,
  setError,
  setLoading,
  onAuthenticated,
  onChangeEmail,
}) {
  const [otp, setOtp] = useState('')

  async function handleVerify(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiPost('/api/auth/verify-email', {
        email,
        code: otp,
      })
      onAuthenticated(data.token)
      setOtp('')
    } catch (err) {
      setError(err.message || 'Xác minh OTP thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleVerify}>
      <div className="space-y-2">
        <label className="text-label-md text-on-surface-variant">Mã OTP</label>
        <input
          className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 text-center text-title-lg tracking-[0.35em] focus:border-primary focus:ring-0"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="______"
          inputMode="numeric"
          required
        />
      </div>
      <button
        className="h-11 w-full rounded-lg bg-primary text-label-lg font-label-lg text-on-primary disabled:opacity-60"
        type="submit"
        disabled={loading || otp.length !== 6 || !email}
      >
        {loading ? 'Đang xác minh...' : 'Xác minh OTP'}
      </button>
      <button
        className="h-10 w-full rounded-lg text-label-lg font-label-lg text-primary hover:bg-primary/5"
        type="button"
        onClick={onChangeEmail}
      >
        Đổi email đăng ký
      </button>
    </form>
  )
}
