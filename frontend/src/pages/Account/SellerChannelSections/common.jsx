import { applicationStatuses } from '../sellerChannel.constants'
import { formatCurrency } from '../sellerChannel.utils'

export function StatusBadge({ status }) {
  const item = applicationStatuses[status] || applicationStatuses.pending

  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-label-md font-label-md ${item.className}`}>
      {item.label}
    </span>
  )
}

export function EmptySellerNotice({ icon, title, message }) {
  return (
    <div className="rounded-lg border border-dashed border-outline-variant px-6 py-8 text-center">
      <span className="material-symbols-outlined text-[36px] text-primary">{icon}</span>
      <p className="mt-3 text-title-sm font-title-sm text-on-surface">{title}</p>
      <p className="mt-1 text-body-sm text-on-surface-variant">{message}</p>
    </div>
  )
}

export function MetricCard({ icon, label, value, note }) {
  return (
    <article className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md  text-primary">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
        <span className="rounded-full bg-surface-container px-2 py-1 text-[11px] font-semibold text-on-surface-variant">
          {note}
        </span>
      </div>
      <p className="mt-4 text-body-sm text-on-surface-variant">{label}</p>
      <p className="mt-1 text-title-md font-title-md text-on-surface">{value}</p>
    </article>
  )
}

export function RevenueChart({ trend }) {
  const points = trend?.length ? trend : []
  const totalRevenue = points.reduce((sum, point) => sum + Number(point.value || 0), 0)
  const maxValue = Math.max(1, ...points.map((point) => Number(point.value || 0)))
  const hasRevenue = totalRevenue > 0
  const averageRevenue = points.length ? totalRevenue / points.length : 0

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-title-sm font-title-sm text-on-surface">Doanh thu 7 ngày</h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">Theo đơn không hủy</p>
        </div>
        <div className="rounded-lg bg-gray-200 px-3 py-2 text-right text-on-primary-container">
          <p className="text-[11px] font-semibold">Tổng 7 ngày</p>
          <p className="mt-0.5 text-title-sm font-title-sm">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="mt-4 flex h-[132px] items-end gap-3 rounded-lg bg-surface-container px-3 pb-3 pt-4">
        {points.map((point) => {
          const value = Number(point.value || 0)
          const barHeight = hasRevenue ? Math.max(8, Math.round((value / maxValue) * 100)) : 4

          return (
            <div key={`${point.date || point.day}-${value}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="flex h-[96px] w-full items-end">
                <div
                  className={`mx-auto w-full max-w-[32px] rounded-t-md transition-all ${
                    value > 0 ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                  style={{ height: `${barHeight}%` }}
                  title={`${point.day}: ${formatCurrency(value)}`}
                />
              </div>
              <span className="h-4 text-[10px] font-semibold text-on-surface-variant">{point.day}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-body-sm text-on-surface-variant">
        <span>Trung bình/ngày: {formatCurrency(averageRevenue)}</span>
        {!hasRevenue ? (
          <span className="inline-flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Chưa có doanh thu trong 7 ngày gần đây
          </span>
        ) : null}
      </div>
    </div>
  )
}
