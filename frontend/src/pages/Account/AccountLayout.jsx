import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import { getAuthUser, subscribeAuth } from '../../lib/auth'
import { getAccountProfile } from '../../lib/account'
import { apiAssetUrl } from '../../lib/api'

const accountNavItems = [
  { to: '/profile', icon: 'person', label: 'Hồ sơ của tôi' },
  { to: '/account/bank-cards', icon: 'payments', label: 'Ngân hàng/Thẻ' },
  { to: '/account/addresses', icon: 'location_on', label: 'Địa chỉ' },
  { to: '/account/password', icon: 'lock', label: 'Đổi mật khẩu' },
  { to: '/messages', icon: 'forum', label: 'Tin nhắn' },
  { to: '/account/seller', icon: 'storefront', label: 'Kênh bán hàng' },
  { to: '/orders', icon: 'shopping_bag', label: 'Đơn mua', separated: true },
]

function getInitial(name, email) {
  return String(name || email || 'U').trim().slice(0, 1).toUpperCase()
}

function AccountAvatar({ user }) {
  if (user.avatarUrl) {
    return (
      <img
        className="h-12 w-12 rounded-full object-cover"
        src={apiAssetUrl(user.avatarUrl)}
        alt={user.name}
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-title-md font-title-md text-on-primary">
      {getInitial(user.name, user.email)}
    </span>
  )
}

export default function AccountLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [authUser, setAuthUser] = useState(() => getAuthUser())
  const [profile, setProfile] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => subscribeAuth(setAuthUser), [])

  useEffect(() => {
    if (!authUser) {
      const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
      navigate(`/login?redirect=${redirect}`, { replace: true })
      return undefined
    }

    let active = true

    async function loadProfile() {
      try {
        const nextProfile = await getAccountProfile()
        if (active) {
          setProfile(nextProfile)
          setLoadError('')
        }
      } catch (err) {
        if (active) setLoadError(err.message || 'Không tải được thông tin tài khoản')
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [authUser, location.pathname, location.search, navigate])

  if (!authUser) return null

  const navItems = accountNavItems.map((item) =>
    item.to === '/account/seller' && profile?.role === 'seller' ? { ...item, to: '/seller/dashboard' } : item,
  )

  return (
    <>
      <Header />
      <main className="min-h-[640px] bg-surface-container-low pt-24 pb-16">
        <div className="mx-auto grid max-w-container-max grid-cols-1 gap-6 px-margin-mobile md:px-margin-desktop lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {profile ? (
              <div className="mb-5 flex min-w-0 items-center gap-3">
                <AccountAvatar user={profile} />
                <div className="min-w-0">
                  <p className="truncate text-label-lg font-label-lg text-on-surface">{profile.name}</p>
                  <NavLink
                    className="mt-1 flex items-center gap-1 text-label-md text-on-surface-variant hover:text-primary"
                    to="/profile"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Sửa hồ sơ
                  </NavLink>
                </div>
              </div>
            ) : (
              <div className="mb-5 rounded-lg bg-surface-container-lowest px-4 py-3 text-body-sm text-on-surface-variant">
                {loadError || 'Đang tải thông tin...'}
              </div>
            )}

            <nav className="rounded-lg bg-surface-container-lowest p-2 shadow-sm lg:bg-transparent lg:p-0 lg:shadow-none">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    `${item.separated ? 'mt-4' : 'mt-1'} flex h-11 items-center gap-3 rounded-md px-4 text-label-md font-label-md transition-colors ${
                      isActive
                        ? 'bg-primary-fixed text-primary'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`
                  }
                  to={item.to}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <section>{children}</section>
        </div>
      </main>
      <Footer />
    </>
  )
}
