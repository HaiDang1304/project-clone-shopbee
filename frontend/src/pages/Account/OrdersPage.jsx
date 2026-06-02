import { useEffect, useMemo, useState } from 'react'

import AccountLayout from './AccountLayout'
import { getAccountOrders } from '../../lib/account'
import { formatCurrency } from '../../lib/format'

const orderTabs = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'processing', label: 'Chờ lấy hàng' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
]

const statusLabels = {
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán',
  processing: 'Chờ lấy hàng',
  shipping: 'Đang giao',
  delivered: 'Hoàn thành',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadOrders() {
      try {
        const data = await getAccountOrders()
        if (active) {
          setOrders(data)
          setError('')
        }
      } catch (err) {
        if (active) setError(err.message || 'Không tải được đơn mua')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOrders()

    return () => {
      active = false
    }
  }, [])

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders
    return orders.filter((order) => order.status === activeTab)
  }, [activeTab, orders])

  return (
    <AccountLayout>
      <section className="rounded-lg bg-surface-container-lowest shadow-sm">
        <div className="border-b border-outline-variant px-6 py-5 md:px-8">
          <h1 className="text-title-md font-title-md text-on-surface">Đơn mua</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">Theo dõi trạng thái các đơn hàng của bạn</p>
        </div>

        <div className="custom-scrollbar flex gap-1 overflow-x-auto border-b border-outline-variant px-4 py-2 md:px-6">
          {orderTabs.map((tab) => (
            <button
              key={tab.value}
              className={`h-10 shrink-0 rounded-md px-4 text-label-md font-label-md ${
                activeTab === tab.value ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant hover:bg-surface-container'
              }`}
              type="button"
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="m-6 rounded-lg bg-surface-container px-4 py-4 text-body-sm text-on-surface-variant">
            Đang tải đơn mua...
          </div>
        ) : null}

        {error ? (
          <div className="m-6 rounded-lg bg-error-container px-4 py-4 text-body-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        {!loading && !error && !filteredOrders.length ? (
          <div className="m-6 rounded-lg border border-dashed border-outline-variant px-6 py-10 text-center">
            <span className="material-symbols-outlined text-[36px] text-primary">receipt_long</span>
            <p className="mt-3 text-title-sm font-title-sm text-on-surface">Chưa có đơn mua</p>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Khi có đơn hàng mới, trạng thái đơn sẽ hiển thị tại đây.
            </p>
          </div>
        ) : null}

        <div className="space-y-4 p-4 md:p-6">
          {filteredOrders.map((order) => (
            <article key={order.id} className="rounded-lg border border-outline-variant bg-surface-container-lowest">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-4 py-3">
                <div className="flex items-center gap-2 text-label-md font-label-md text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  Mã đơn: {order.id}
                </div>
                <span className="text-label-md font-label-md text-primary">
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-outline-variant px-4 py-4 last:border-b-0">
                  {item.imageUrl ? (
                    <img className="h-20 w-20 shrink-0 rounded-lg object-cover" src={item.imageUrl} alt={item.name} />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                      <span className="material-symbols-outlined text-[32px]">inventory_2</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-title-sm font-title-sm text-on-surface">{item.name}</p>
                    {item.shopName ? (
                      <p className="mt-1 text-body-sm text-on-surface-variant">{item.shopName}</p>
                    ) : null}
                    {item.variantSku ? (
                      <p className="mt-1 text-body-sm text-on-surface-variant">SKU: {item.variantSku}</p>
                    ) : null}
                    <p className="mt-1 text-body-sm text-on-surface-variant">x{item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-body-sm text-on-surface">{formatCurrency(item.unitPrice)}</p>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-4 py-4">
                <p className="text-body-sm text-on-surface-variant">
                  Phương thức thanh toán: {order.paymentMethod || ''}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-body-sm text-on-surface">
                    Thành tiền: <span className="text-title-md font-title-md text-primary">{formatCurrency(order.grandTotal)}</span>
                  </p>
                  <button className="h-10 rounded-lg bg-primary px-4 text-label-md font-label-md text-on-primary" type="button">
                    Mua lại
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AccountLayout>
  )
}
