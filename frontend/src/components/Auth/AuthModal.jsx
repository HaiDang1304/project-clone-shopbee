import { useEffect, useState } from 'react'

import { setAuthToken } from '../../lib/api'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import VerifyOtpForm from './VerifyOtpForm'

function getTitle(mode) {
  if (mode === 'register') return 'Dang ky'
  if (mode === 'verify') return 'Nhap OTP'
  return 'Dang nhap'
}

function getDescription(mode, verifyEmail) {
  if (mode === 'register') return 'Tao tai khoan ShopBee moi'
  if (mode === 'verify') return verifyEmail ? `Ma OTP da gui toi ${verifyEmail}` : 'Nhap ma OTP da gui toi Gmail'
  return 'Dang nhap de tiep tuc mua sam'
}

export default function AuthModal({ open, initialMode = 'login', initialEmail = '', onClose }) {
  const [mode, setMode] = useState(initialMode)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!open) return

    setMode(initialMode)
    if (initialEmail) setVerifyEmail(initialEmail)
    setError('')
    setMessage('')
    setLoading(false)
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
    setMessage(devCode ? `Ma OTP dev: ${devCode}` : 'Da gui ma OTP toi Gmail cua ban.')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <button
        className="absolute inset-0 bg-black/40"
        type="button"
        aria-label="Dong modal"
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
            aria-label="Dong"
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
              Dang nhap
            </button>
            <button
              className={`h-10 rounded-md text-label-lg font-label-lg ${
                mode === 'register' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
              }`}
              type="button"
              onClick={() => switchMode('register')}
            >
              Dang ky
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
