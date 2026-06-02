const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_CHANGED_EVENT = 'auth:changed'

function decodeJwtPayload(token) {
  const payload = token?.split('.')[1]
  if (!payload) return null

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

function emitAuthChanged(token) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { token } }))
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
  else localStorage.removeItem(AUTH_TOKEN_KEY)
  emitAuthChanged(token || '')
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getAuthUser() {
  const token = getAuthToken()
  const payload = decodeJwtPayload(token)

  if (!payload?.sub) return null
  if (payload.exp && payload.exp * 1000 <= Date.now()) return null

  return {
    id: payload.sub,
    name: payload.name || payload.email || 'Khach hang',
    email: payload.email || '',
    role: payload.role || 'customer',
    avatarUrl: payload.avatarUrl || '',
  }
}

export function clearAuthToken() {
  setAuthToken('')
}

export function subscribeAuth(listener) {
  function notify() {
    listener(getAuthUser())
  }

  window.addEventListener(AUTH_CHANGED_EVENT, notify)
  window.addEventListener('storage', notify)

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, notify)
    window.removeEventListener('storage', notify)
  }
}
