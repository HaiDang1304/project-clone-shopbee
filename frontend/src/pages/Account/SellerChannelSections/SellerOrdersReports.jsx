import { EmptySellerNotice, MetricCard, RevenueChart } from './common'
import { orderStatusLabels, orderStatusOptions } from '../sellerChannel.constants'
import { formatCount, formatCurrency, formatDateTime } from '../sellerChannel.utils'

export function SellerOrdersPanel({ orders, workingOrderId, handleOrderStatus }) {
  return (
    <div className="rounded-lg border border-outline-variant px-4 py-4">
      <h2 className="text-title-sm font-title-sm text-on-surface">Quản lý đơn hàng</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="h-11 bg-surface-container-low text-label-sm font-label-sm uppercase text-on-surface-variant">
              <th className="px-3">Đơn hàng</th>
              <th className="px-3">Khách hàng</th>
              <th className="px-3">Sản phẩm</th>
              <th className="px-3">Giá trị shop</th>
              <th className="px-3">Ngày đặt</th>
              <th className="px-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-outline-variant text-body-sm">
                <td className="px-3 py-3 font-semibold text-primary">#{order.code}</td>
                <td className="px-3 py-3">
                  <p className="font-semibold text-on-surface">{order.customer?.name}</p>
                  <p className="text-body-sm text-on-surface-variant">{order.customer?.phone}</p>
                </td>
                <td className="max-w-[260px] px-3 py-3">
                  <p className="line-clamp-2">{order.productNames}</p>
                  <p className="text-body-sm text-on-surface-variant">{formatCount(order.itemCount)} sản phẩm</p>
                </td>
                <td className="px-3 py-3 font-semibold text-primary">{formatCurrency(order.shopTotal)}</td>
                <td className="px-3 py-3">{formatDateTime(order.createdAt)}</td>
                <td className="px-3 py-3">
                  <select
                    className="h-12 rounded-md border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary disabled:opacity-60"
                    value={order.status}
                    onChange={(event) => handleOrderStatus(order, event.target.value)}
                    disabled={workingOrderId === order.id || order.status === 'refunded'}
                  >
                    {orderStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    {order.status === 'refunded' ? <option value="refunded">Đã hoàn tiền</option> : null}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!orders.length ? (
        <div className="mt-4">
          <EmptySellerNotice icon="receipt_long" title="Chưa có đơn hàng" message="Khi khách mua sản phẩm, đơn hàng sẽ xuất hiện tại đây." />
        </div>
      ) : null}
    </div>
  )
}

export function SellerReportsPanel({ stats, orders, revenueTrend, orderStatusCounts }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon="account_balance_wallet" label="Tổng doanh thu" value={formatCurrency(stats.totalRevenue)} note="Tất cả" />
        <MetricCard icon="payments" label="Doanh thu tháng" value={formatCurrency(stats.monthlyRevenue)} note="Tháng này" />
        <MetricCard icon="shopping_bag" label="Tổng đơn" value={formatCount(stats.orderCount)} note={`${formatCount(stats.pendingOrders)} chờ`} />
        <MetricCard icon="inventory" label="Sản phẩm" value={formatCount(stats.productCount)} note={`${formatCount(stats.activeProducts)} đang bán`} />
      </div>

      <RevenueChart trend={revenueTrend} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
          <h3 className="text-title-sm font-title-sm text-on-surface">Trạng thái đơn hàng</h3>
          <div className="mt-3 space-y-2">
            {Object.entries(orderStatusLabels).map(([status, label]) => (
              <div key={status} className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2">
                <span className="text-body-sm text-on-surface">{label}</span>
                <span className="text-label-md font-label-md text-primary">{formatCount(orderStatusCounts[status] || 0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
          <h3 className="text-title-sm font-title-sm text-on-surface">Đơn doanh thu cao</h3>
          <div className="mt-3 space-y-2">
            {[...orders]
              .sort((a, b) => Number(b.shopTotal || 0) - Number(a.shopTotal || 0))
              .slice(0, 5)
              .map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2">
                  <span className="text-body-sm text-on-surface">#{order.code}</span>
                  <span className="text-label-md font-label-md text-primary">{formatCurrency(order.shopTotal)}</span>
                </div>
              ))}
            {!orders.length ? <p className="text-body-sm text-on-surface-variant">Chưa có dữ liệu đơn hàng.</p> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
