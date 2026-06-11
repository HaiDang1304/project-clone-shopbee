import { defaultRevenueFilter, revenueRangeLabel } from '../../lib/revenueFilters'

const rangeOptions = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '1 tháng' },
  { value: '1y', label: '1 năm' },
  { value: 'custom', label: 'Tùy chọn' },
]

export default function RevenueRangeControls({
  value = defaultRevenueFilter,
  revenueRange,
  disabled = false,
  className = '',
  onChange,
}) {
  const customReady = value.range === 'custom' && value.startDate && value.endDate && value.startDate <= value.endDate

  function updatePreset(range) {
    const nextValue = { ...value, range }
    if (range !== 'custom') onChange(nextValue)
    else onChange(nextValue, { deferLoad: true })
  }

  function updateCustomField(field, fieldValue) {
    onChange({ ...value, range: 'custom', [field]: fieldValue }, { deferLoad: true })
  }

  function applyCustomRange() {
    if (!customReady) return
    onChange(value)
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        {rangeOptions.map((option) => {
          const active = value.range === option.value

          return (
            <button
              key={option.value}
              className={`h-9 rounded-lg border px-3 text-[12px] font-semibold transition-colors ${
                active
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
              type="button"
              disabled={disabled}
              onClick={() => updatePreset(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {value.range === 'custom' ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="h-9 rounded-lg border-outline-variant bg-surface-container-lowest px-3 text-[12px] text-on-surface focus:border-primary focus:ring-primary"
            type="date"
            value={value.startDate}
            max={value.endDate || undefined}
            disabled={disabled}
            onChange={(event) => updateCustomField('startDate', event.target.value)}
          />
          <span className="text-[12px] font-semibold text-on-surface-variant">đến</span>
          <input
            className="h-9 rounded-lg border-outline-variant bg-surface-container-lowest px-3 text-[12px] text-on-surface focus:border-primary focus:ring-primary"
            type="date"
            value={value.endDate}
            min={value.startDate || undefined}
            disabled={disabled}
            onChange={(event) => updateCustomField('endDate', event.target.value)}
          />
          <button
            className="h-9 rounded-lg bg-primary px-3 text-[12px] font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={disabled || !customReady}
            onClick={applyCustomRange}
          >
            Áp dụng
          </button>
        </div>
      ) : null}

      {revenueRange ? (
        <span className="text-[12px] font-medium text-on-surface-variant">
          {revenueRangeLabel(revenueRange)}
        </span>
      ) : null}
    </div>
  )
}
