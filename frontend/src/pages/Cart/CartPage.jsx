import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import { useCart } from '../../context/useCart'
import { apiAssetUrl } from '../../lib/api'
import { getAuthUser, subscribeAuth } from '../../lib/auth'
import { formatCurrency, productPath } from '../../lib/format'

const CHECKOUT_STORAGE_KEY = 'shopbee_checkout'

function optionText(options) {
  const entries = Object.entries(options || {})
  if (!entries.length) return ''
  return entries.map(([name, value]) => `${name}: ${value}`).join(' / ')
}

function QuantityControl({ item, disabled, onChange }) {
  function submitQuantity(value) {
    const quantity = Number.parseInt(value, 10)
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      toast.error('Số lượng không hợp lệ')
      return
    }
    if (quantity > item.stock) {
      toast.error('Số lượng vượt quá tồn kho')
      return
    }
    onChange(quantity)
  }

  return (
    <div className="flex h-9 items-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
      <button
        className="flex h-9 w-9 items-center justify-center hover:bg-surface-container disabled:opacity-40"
        type="button"
        disabled={disabled || item.quantity <= 1}
        onClick={() => submitQuantity(item.quantity - 1)}
        aria-label="Giảm số lượng"
      >
        <span className="material-symbols-outlined text-[18px]">remove</span>
      </button>
      <input
        className="h-9 w-12 border-0 bg-transparent text-center text-body-sm focus:ring-0"
        type="number"
        min="1"
        max={item.stock || undefined}
        value={item.quantity}
        disabled={disabled}
        onChange={(event) => submitQuantity(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
        aria-label="Số lượng"
      />
      <button
        className="flex h-9 w-9 items-center justify-center hover:bg-surface-container disabled:opacity-40"
        type="button"
        disabled={disabled || item.quantity >= item.stock}
        onClick={() => submitQuantity(item.quantity + 1)}
        aria-label="Tăng số lượng"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
      </button>
    </div>
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cartItems, loading, loadCart, updateCartItem, removeCartItem } = useCart()
  const [authUser, setAuthUser] = useState(() => getAuthUser())
  const [selectedIds, setSelectedIds] = useState([])
  const [workingItemId, setWorkingItemId] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => subscribeAuth(setAuthUser), [])

  useEffect(() => {
    if (!authUser) {
      const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
      navigate(`/login?redirect=${redirect}`, { replace: true })
    }
  }, [authUser, location.pathname, location.search, navigate])

  useEffect(() => {
    if (authUser) loadCart().catch((err) => toast.error(err.message || 'Không tải được giỏ hàng'))
  }, [authUser, loadCart])

  useEffect(() => {
    let active = true

    async function syncSelection() {
      await Promise.resolve()
      if (!active) return

      setSelectedIds((current) => {
        const validIds = new Set(cartItems.map((item) => item.id))
        const kept = current.filter((id) => validIds.has(id))
        if (!kept.length && cartItems.length) return cartItems.map((item) => item.id)
        return kept
      })
    }

    syncSelection()

    return () => {
      active = false
    }
  }, [cartItems])

  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedIds.includes(item.id)),
    [cartItems, selectedIds],
  )
  const allSelected = cartItems.length > 0 && selectedItems.length === cartItems.length
  const selectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
  const selectedAmount = selectedItems.reduce((sum, item) => sum + item.lineTotal, 0)

  async function handleQuantityChange(item, quantity) {
    setWorkingItemId(item.id)
    try {
      await updateCartItem(item.id, quantity)
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được số lượng')
    } finally {
      setWorkingItemId(null)
    }
  }

  async function handleRemove(item) {
    setWorkingItemId(item.id)
    try {
      await removeCartItem(item.id)
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng')
    } catch (err) {
      toast.error(err.message || 'Không xóa được sản phẩm')
    } finally {
      setWorkingItemId(null)
    }
  }

  async function handleRemoveSelected() {
    if (!selectedIds.length) {
      toast.warning('Vui lòng chọn sản phẩm cần xóa')
      return
    }

    setWorkingItemId('selected')
    try {
      for (const itemId of selectedIds) {
        await removeCartItem(itemId)
      }
      setSelectedIds([])
      toast.success('Đã xóa sản phẩm đã chọn')
    } catch (err) {
      toast.error(err.message || 'Không xóa được sản phẩm đã chọn')
    } finally {
      setWorkingItemId(null)
    }
  }

  function handleCheckout() {
    if (!selectedItems.length) {
      toast.warning('Vui lòng chọn sản phẩm cần mua')
      return
    }

    setCheckingOut(true)
    sessionStorage.setItem(
      CHECKOUT_STORAGE_KEY,
      JSON.stringify({
        source: 'cart',
        cartItemIds: selectedItems.map((item) => item.id),
        items: selectedItems,
        createdAt: Date.now(),
      }),
    )
    navigate('/checkout')
  }

  if (!authUser) return null

  return (
    <>
      <Header />
      <main className="min-h-[640px] bg-surface-container-low pt-24 pb-20">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-headline-sm font-headline-sm text-on-surface">Giỏ hàng</h1>
              <p className="mt-1 text-body-sm text-on-surface-variant">Kiểm tra sản phẩm trước khi thanh toán</p>
            </div>
            <Link className="text-label-md font-label-md text-primary hover:underline" to="/">
              Tiếp tục mua sắm
            </Link>
          </div>

          {!loading && !cartItems.length ? (
            <section className="rounded-lg bg-surface-container-lowest px-6 py-16 text-center shadow-sm">
              <span className="material-symbols-outlined text-[48px] text-primary">shopping_cart</span>
              <h2 className="mt-4 text-title-md font-title-md text-on-surface">Giỏ hàng đang trống</h2>
              <p className="mt-2 text-body-sm text-on-surface-variant">Hãy thêm sản phẩm yêu thích để bắt đầu mua hàng.</p>
              <Link
                className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-label-md font-label-md text-on-primary hover:bg-primary/90"
                to="/"
              >
                Về trang chủ
              </Link>
            </section>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm">
                <div className="hidden grid-cols-[44px_minmax(0,1fr)_120px_140px_120px_80px] items-center gap-4 border-b border-outline-variant px-5 py-3 text-label-md font-label-md text-on-surface-variant md:grid">
                  <input
                    className="rounded border-outline-variant text-primary focus:ring-primary"
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) =>
                      setSelectedIds(event.target.checked ? cartItems.map((item) => item.id) : [])
                    }
                    aria-label="Chọn tất cả"
                  />
                  <span>Sản phẩm</span>
                  <span className="text-right">Đơn giá</span>
                  <span className="text-center">Số lượng</span>
                  <span className="text-right">Thành tiền</span>
                  <span />
                </div>

                {loading && !cartItems.length ? (
                  <div className="px-5 py-6 text-body-sm text-on-surface-variant">Đang tải giỏ hàng...</div>
                ) : null}

                <div className="divide-y divide-outline-variant">
                  {cartItems.map((item) => {
                    const selected = selectedIds.includes(item.id)
                    const options = optionText(item.selectedOptions)
                    return (
                      <article
                        key={item.id}
                        className="grid gap-4 px-4 py-4 md:grid-cols-[44px_minmax(0,1fr)_120px_140px_120px_80px] md:items-center md:px-5"
                      >
                        <input
                          className="rounded border-outline-variant text-primary focus:ring-primary"
                          type="checkbox"
                          checked={selected}
                          onChange={(event) => {
                            setSelectedIds((current) =>
                              event.target.checked
                                ? [...current, item.id]
                                : current.filter((id) => id !== item.id),
                            )
                          }}
                          aria-label={`Chọn ${item.name}`}
                        />

                        <div className="flex min-w-0 gap-3">
                          <Link className="shrink-0" to={productPath(item)}>
                            {item.imageUrl ? (
                              <img
                                className="h-20 w-20 rounded-lg object-cover"
                                src={apiAssetUrl(item.imageUrl)}
                                alt={item.name}
                              />
                            ) : (
                              <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-surface-container text-primary">
                                <span className="material-symbols-outlined text-[28px]">inventory_2</span>
                              </span>
                            )}
                          </Link>
                          <div className="min-w-0">
                            <Link className="line-clamp-2 text-body-md font-semibold text-on-surface hover:text-primary" to={productPath(item)}>
                              {item.name}
                            </Link>
                            {item.shop?.name ? (
                              <p className="mt-1 text-body-sm text-on-surface-variant">{item.shop.name}</p>
                            ) : null}
                            {options ? (
                              <p className="mt-1 text-body-sm text-on-surface-variant">Phân loại: {options}</p>
                            ) : item.variantName ? (
                              <p className="mt-1 text-body-sm text-on-surface-variant">Phân loại: {item.variantName}</p>
                            ) : null}
                            <p className="mt-1 text-body-sm text-on-surface-variant">Còn {item.stock} sản phẩm</p>
                          </div>
                        </div>

                        <p className="text-right text-body-sm text-on-surface md:text-body-md">{formatCurrency(item.unitPrice)}</p>
                        <div className="justify-self-start md:justify-self-center">
                          <QuantityControl
                            item={item}
                            disabled={workingItemId === item.id || loading}
                            onChange={(quantity) => handleQuantityChange(item, quantity)}
                          />
                        </div>
                        <p className="text-right text-title-sm font-title-sm text-primary">{formatCurrency(item.lineTotal)}</p>
                        <button
                          className="justify-self-start text-label-md font-label-md text-on-surface-variant hover:text-error md:justify-self-end"
                          type="button"
                          disabled={workingItemId === item.id || loading}
                          onClick={() => handleRemove(item)}
                        >
                          Xóa
                        </button>
                      </article>
                    )
                  })}
                </div>
              </section>

              <aside className="lg:sticky lg:top-24 lg:self-start">
                <section className="rounded-lg bg-surface-container-lowest px-5 py-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-outline-variant pb-4">
                    <label className="flex items-center gap-2 text-body-sm text-on-surface">
                      <input
                        className="rounded border-outline-variant text-primary focus:ring-primary"
                        type="checkbox"
                        checked={allSelected}
                        onChange={(event) =>
                          setSelectedIds(event.target.checked ? cartItems.map((item) => item.id) : [])
                        }
                      />
                      Chọn tất cả
                    </label>
                    <button
                      className="text-label-md font-label-md text-on-surface-variant hover:text-error disabled:opacity-60"
                      type="button"
                      disabled={!selectedIds.length || workingItemId === 'selected'}
                      onClick={handleRemoveSelected}
                    >
                      Xóa đã chọn
                    </button>
                  </div>

                  <div className="space-y-3 border-b border-outline-variant py-4">
                    <div className="flex justify-between gap-3 text-body-sm">
                      <span className="text-on-surface-variant">Sản phẩm đã chọn</span>
                      <span className="font-semibold text-on-surface">{selectedQuantity}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-body-sm">
                      <span className="text-on-surface-variant">Tổng tiền hàng</span>
                      <span className="font-semibold text-on-surface">{formatCurrency(selectedAmount)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-4">
                    <span className="text-title-sm font-title-sm text-on-surface">Tổng thanh toán</span>
                    <span className="text-title-md font-title-md text-primary">{formatCurrency(selectedAmount)}</span>
                  </div>

                  <button
                    className="h-12 w-full rounded-lg bg-primary text-label-lg font-label-lg text-on-primary hover:bg-primary/90 disabled:opacity-60"
                    type="button"
                    disabled={!selectedItems.length || checkingOut}
                    onClick={handleCheckout}
                  >
                    {checkingOut ? 'Đang xử lý...' : 'Mua hàng'}
                  </button>
                </section>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
