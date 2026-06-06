import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import { getOrderById } from '../../lib/orders'
import { formatCurrency } from '../../lib/format'

const LAST_ORDER_STORAGE_KEY = 'shopbee_last_order'

function readLastOrder() {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_ORDER_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(() => readLastOrder())
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    if (!orderId) return undefined

    let active = true
    getOrderById(orderId)
      .then((nextOrder) => {
        if (active) {
          setOrder(nextOrder)
          sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(nextOrder))
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [orderId])

  return (
    <>
      <Header />
      <main className="min-h-[640px] bg-surface-container-low pt-24 pb-20">
        <section className="mx-auto max-w-2xl rounded-lg bg-surface-container-lowest px-6 py-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-[56px] text-primary">check_circle</span>
          <h1 className="mt-4 text-headline-sm font-headline-sm text-on-surface">Đặt hàng thành công</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Đơn hàng của bạn đã được ghi nhận và đang chờ người bán xác nhận.
          </p>

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
                <span className="font-semibold text-on-surface">{order.paymentMethod}</span>
              </div>
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
