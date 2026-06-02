import { useEffect, useRef, useState } from 'react'

import { getAccountProfile } from '../../lib/account'
import { apiAssetUrl } from '../../lib/api'
import { clearAuthToken, getAuthUser, subscribeAuth } from '../../lib/auth'
import AuthModal from './AuthModal'
import UserMenu from './UserMenu'

function getInitial(name, email) {
  return String(name || email || 'U').trim().slice(0, 1).toUpperCase()
}

export default function AccountButton({ buttonClassName = '', showName = false }) {
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authUser, setAuthUser] = useState(() => getAuthUser())
  const [user, setUser] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => subscribeAuth(setAuthUser), [])

  useEffect(() => {
    let active = true

    async function loadUserFromDatabase() {
      if (!authUser) {
        if (active) setUser(null)
        return
      }

      try {
        const profile = await getAccountProfile()
        if (active) setUser(profile)
      } catch {
        if (active) setUser(null)
      }
    }

    loadUserFromDatabase()

    return () => {
      active = false
    }
  }, [authUser])

  useEffect(() => {
    if (!menuOpen) return undefined

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [menuOpen])

  function handleLogout() {
    clearAuthToken()
    setMenuOpen(false)
    setAuthOpen(false)
  }

  if (!authUser) {
    return (
      <>
        <button
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${buttonClassName}`}
          type="button"
          aria-label="Tài khoản"
          onClick={() => setAuthOpen(true)}
        >
          <span className="material-symbols-outlined">account_circle</span>
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    )
  }

  if (!user) {
    return (
      <button
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${buttonClassName}`}
        type="button"
        aria-label="Đang tải tài khoản"
        disabled
      >
        <span className="material-symbols-outlined">account_circle</span>
      </button>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className={`flex h-10 min-w-0 items-center gap-2 rounded-full px-2 text-left transition-colors ${buttonClassName}`}
        type="button"
        aria-label="Tài khoản"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((current) => !current)}
      >
        {user.avatarUrl ? (
          <img
            className="h-8 w-8 rounded-full object-cover"
            src={apiAssetUrl(user.avatarUrl)}
            alt={user.name}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-label-lg font-label-lg text-on-primary">
            {getInitial(user.name, user.email)}
          </span>
        )}
        {showName ? (
          <span className="hidden max-w-[132px] truncate text-label-md font-label-md text-on-surface xl:block">
            {user.name}
          </span>
        ) : null}
        <span className="material-symbols-outlined text-[20px]">expand_more</span>
      </button>

      {menuOpen ? (
        <UserMenu user={user} onClose={() => setMenuOpen(false)} onLogout={handleLogout} />
      ) : null}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
