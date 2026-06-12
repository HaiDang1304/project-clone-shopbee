import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import AccountButton from '../Auth/AccountButton'
import ReviewModal from '../Reviews/ReviewModal'
import { useCart } from '../../context/useCart'
import {
  getAccountNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../lib/account'
import { getAuthUser, subscribeAuth } from '../../lib/auth'

const emptyNotifications = { items: [], unreadCount: 0 }

function formatNotificationTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function notificationIcon(type) {
  if (type === 'review') return 'rate_review'
  if (type === 'order') return 'local_shipping'
  return 'notifications'
}

export default function Header() {
  const navigate = useNavigate()
  const { cartCount } = useCart()
  const [authUser, setAuthUser] = useState(() => getAuthUser())
  const [notifications, setNotifications] = useState(emptyNotifications)
  const [searchTerm, setSearchTerm] = useState('')
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [reviewRequest, setReviewRequest] = useState(null)
  const notificationRef = useRef(null)
  const displayCount = cartCount > 99 ? '99+' : cartCount
  const unreadCount = Number(notifications.unreadCount || 0)
  const unreadDisplay = unreadCount > 99 ? '99+' : unreadCount

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!getAuthUser()) {
      setNotifications(emptyNotifications)
      return
    }

    if (!silent) setLoadingNotifications(true)
    try {
      const data = await getAccountNotifications()
      setNotifications({
        items: Array.isArray(data.items) ? data.items : [],
        unreadCount: Number(data.unreadCount || 0),
      })
    } catch (err) {
      if (!silent) toast.error(err.message || 'Không tải được thông báo')
    } finally {
      if (!silent) setLoadingNotifications(false)
    }
  }, [])

  useEffect(() => {
    return subscribeAuth((user) => {
      setAuthUser(user)
      if (!user) {
        setNotifications(emptyNotifications)
        setNotificationOpen(false)
      }
    })
  }, [])

  useEffect(() => {
    if (!authUser) return undefined

    let active = true
    Promise.resolve().then(() => {
      if (active) loadNotifications()
    })
    const timer = window.setInterval(() => loadNotifications({ silent: true }), 30000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [authUser, loadNotifications])

  useEffect(() => {
    if (!notificationOpen) return undefined

    function handlePointerDown(event) {
      if (!notificationRef.current?.contains(event.target)) setNotificationOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [notificationOpen])

  function applyNotificationRead(notificationId) {
    setNotifications((current) => {
      const target = current.items.find((item) => item.id === notificationId)
      const wasUnread = target && !target.isRead

      return {
        ...current,
        unreadCount: wasUnread ? Math.max(0, Number(current.unreadCount || 0) - 1) : current.unreadCount,
        items: current.items.map((item) =>
          item.id === notificationId
            ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }
            : item,
        ),
      }
    })
  }

  function handleNotificationClick(notification) {
    if (!notification.isRead) {
      applyNotificationRead(notification.id)
      markNotificationRead(notification.id).catch(() => loadNotifications({ silent: true }))
    }

    if (notification.type === 'review' && notification.metadata?.products?.length) {
      setNotificationOpen(false)
      setReviewRequest({
        orderId: notification.orderId || notification.metadata.orderId,
        products: notification.metadata.products,
        productId: notification.productId,
      })
      return
    }

    setNotificationOpen(false)
    if (notification.actionUrl) navigate(notification.actionUrl)
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead()
      setNotifications((current) => ({
        unreadCount: 0,
        items: current.items.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() })),
      }))
    } catch (err) {
      toast.error(err.message || 'Không đánh dấu được thông báo')
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    const keyword = searchTerm.trim()
    navigate(keyword ? `/search?q=${encodeURIComponent(keyword)}` : '/search')
  }

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-surface shadow-[0px_4px_20px_rgba(0,0,0,0.05)] h-16 flex items-center">
        <div className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-8 flex-1">
          <Link to="/" aria-label="Trang chủ">
            <img src="/logo_shop_remote.png" alt="ShopBee" className="h-20 w-auto" />
          </Link>
          <form className="hidden md:flex flex-1 max-w-xl relative" onSubmit={handleSearchSubmit}>
            <input
              className="w-full h-10 pl-4 pr-12 rounded-lg border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-0 text-body-md"
              placeholder="Tìm kiếm sản phẩm, shop..."
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary"
              type="submit"
              aria-label="Tìm kiếm"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </form>
          </div>

          <nav className="hidden lg:flex items-center gap-6 px-8">
          <Link
            className="text-primary font-bold border-b-2 border-primary pb-1 font-label-md text-label-md"
            to="/"
          >
            Trang chủ
          </Link>
          <Link className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md" to="/category/thoi-trang">
            Thời trang
          </Link>
          <Link className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md" to="/category/gia-dung">
            Gia dụng
          </Link>
          <Link className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md" to="/category/lam-dep">
            Làm đẹp
          </Link>
          <Link className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md" to="/vouchers">
            Voucher
          </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationRef}>
              <button
                className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container"
                type="button"
                aria-label="Thông báo"
                aria-expanded={notificationOpen}
                onClick={() => setNotificationOpen((current) => !current)}
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
                    {unreadDisplay}
                  </span>
                ) : null}
              </button>

              {notificationOpen ? (
                <div className="absolute right-0 top-12 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-xl">
                  <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-4 py-3">
                    <div>
                      <p className="text-title-sm font-title-sm text-on-surface">Thông báo</p>
                      {unreadCount > 0 ? (
                        <p className="text-body-sm text-on-surface-variant">{unreadCount} thông báo chưa đọc</p>
                      ) : null}
                    </div>
                    {unreadCount > 0 ? (
                      <button
                        className="text-label-md font-label-md text-primary hover:underline"
                        type="button"
                        onClick={handleMarkAllRead}
                      >
                        Đọc tất cả
                      </button>
                    ) : null}
                  </div>

                  {!authUser ? (
                    <div className="px-4 py-5 text-center">
                      <p className="text-body-sm text-on-surface-variant">Đăng nhập để xem thông báo của bạn.</p>
                      <Link
                        className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-label-md font-label-md text-on-primary"
                        to="/login"
                        onClick={() => setNotificationOpen(false)}
                      >
                        Đăng nhập
                      </Link>
                    </div>
                  ) : loadingNotifications ? (
                    <div className="px-4 py-5 text-body-sm text-on-surface-variant">Đang tải thông báo...</div>
                  ) : notifications.items.length ? (
                    <div className="max-h-[420px] overflow-y-auto">
                      {notifications.items.map((notification) => (
                        <button
                          key={notification.id}
                          className={`flex w-full gap-3 border-b border-outline-variant px-4 py-3 text-left last:border-b-0 hover:bg-surface-container-low ${
                            notification.isRead ? 'bg-surface-container-lowest' : 'bg-primary-fixed/55'
                          }`}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
                            <span className="material-symbols-outlined text-[20px]">{notificationIcon(notification.type)}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-1 text-body-sm font-semibold text-on-surface">{notification.title}</span>
                            <span className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">{notification.message}</span>
                            <span className="mt-1 block text-[11px] font-semibold text-on-surface-variant/70">
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </span>
                          {!notification.isRead ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <span className="material-symbols-outlined text-[34px] text-primary">notifications</span>
                      <p className="mt-2 text-body-sm text-on-surface-variant">Chưa có thông báo mới.</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          <Link
            to="/cart"
            className="p-2 hover:bg-surface-container rounded-full relative"
            aria-label="Giỏ hàng"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
                {displayCount}
              </span>
            ) : null}
          </Link>
          <AccountButton buttonClassName="hover:bg-surface-container rounded-full" showName />
          </div>
        </div>
      </header>

      {reviewRequest ? (
        <ReviewModal
          open
          orderId={reviewRequest.orderId}
          products={reviewRequest.products || []}
          initialProductId={reviewRequest.productId}
          onClose={() => setReviewRequest(null)}
          onSubmitted={() => loadNotifications({ silent: true })}
        />
      ) : null}
    </>
  )
}
