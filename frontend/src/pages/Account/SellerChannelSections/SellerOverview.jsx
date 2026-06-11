import { MetricCard, RevenueChart } from './common'
import { orderStatusLabels } from '../sellerChannel.constants'
import { formatCount, formatCurrency, formatDateTime } from '../sellerChannel.utils'

export function SellerOverview({ stats, orders, products, revenueTrend, revenueRange, revenueFilter, onRevenueFilterChange }) {
  const recentOrders = orders.slice(0, 5)
  const attentionProducts = products.filter((product) => Number(product.stock || 0) <= 0 || !product.isActive).slice(0, 5)
  const platformFeePercent = Math.round(Number(stats.platformFeeRate || 0.05) * 100)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon="receipt" label="Phí sàn tháng" value={formatCurrency(stats.monthlyPlatformFee)} note={`${platformFeePercent}% đơn đã giao`} />
        <MetricCard icon="account_balance_wallet" label="Thực lãnh tháng" value={formatCurrency(stats.monthlyPayout)} note="Sau phí sàn" />
        <MetricCard icon="payments" label="Doanh thu tháng" value={formatCurrency(stats.monthlyRevenue)} note="Tháng này" />
        <MetricCard icon="shopping_cart" label="Tổng đơn hàng" value={formatCount(stats.orderCount)} note={`${formatCount(stats.pendingOrders)} chờ xử lý`} />
        <MetricCard icon="inventory_2" label="Sản phẩm đang bán" value={formatCount(stats.activeProducts)} note={`${formatCount(stats.productCount)} tổng`} />
        <MetricCard icon="warning" label="Hết hàng" value={formatCount(stats.outOfStockProducts)} note="Cần xử lý" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <RevenueChart
          trend={revenueTrend}
          revenueRange={revenueRange}
          revenueFilter={revenueFilter}
          onRevenueFilterChange={onRevenueFilterChange}
        />
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
          <h3 className="text-title-sm font-title-sm text-on-surface">Sản phẩm cần chú ý</h3>
          <div className="mt-3 space-y-3">
            {attentionProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-label-md font-label-md text-on-surface">{product.name}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    Kho {formatCount(product.stock)} · {product.isActive ? 'Đang bán' : 'Đã đóng'}
                  </p>
                </div>
                <span className="material-symbols-outlined text-error">priority_high</span>
              </div>
            ))}
            {!attentionProducts.length ? <p className="text-body-sm text-on-surface-variant">Không có sản phẩm cần xử lý.</p> : null}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
        <h3 className="text-title-sm font-title-sm text-on-surface">Đơn hàng gần đây</h3>
        <div className="mt-3 space-y-3">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-3">
              <div>
                <p className="text-label-md font-label-md text-on-surface">#{order.code}</p>
                <p className="text-body-sm text-on-surface-variant">{order.customer?.name} · {formatDateTime(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-label-md font-label-md text-primary">{formatCurrency(order.shopTotal)}</p>
                <p className="text-body-sm text-on-surface-variant">{orderStatusLabels[order.status] || order.status}</p>
              </div>
            </div>
          ))}
          {!recentOrders.length ? <p className="text-body-sm text-on-surface-variant">Chưa có đơn hàng.</p> : null}
        </div>
      </div>
    </div>
  )
}
