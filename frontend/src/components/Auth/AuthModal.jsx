import { useEffect, useState } from 'react'

import { setAuthToken } from '../../lib/api'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import VerifyOtpForm from './VerifyOtpForm'

function getTitle(mode) {
  if (mode === 'register') return 'Đăng ký'
  if (mode === 'verify') return 'Nhập OTP'
  return 'Đăng nhập'
}

function getDescription(mode, verifyEmail) {
  if (mode === 'register') return 'Tạo tài khoản ShopBee mới'
  if (mode === 'verify') return verifyEmail ? `Mã OTP đã gửi tới ${verifyEmail}` : 'Nhập mã OTP đã gửi tới Gmail'
  return 'Đăng nhập để tiếp tục mua sắm'
}

export default function AuthModal({ open, initialMode = 'login', initialEmail = '', onClose }) {
  const [mode, setMode] = useState(initialMode)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function resetModal() {
      await Promise.resolve()
      if (!active || !open) return

      setMode(initialMode)
      if (initialEmail) setVerifyEmail(initialEmail)
      setError('')
      setMessage('')
      setLoading(false)
    }

    resetModal()

    return () => {
      active = false
    }
  }, [initialEmail, initialMode, open])

  useEffect(() => {
    if (!open) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    setMessage('')
  }

  function finishAuth(token) {
    setAuthToken(token)
    setVerifyEmail('')
    setError('')
    setMessage('')
    setLoading(false)
    onClose()
  }

  function handleNeedsVerification({ email, devCode }) {
    setVerifyEmail(email)
    setMode('verify')
    setMessage(devCode ? `Mã OTP dev: ${devCode}` : 'Mã OTP đã được tạo. Vui lòng kiểm tra email của bạn.')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <button
        className="absolute inset-0 bg-black/40"
        type="button"
        aria-label="Đóng modal"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0px_24px_80px_rgba(0,0,0,0.24)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              {getTitle(mode)}
            </h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {getDescription(mode, verifyEmail)}
            </p>
          </div>
          <button
            className="rounded-full p-2 hover:bg-surface-container"
            type="button"
            aria-label="Đóng"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {mode !== 'verify' ? (
          <div className="mb-5 grid grid-cols-2 rounded-lg bg-surface-container p-1">
            <button
              className={`h-10 rounded-md text-label-lg font-label-lg ${
                mode === 'login' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
              }`}
              type="button"
              onClick={() => switchMode('login')}
            >
              Đăng nhập
            </button>
            <button
              className={`h-10 rounded-md text-label-lg font-label-lg ${
                mode === 'register' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
              }`}
              type="button"
              onClick={() => switchMode('register')}
            >
              Đăng ký
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-lg bg-primary/10 px-4 py-3 text-body-sm text-primary">
            {message}
          </div>
        ) : null}

        {mode === 'login' ? (
          <LoginForm
            loading={loading}
            setError={setError}
            setLoading={setLoading}
            onAuthenticated={finishAuth}
          />
        ) : null}

        {mode === 'register' ? (
          <RegisterForm
            loading={loading}
            setError={setError}
            setLoading={setLoading}
            setMessage={setMessage}
            onNeedsVerification={handleNeedsVerification}
            onSwitchMode={switchMode}
          />
        ) : null}

        {mode === 'verify' ? (
          <VerifyOtpForm
            email={verifyEmail}
            loading={loading}
            setError={setError}
            setLoading={setLoading}
            onAuthenticated={finishAuth}
            onChangeEmail={() => switchMode('register')}
          />
        ) : null}
      </div>
    </div>
  )
}
