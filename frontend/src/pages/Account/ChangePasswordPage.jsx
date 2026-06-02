import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import AccountLayout from './AccountLayout'
import { changeAccountPassword, getAccountProfile, setupAccountPassword } from '../../lib/account'

const initialForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const emptyVisibility = {
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
}

function PasswordInput({ disabled, label, name, onChange, visible, onToggleVisible, value, autoComplete }) {
  return (
    <label className="grid gap-2 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center">
      <span className="text-right text-body-sm text-on-surface-variant">{label}</span>
      <span className="relative block">
        <input
          className="h-10 w-full rounded-lg border-outline-variant bg-surface-container-low pr-11 text-body-sm focus:border-primary focus:ring-primary"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
          autoComplete={autoComplete}
          minLength={name === 'currentPassword' ? undefined : 6}
          disabled={disabled}
          required
        />
        <button
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-60"
          type="button"
          onClick={() => onToggleVisible(name)}
          disabled={disabled}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          <span className="material-symbols-outlined text-[20px]">{visible ? 'visibility_off' : 'visibility'}</span>
        </button>
      </span>
    </label>
  )
}

export default function ChangePasswordPage() {
  const [form, setForm] = useState(initialForm)
  const [visible, setVisible] = useState(emptyVisibility)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasPassword, setHasPassword] = useState(null)

  const isSetupMode = useMemo(() => hasPassword === false, [hasPassword])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const profile = await getAccountProfile()
        if (cancelled) return
        setHasPassword(profile?.hasPassword === undefined ? true : Boolean(profile?.hasPassword))
      } catch {
        // Fallback: keep default flow; API errors will show on submit.
        if (!cancelled) setHasPassword(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleVisible(field) {
    setVisible((current) => ({ ...current, [field]: !current[field] }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!isSetupMode && !form.currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại')
      return
    }

    if (!form.newPassword || form.newPassword.length < 6) {
      toast.error('Mật khẩu mới tối thiểu 6 ký tự')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error('Mật khẩu mới không khớp')
      return
    }

    if (!isSetupMode && form.currentPassword === form.newPassword) {
      toast.error('Mật khẩu mới phải khác mật khẩu hiện tại')
      return
    }

    setSaving(true)

    try {
      if (isSetupMode) {
        await setupAccountPassword({ newPassword: form.newPassword })
        setHasPassword(true)
        toast.success('Đã thiết lập mật khẩu.')
      } else {
        await changeAccountPassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        })
        toast.success('Đã đổi mật khẩu.')
      }
      setForm(initialForm)
      setVisible(emptyVisibility)
    } catch (err) {
      const message = err?.message || (isSetupMode ? 'Thiết lập mật khẩu thất bại' : 'Đổi mật khẩu thất bại')

      if (!isSetupMode && /chưa có mật khẩu nội bộ/i.test(message)) {
        setHasPassword(false)
        setForm((current) => ({ ...current, currentPassword: '' }))
        toast.info('Tài khoản của bạn chưa có mật khẩu nội bộ. Vui lòng thiết lập mật khẩu trước.')
        return
      }

      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AccountLayout>
      <form
        className="rounded-lg bg-surface-container-lowest px-6 py-6 shadow-sm md:px-8"
        onSubmit={handleSubmit}
      >
        <div className="border-b border-outline-variant pb-4">
          <h1 className="text-title-md font-title-md text-on-surface">{isSetupMode ? 'Thiết lập mật khẩu' : 'Đổi mật khẩu'}</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {isSetupMode
              ? 'Tài khoản của bạn chưa có mật khẩu nội bộ. Hãy thiết lập mật khẩu để lần sau có thể đổi mật khẩu.'
              : 'Xác thực mật khẩu hiện tại trước khi đặt mật khẩu mới'}
          </p>
        </div>

        <div className="mt-6 max-w-lg space-y-5">
          {!loading && !isSetupMode ? (
            <PasswordInput
              autoComplete="current-password"
              disabled={saving || loading}
              label="Mật khẩu hiện tại"
              name="currentPassword"
              onChange={updateField}
              onToggleVisible={toggleVisible}
              value={form.currentPassword}
              visible={visible.currentPassword}
            />
          ) : null}
          <PasswordInput
            autoComplete="new-password"
            disabled={saving || loading}
            label={isSetupMode ? 'Mật khẩu' : 'Mật khẩu mới'}
            name="newPassword"
            onChange={updateField}
            onToggleVisible={toggleVisible}
            value={form.newPassword}
            visible={visible.newPassword}
          />
          <PasswordInput
            autoComplete="new-password"
            disabled={saving || loading}
            label={isSetupMode ? 'Nhập lại mật khẩu' : 'Nhập lại mật khẩu'}
            name="confirmPassword"
            onChange={updateField}
            onToggleVisible={toggleVisible}
            value={form.confirmPassword}
            visible={visible.confirmPassword}
          />
          <div className="grid gap-2 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center">
            <span />
            <button
              className="h-10 w-32 rounded-lg bg-primary text-label-md font-label-md text-on-primary hover:bg-primary/90 disabled:opacity-60"
              type="submit"
              disabled={saving || loading}
            >
              {loading ? 'Đang tải...' : saving ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </form>
    </AccountLayout>
  )
}
