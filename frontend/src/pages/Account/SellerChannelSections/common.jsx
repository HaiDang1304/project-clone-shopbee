import { applicationStatuses } from '../sellerChannel.constants'
import { formatCurrency } from '../sellerChannel.utils'
import RevenueRangeControls from '../../../components/Charts/RevenueRangeControls'
import RevenueTrendChart from '../../../components/Charts/RevenueTrendChart'

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

export function RevenueChart({ trend, revenueRange, revenueFilter, onRevenueFilterChange }) {
  const points = trend?.length ? trend : []
  const totalRevenue = points.reduce((sum, point) => sum + Number(point.value || 0), 0)
  const hasRevenue = totalRevenue > 0
  const averageRevenue = points.length ? totalRevenue / points.length : 0

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-title-sm font-title-sm text-on-surface">Doanh thu theo khoang thoi gian</h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">Theo đơn không hủy</p>
        </div>
        <div className="rounded-lg bg-gray-200 px-3 py-2 text-right text-on-primary-container">
          <p className="text-[11px] font-semibold">Tong doanh thu</p>
          <p className="mt-0.5 text-title-sm font-title-sm">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <RevenueRangeControls
        className="mt-4"
        value={revenueFilter}
        revenueRange={revenueRange}
        onChange={onRevenueFilterChange}
      />

      <div className="mt-4 h-[192px] rounded-lg bg-surface-container px-2 pb-2 pt-4">
        <RevenueTrendChart
          trend={points}
          lineColor="#ff5722"
          fillStart="rgba(255, 87, 34, 0.28)"
          fillEnd="rgba(255, 87, 34, 0.03)"
          gridColor="rgba(120, 113, 108, 0.16)"
          tickColor="#6b625c"
        />
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

export function LocationSelectFields({ locations = [], form, disabled, onChange, provinceLabel = 'Tỉnh/Thành phố' }) {
  const provinceId = String(form.provinceId || '')
  const province = locations.find((item) => String(item.id) === provinceId)
  const wards = province?.wards || []

  function updateProvince(value) {
    const nextProvince = locations.find((item) => String(item.id) === String(value))
    onChange('provinceId', value)
    onChange('wardId', '')
    onChange('province', nextProvince?.name || '')
    onChange('ward', '')
  }

  function updateWard(value) {
    const nextWard = wards.find((item) => String(item.id) === String(value))
    onChange('wardId', value)
    onChange('ward', nextWard?.name || '')
  }

  return (
    <>
      <label className="grid gap-2">
        <span className="text-body-sm text-on-surface-variant">{provinceLabel}</span>
        <select
          className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
          value={provinceId}
          onChange={(event) => updateProvince(event.target.value)}
          disabled={disabled}
          required
        >
          <option value="">Chọn tỉnh/thành phố</option>
          {locations.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-body-sm text-on-surface-variant">Phường/Xã</span>
        <select
          className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
          value={String(form.wardId || '')}
          onChange={(event) => updateWard(event.target.value)}
          disabled={disabled || !provinceId}
          required
        >
          <option value="">Chọn phường/xã</option>
          {wards.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
    </>
  )
}
