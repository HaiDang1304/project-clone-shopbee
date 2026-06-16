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

function AccountAvatar({ user, className = 'h-12 w-12', textClassName = 'text-title-md font-title-md' }) {
  if (user.avatarUrl) {
    return (
      <img
        className={`${className} rounded-full object-cover`}
        src={apiAssetUrl(user.avatarUrl)}
        alt={user.name}
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <span className={`flex ${className} items-center justify-center rounded-full bg-primary ${textClassName} text-on-primary`}>
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
      <main className="min-h-[640px] bg-surface-container-low pb-10 pt-16 md:pb-16 md:pt-24">
        <div className="mx-auto grid max-w-container-max grid-cols-1 gap-4 px-margin-mobile md:px-margin-desktop lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
          <aside className="sticky top-16 z-30 -mx-margin-mobile border-b border-outline-variant bg-surface-container-low/95 px-margin-mobile py-2 shadow-sm backdrop-blur md:-mx-margin-desktop md:px-margin-desktop lg:top-24 lg:z-auto lg:mx-0 lg:self-start lg:border-b-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            {profile ? (
              <div className="mb-2 flex min-w-0 items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 shadow-sm lg:mb-5 lg:gap-3 lg:bg-transparent lg:p-0 lg:shadow-none">
                <AccountAvatar
                  user={profile}
                  className="h-9 w-9 shrink-0 lg:h-12 lg:w-12"
                  textClassName="text-label-lg font-label-lg lg:text-title-md lg:font-title-md"
                />
                <div className="min-w-0">
                  <p className="truncate text-label-lg font-label-lg text-on-surface">{profile.name}</p>
                  <NavLink
                    className="mt-0.5 flex items-center gap-1 text-label-md text-on-surface-variant hover:text-primary lg:mt-1"
                    to="/profile"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Sửa hồ sơ
                  </NavLink>
                </div>
              </div>
            ) : (
              <div className="mb-2 rounded-lg bg-surface-container-lowest px-4 py-3 text-body-sm text-on-surface-variant shadow-sm lg:mb-5 lg:shadow-none">
                {loadError || 'Đang tải thông tin...'}
              </div>
            )}

            <nav
              className="custom-scrollbar flex gap-2 overflow-x-auto pb-1 lg:block lg:overflow-visible lg:rounded-lg lg:bg-transparent lg:p-0 lg:pb-0 lg:shadow-none"
              aria-label="Account navigation"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    `${item.separated ? 'lg:mt-4' : 'lg:mt-1'} flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-label-md font-label-md transition-colors lg:h-11 lg:w-full lg:gap-3 lg:rounded-md lg:px-4 ${
                      isActive
                        ? 'bg-primary-fixed text-primary shadow-sm lg:shadow-none'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface lg:bg-transparent'
                    }`
                  }
                  to={item.to}
                >
                  <span className="material-symbols-outlined text-[19px] lg:text-[20px]">{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>

          <section className="min-w-0 pt-1 lg:pt-0">{children}</section>
        </div>
      </main>
      <Footer />
    </>
  )
}
