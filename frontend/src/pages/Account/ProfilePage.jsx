import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import AccountLayout from './AccountLayout'
import { getAccountProfile, updateAccountProfile } from '../../lib/account'
import { apiAssetUrl } from '../../lib/api'
import { setAuthToken } from '../../lib/auth'

const maxAvatarSize = 10 * 1024 * 1024
const phonePattern = '[0-9]{10}'

const emptyForm = {
  name: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  avatarDataUrl: '',
}

const genderOptions = [
  { value: '', label: 'Chưa chọn' },
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
]

function getInitial(name, email) {
  return String(name || email || 'U').trim().slice(0, 1).toUpperCase()
}

function normalizePhoneInput(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10)
}

function toForm(profile) {
  return {
    name: profile?.name || '',
    phone: profile?.phone || '',
    gender: profile?.gender || '',
    dateOfBirth: profile?.dateOfBirth || '',
    avatarDataUrl: '',
  }
}

function getTodayDateValue() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 10)
}

function ProfileAvatar({ profile, previewUrl }) {
  if (previewUrl) {
    return (
      <img
        className="h-24 w-24 rounded-full object-cover"
        src={previewUrl}
        alt={profile?.name || 'Avatar'}
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-headline-md font-headline-md text-on-primary">
      {getInitial(profile?.name, profile?.email)}
    </span>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const data = await getAccountProfile()
        if (active) {
          setProfile(data)
          setForm(toForm(data))
        }
      } catch (err) {
        if (active) toast.error(err.message || 'Không tải được hồ sơ')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  const missingFields = useMemo(() => {
    if (!profile) return []

    return [
      !profile.phone ? 'số điện thoại' : '',
      !profile.gender ? 'giới tính' : '',
      !profile.dateOfBirth ? 'ngày sinh' : '',
      !profile.avatarUrl ? 'ảnh đại diện' : '',
    ].filter(Boolean)
  }, [profile])

  const avatarPreviewUrl = form.avatarDataUrl || apiAssetUrl(profile?.avatarUrl)
  const todayDate = useMemo(() => getTodayDateValue(), [])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Chỉ hỗ trợ ảnh JPEG hoặc PNG')
      event.target.value = ''
      return
    }

    if (file.size > maxAvatarSize) {
      toast.error('Dung lượng ảnh tối đa 10MB')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      updateField('avatarDataUrl', String(reader.result || ''))
    }
    reader.onerror = () => toast.error('Không đọc được ảnh đã chọn')
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        ...(form.avatarDataUrl ? { avatarDataUrl: form.avatarDataUrl } : {}),
      }
      const data = await updateAccountProfile(payload)
      if (data.token) setAuthToken(data.token)
      setProfile(data.data)
      setForm(toForm(data.data))
      toast.success('Đã cập nhật hồ sơ.')
    } catch (err) {
      toast.error(err.message || 'Cập nhật hồ sơ thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AccountLayout>
      <form
        className="rounded-lg bg-surface-container-lowest px-6 py-6 shadow-[0px_16px_48px_rgba(0,0,0,0.08)] md:px-8"
        onSubmit={handleSubmit}
      >
        <div className="border-b border-outline-variant pb-4">
          <h1 className="text-title-md font-title-md text-on-surface">Hồ sơ của tôi</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
        </div>

        {loading ? (
          <div className="mt-4 rounded-lg bg-surface-container px-4 py-3 text-body-sm text-on-surface-variant">
            Đang tải hồ sơ...
          </div>
        ) : null}

        {!loading && missingFields.length ? (
          <div className="mt-4 rounded-lg bg-surface-container px-4 py-3 text-body-sm text-red-500">
            <p className="text-red-500">Cập nhật {missingFields.join(', ')} để hoàn thành hồ sơ.</p>
          </div>
        ) : null}

        <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-5 lg:pr-8">
            <label className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
              <span className="text-right text-body-sm text-on-surface-variant sm:block">Tên</span>
              <input
                className="h-10 w-full max-w-sm rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                disabled={loading || saving}
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
              <span className="text-right text-body-sm text-on-surface-variant sm:block">Email</span>
              <span className="text-body-sm text-on-surface">{profile?.email || ''}</span>
            </div>

            <label className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
              <span className="text-right text-body-sm text-on-surface-variant sm:block">Số điện thoại</span>
              <input
                className="h-10 w-full max-w-sm rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                type="tel"
                inputMode="numeric"
                pattern={phonePattern}
                maxLength={10}
                title="Số điện thoại phải gồm đúng 10 chữ số"
                value={form.phone}
                onChange={(event) => updateField('phone', normalizePhoneInput(event.target.value))}
                disabled={loading || saving}
                required
              />
            </label>

            <label className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
              <span className="text-right text-body-sm text-on-surface-variant sm:block">Giới tính</span>
              <select
                className="h-10 w-full max-w-sm rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                value={form.gender}
                onChange={(event) => updateField('gender', event.target.value)}
                disabled={loading || saving}
              >
                {genderOptions.map((option) => (
                  <option key={option.value || 'empty'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
              <span className="text-right text-body-sm text-on-surface-variant sm:block">Ngày sinh</span>
              <input
                className="h-10 w-full max-w-sm rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                type="date"
                value={form.dateOfBirth}
                max={todayDate}
                onChange={(event) => updateField('dateOfBirth', event.target.value)}
                disabled={loading || saving}
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
              <span />
              <button
                className="h-10 w-28 rounded-lg bg-primary text-label-md font-label-md text-on-primary hover:bg-primary/90 disabled:opacity-60"
                type="submit"
                disabled={loading || saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center border-t border-outline-variant pt-6 lg:border-l lg:border-t-0 lg:pt-0">
            <div className="rounded-full bg-inverse-surface p-2">
              <ProfileAvatar profile={profile} previewUrl={avatarPreviewUrl} />
            </div>

            <label className="mt-5 flex h-10 cursor-pointer items-center justify-center rounded-lg border border-outline-variant px-5 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary">
              Chọn ảnh
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleAvatarChange}
                disabled={loading || saving}
              />
            </label>

            <p className="mt-4 text-center text-body-sm text-on-surface-variant">Dung lượng file tối đa 10MB</p>
            <p className="mt-1 text-center text-body-sm text-on-surface-variant">Định dạng: JPEG, PNG</p>
            {!avatarPreviewUrl ? (
              <p className="mt-2 text-center text-body-sm text-primary">Cập nhật ảnh để hoàn thành hồ sơ.</p>
            ) : null}
          </div>
        </div>
      </form>
    </AccountLayout>
  )
}
