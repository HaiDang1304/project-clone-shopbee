import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import { getOrderById } from '../../lib/orders'
import { formatCurrency } from '../../lib/format'

const LAST_ORDER_STORAGE_KEY = 'shopbee_last_order'
const paymentMethodLabels = {
  cod: 'Thanh toán khi nhận hàng',
  bank: 'Chuyển khoản ngân hàng',
}

function readLastOrder() {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_ORDER_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

function payosQrImageUrl(qrCode) {
  if (!qrCode) return ''
  return `https://quickchart.io/qr?size=260&margin=2&text=${encodeURIComponent(qrCode)}`
}

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(() => readLastOrder())
  const [now, setNow] = useState(() => Date.now())
  const orderId = searchParams.get('orderId')
  const paymentExpiresAt = order?.payment?.expiresAt ? new Date(order.payment.expiresAt).getTime() : 0
  const remainingSeconds = paymentExpiresAt ? Math.max(0, Math.ceil((paymentExpiresAt - now) / 1000)) : 0
  const paymentExpired = order?.status === 'payment_expired' || (order?.status === 'payment_pending' && paymentExpiresAt && remainingSeconds <= 0)
  const waitingForBankPayment = order?.status === 'payment_pending' && order?.payment?.provider === 'payos' && !paymentExpired
  const successTitle =
    order?.status === 'paid'
      ? 'Thanh toán thành công'
      : waitingForBankPayment
        ? 'Chờ thanh toán'
        : paymentExpired
          ? 'Mã thanh toán đã hết hạn'
          : 'Đặt hàng thành công'
  const successMessage =
    order?.status === 'paid'
      ? 'Đơn hàng của bạn đã thanh toán thành công và đang chờ người bán xác nhận.'
      : waitingForBankPayment
        ? 'Vui lòng quét mã QR PayOS để hoàn tất thanh toán. Đơn hàng chỉ được ghi nhận sau khi thanh toán thành công.'
        : paymentExpired
          ? 'Mã QR thanh toán đã hết hạn. Đơn hàng chưa được ghi nhận để người bán xử lý.'
          : 'Đơn hàng của bạn đã được ghi nhận và đang chờ xác nhận.'

  useEffect(() => {
    if (!orderId) return undefined

    let active = true
    function loadOrder() {
      return getOrderById(orderId)
      .then((nextOrder) => {
        if (active) {
          setOrder((current) => {
            const mergedOrder = {
              ...nextOrder,
              payment: current?.payment,
            }
            sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(mergedOrder))
            return mergedOrder
          })
        }
      })
      .catch(() => {})
    }

    loadOrder()
    const intervalId = window.setInterval(() => {
      loadOrder()
    }, 5000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [orderId])

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <>
      <Header />
      <main className="min-h-[640px] bg-surface-container-low pt-24 pb-20">
        <section className="mx-auto max-w-2xl rounded-lg bg-surface-container-lowest px-6 py-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-[56px] text-primary">
            {paymentExpired ? 'timer_off' : waitingForBankPayment ? 'qr_code_2' : 'check_circle'}
          </span>
          <h1 className="mt-4 text-headline-sm font-headline-sm text-on-surface">{successTitle}</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">{successMessage}</p>

          {order ? (
            <div className="mx-auto mt-6 max-w-md rounded-lg bg-surface-container-low px-4 py-4 text-left">
              <div className="flex justify-between gap-3 text-body-sm">
                <span className="text-on-surface-variant">Mã đơn</span>
                <span className="font-semibold text-on-surface">#{order.id}</span>
              </div>
              <div className="mt-2 flex justify-between gap-3 text-body-sm">
                <span className="text-on-surface-variant">Tổng thanh toán</span>
                <span className="font-semibold text-primary">{formatCurrency(order.grandTotal)}</span>
              </div>
              <div className="mt-2 flex justify-between gap-3 text-body-sm">
                <span className="text-on-surface-variant">Phương thức</span>
                <span className="font-semibold text-on-surface">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
              </div>
            </div>
          ) : null}

          {order?.payment?.provider === 'payos' ? (
            <div className="mx-auto mt-5 max-w-md rounded-lg border border-primary/30 bg-primary-fixed px-4 py-4 text-center">
              <h2 className="text-title-sm font-title-sm text-on-surface">
                {paymentExpired ? 'Thanh toán đã hết hạn' : 'Quét mã QR để thanh toán'}
              </h2>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Số tiền: <span className="font-semibold text-primary">{formatCurrency(order.payment.amount || order.grandTotal)}</span>
              </p>
              {waitingForBankPayment ? (
                <p className="mt-1 text-body-sm font-semibold text-error">
                  Còn {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')} để thanh toán
                </p>
              ) : null}
              {order.payment.qrCode && !paymentExpired ? (
                <img
                  className="mx-auto mt-4 h-[260px] w-[260px] rounded-lg border border-outline-variant bg-white p-2"
                  src={payosQrImageUrl(order.payment.qrCode)}
                  alt={`QR thanh toán đơn hàng ${order.id}`}
                />
              ) : null}
              {paymentExpired ? (
                <p className="mt-4 rounded-lg bg-error-container px-3 py-3 text-body-sm text-on-error-container">
                  Vui lòng đặt lại đơn hàng nếu bạn vẫn muốn mua các sản phẩm này.
                </p>
              ) : null}
              {order.payment.checkoutUrl && !paymentExpired ? (
                <a
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-label-md font-label-md text-on-primary hover:bg-primary/90"
                  href={order.payment.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở trang thanh toán PayOS
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-label-md font-label-md text-on-primary hover:bg-primary/90"
              to="/orders"
            >
              Xem đơn mua
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-lg border border-outline-variant px-5 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary"
              to="/"
            >
              Về trang chủ
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
