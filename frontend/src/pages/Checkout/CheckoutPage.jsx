import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { toast } from 'react-toastify'

import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import { useCart } from '../../context/useCart'
import { getAccountAddresses } from '../../lib/account'
import { apiAssetUrl } from '../../lib/api'
import { getAuthUser, subscribeAuth } from '../../lib/auth'
import { calculateShippingFee, createOrder } from '../../lib/orders'
import { formatCount, formatCurrency, productPath } from '../../lib/format'

const CHECKOUT_STORAGE_KEY = 'shopbee_checkout'
const LAST_ORDER_STORAGE_KEY = 'shopbee_last_order'

const paymentMethods = [
  { value: 'cod', label: 'Thanh toán khi nhận hàng' },
  { value: 'bank', label: 'Chuyển khoản ngân hàng' },
]

function readCheckoutData() {
  try {
    const data = JSON.parse(sessionStorage.getItem(CHECKOUT_STORAGE_KEY) || 'null')
    if (!data || !Array.isArray(data.items) || !data.items.length) return null
    return data
  } catch {
    return null
  }
}

function formatAddress(address) {
  return [address.line1, address.ward, address.province].filter(Boolean).join(', ')
}

function optionText(options) {
  const entries = Object.entries(options || {})
  if (!entries.length) return ''
  return entries.map(([name, value]) => `${name}: ${value}`).join(' / ')
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loadCart } = useCart()
  const [authUser, setAuthUser] = useState(() => getAuthUser())
  const [checkoutData] = useState(() => readCheckoutData())
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [voucherCode, setVoucherCode] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [shippingQuote, setShippingQuote] = useState(null)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState('')

  useEffect(() => subscribeAuth(setAuthUser), [])

  useEffect(() => {
    if (!authUser) {
      const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
      navigate(`/login?redirect=${redirect}`, { replace: true })
    }
  }, [authUser, location.pathname, location.search, navigate])

  useEffect(() => {
    if (!checkoutData) {
      navigate('/cart', { replace: true })
    }
  }, [checkoutData, navigate])

  useEffect(() => {
    if (!authUser) return undefined

    let active = true
    async function loadAddresses() {
      setLoading(true)
      try {
        const nextAddresses = await getAccountAddresses()
        if (active) {
          setAddresses(nextAddresses)
          const defaultAddress = nextAddresses.find((address) => address.isDefault) || nextAddresses[0]
          setSelectedAddressId(defaultAddress?.id ? String(defaultAddress.id) : '')
        }
      } catch (err) {
        if (active) toast.error(err.message || 'Không tải được địa chỉ nhận hàng')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadAddresses()

    return () => {
      active = false
    }
  }, [authUser])

  const items = useMemo(() => checkoutData?.items || [], [checkoutData])
  const itemsTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0),
    [items],
  )
  const shippingFee = Number(shippingQuote?.totalShippingFee || 0)
  const shippingWeightGrams = useMemo(() => {
    return (shippingQuote?.shops || []).reduce((sum, shop) => sum + Number(shop.totalWeightGrams || 0), 0)
  }, [shippingQuote])
  const discountTotal = 0
  const grandTotal = itemsTotal + shippingFee - discountTotal
  const selectedAddress = addresses.find((address) => String(address.id) === String(selectedAddressId))

  const buildCheckoutPayload = useCallback((addressId = selectedAddressId) => {
    const payload = {
      source: checkoutData?.source === 'cart' ? 'cart' : 'buyNow',
      addressId: Number(addressId),
    }

    if (payload.source === 'cart') {
      payload.cartItemIds = checkoutData.cartItemIds || items.map((item) => item.id).filter(Boolean)
    } else {
      payload.items = items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions || {},
      }))
    }

    return payload
  }, [checkoutData, items, selectedAddressId])

  useEffect(() => {
    if (!checkoutData?.items?.length || !selectedAddressId) {
      return undefined
    }

    let active = true
    async function loadShippingFee() {
      setShippingLoading(true)
      setShippingError('')
      try {
        const quote = await calculateShippingFee(buildCheckoutPayload(selectedAddressId))
        if (active) setShippingQuote(quote)
      } catch (err) {
        if (active) {
          setShippingQuote(null)
          setShippingError(err.message || 'Không tính được phí vận chuyển')
        }
      } finally {
        if (active) setShippingLoading(false)
      }
    }

    loadShippingFee()
    return () => {
      active = false
    }
  }, [buildCheckoutPayload, checkoutData?.items?.length, selectedAddressId])

  async function handlePlaceOrder() {
    if (!checkoutData?.items?.length) {
      toast.error('Không có sản phẩm để thanh toán')
      return
    }

    if (!selectedAddressId) {
      toast.error('Vui lòng chọn địa chỉ nhận hàng')
      return
    }

    if (!paymentMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán')
      return
    }

    if (shippingLoading) {
      toast.info('Đang tính phí vận chuyển, vui lòng chờ trong giây lát')
      return
    }

    if (shippingError || !shippingQuote) {
      toast.error(shippingError || 'Vui lòng tính phí vận chuyển trước khi đặt hàng')
      return
    }

    setPlacingOrder(true)
    try {
      const payload = {
        ...buildCheckoutPayload(selectedAddressId),
        paymentMethod,
        note,
      }

      const order = await createOrder(payload)
      sessionStorage.removeItem(CHECKOUT_STORAGE_KEY)
      sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(order))
      await loadCart().catch(() => {})
      await Swal.fire({
        icon: 'success',
        title: paymentMethod === 'bank' ? 'Đã tạo mã QR thanh toán' : 'Đặt hàng thành công',
        text:
          paymentMethod === 'bank'
            ? 'Vui lòng quét mã QR PayOS ở màn hình tiếp theo để hoàn tất thanh toán.'
            : 'Đơn hàng của bạn đã được ghi nhận và đang chờ xác nhận.',
        confirmButtonText: paymentMethod === 'bank' ? 'Thanh toán ngay' : 'Xem đơn hàng',
        confirmButtonColor: '#c2410c',
      })
      navigate(`/order-success?orderId=${order.id}`)
    } catch (err) {
      toast.error(err.message || 'Đặt hàng thất bại')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (!authUser || !checkoutData) return null

  return (
    <>
      <Header />
      <main className="min-h-[640px] bg-surface-container-low pt-24 pb-20">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-headline-sm font-headline-sm text-on-surface">Thanh toán</h1>
              <p className="mt-1 text-body-sm text-on-surface-variant">Kiểm tra địa chỉ, sản phẩm và phương thức thanh toán</p>
            </div>
            <Link className="text-label-md font-label-md text-primary hover:underline" to="/cart">
              Quay lại giỏ hàng
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <section className="rounded-lg bg-surface-container-lowest px-5 py-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-outline-variant pb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <h2 className="text-title-sm font-title-sm text-on-surface">Địa chỉ nhận hàng</h2>
                  </div>
                  <Link className="text-label-md font-label-md text-primary hover:underline" to="/account/addresses">
                    Quản lý địa chỉ
                  </Link>
                </div>

                {loading ? (
                  <p className="text-body-sm text-on-surface-variant">Đang tải địa chỉ...</p>
                ) : !addresses.length ? (
                  <div className="rounded-lg border border-dashed border-outline-variant px-4 py-5 text-center">
                    <p className="text-body-sm text-on-surface-variant">Bạn chưa có địa chỉ nhận hàng.</p>
                    <Link
                      className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-label-md font-label-md text-on-primary"
                      to="/account/addresses"
                    >
                      Thêm địa chỉ
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`flex cursor-pointer gap-3 rounded-lg border px-4 py-4 ${
                          String(selectedAddressId) === String(address.id)
                            ? 'border-primary bg-primary-fixed'
                            : 'border-outline-variant hover:border-primary'
                        }`}
                      >
                        <input
                          className="mt-1 rounded-full border-outline-variant text-primary focus:ring-primary"
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={String(selectedAddressId) === String(address.id)}
                          onChange={(event) => setSelectedAddressId(event.target.value)}
                        />
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2 text-body-md font-semibold text-on-surface">
                            {address.fullName}
                            <span className="text-on-surface-variant">|</span>
                            <span>{address.phone}</span>
                            {address.isDefault ? (
                              <span className="rounded border border-primary px-2 py-0.5 text-label-sm text-primary">Mặc định</span>
                            ) : null}
                          </span>
                          <span className="mt-1 block text-body-sm text-on-surface-variant">{formatAddress(address)}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg bg-surface-container-lowest shadow-sm">
                <div className="border-b border-outline-variant px-5 py-4">
                  <h2 className="text-title-sm font-title-sm text-on-surface">Sản phẩm thanh toán</h2>
                </div>

                <div className="divide-y divide-outline-variant">
                  {items.map((item) => {
                    const options = optionText(item.selectedOptions)
                    return (
                      <article key={`${item.productId}-${item.variantId || 'base'}-${options}`} className="flex gap-4 px-5 py-4">
                        {item.imageUrl ? (
                          <img className="h-20 w-20 shrink-0 rounded-lg object-cover" src={apiAssetUrl(item.imageUrl)} alt={item.name} />
                        ) : (
                          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                            <span className="material-symbols-outlined text-[28px]">inventory_2</span>
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link className="line-clamp-2 text-body-md font-semibold text-on-surface hover:text-primary" to={productPath(item)}>
                            {item.name}
                          </Link>
                          {item.shop?.name ? <p className="mt-1 text-body-sm text-on-surface-variant">{item.shop.name}</p> : null}
                          {options ? <p className="mt-1 text-body-sm text-on-surface-variant">Phân loại: {options}</p> : null}
                          <p className="mt-2 text-body-sm text-on-surface-variant">x{item.quantity}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-body-sm text-on-surface">{formatCurrency(item.unitPrice)}</p>
                          <p className="mt-2 text-title-sm font-title-sm text-primary">
                            {formatCurrency(Number(item.unitPrice || 0) * Number(item.quantity || 0))}
                          </p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>

              <section className="grid gap-4 rounded-lg bg-surface-container-lowest px-5 py-5 shadow-sm md:grid-cols-2">
                <div>
                  <h2 className="text-title-sm font-title-sm text-on-surface">Phương thức vận chuyển</h2>
                  <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg border border-primary bg-primary-fixed px-4 py-3">
                    <input className="text-primary focus:ring-primary" type="radio" checked readOnly />
                    <span>
                      <span className="block text-body-md font-semibold text-on-surface">ShopBee vận chuyển</span>
                      <span className="block text-body-sm text-on-surface-variant">
                        {shippingLoading
                          ? 'Đang tính phí vận chuyển...'
                          : shippingQuote
                            ? `${formatCurrency(shippingFee)} · ${formatCount(shippingWeightGrams)} g`
                            : shippingError || 'Chọn địa chỉ để tính phí'}
                      </span>
                    </span>
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-title-sm font-title-sm text-on-surface">Voucher</span>
                  <div className="flex gap-2">
                    <input
                      className="h-11 min-w-0 flex-1 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                      value={voucherCode}
                      onChange={(event) => setVoucherCode(event.target.value)}
                      placeholder="Nhập mã voucher"
                    />
                    <button
                      className="h-11 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface-variant"
                      type="button"
                      onClick={() => toast.info('Hệ thống hiện chưa có bảng voucher')}
                    >
                      Áp dụng
                    </button>
                  </div>
                </label>
              </section>

              <section className="rounded-lg bg-surface-container-lowest px-5 py-5 shadow-sm">
                <h2 className="text-title-sm font-title-sm text-on-surface">Phương thức thanh toán</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                        paymentMethod === method.value
                          ? 'border-primary bg-primary-fixed'
                          : 'border-outline-variant hover:border-primary'
                      }`}
                    >
                      <input
                        className="text-primary focus:ring-primary"
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                      />
                      <span className="text-body-sm font-semibold text-on-surface">{method.label}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-lg bg-surface-container-lowest px-5 py-5 shadow-sm">
                <h2 className="text-title-sm font-title-sm text-on-surface">Tóm tắt thanh toán</h2>
                {selectedAddress ? (
                  <div className="mt-4 rounded-lg bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
                    Giao đến: <span className="font-semibold text-on-surface">{selectedAddress.fullName}</span>
                  </div>
                ) : null}

                <div className="mt-4 space-y-3 border-b border-outline-variant pb-4">
                  <div className="flex justify-between gap-3 text-body-sm">
                    <span className="text-on-surface-variant">Tiền hàng</span>
                    <span className="font-semibold text-on-surface">{formatCurrency(itemsTotal)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-body-sm">
                    <span className="text-on-surface-variant">Vận chuyển</span>
                    <span className="font-semibold text-on-surface">
                      {shippingLoading ? 'Đang tính...' : formatCurrency(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-body-sm">
                    <span className="text-on-surface-variant">Giảm giá</span>
                    <span className="font-semibold text-on-surface">-{formatCurrency(discountTotal)}</span>
                  </div>
                </div>

                <label className="mt-4 grid gap-2">
                  <span className="text-body-sm text-on-surface-variant">Ghi chú cho người bán</span>
                  <textarea
                    className="min-h-24 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </label>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-title-sm font-title-sm text-on-surface">Tổng thanh toán</span>
                  <span className="text-title-md font-title-md text-primary">{formatCurrency(grandTotal)}</span>
                </div>

                <button
                  className="mt-5 h-12 w-full rounded-lg bg-primary text-label-lg font-label-lg text-on-primary hover:bg-primary/90 disabled:opacity-60"
                  type="button"
                  disabled={placingOrder || shippingLoading || Boolean(shippingError) || !shippingQuote || !addresses.length}
                  onClick={handlePlaceOrder}
                >
                  {placingOrder ? 'Đang đặt hàng...' : 'Đặt hàng'}
                </button>
              </section>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}



