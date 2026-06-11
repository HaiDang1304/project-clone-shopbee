const maxCustomRangeDays = 366

function formatDateKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value || '').slice(0, 10)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function daysBetween(startDate, endDate) {
  const start = new Date(formatDateKey(startDate))
  const end = new Date(formatDateKey(endDate))
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1
}

function parseDateInput(value) {
  const source = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source)) return null

  const date = new Date(`${source}T00:00:00`)
  return Number.isNaN(date.getTime()) || formatDateKey(date) !== source ? null : date
}

function throwRangeError(message) {
  const err = new Error(message)
  err.status = 400
  throw err
}

function normalizeRevenueRange(source = {}) {
  const today = new Date()
  const preset = ['7d', '30d', '1y', 'custom'].includes(source.range) ? source.range : '7d'
  let startDate
  let endDate

  if (preset === 'custom') {
    startDate = parseDateInput(source.startDate)
    endDate = parseDateInput(source.endDate)

    if (!startDate || !endDate) {
      throwRangeError('Khoang ngay doanh thu khong hop le')
    }
    if (startDate > endDate) {
      throwRangeError('Ngay bat dau khong duoc lon hon ngay ket thuc')
    }
  } else {
    endDate = today
    startDate = addDays(today, preset === '1y' ? -364 : preset === '30d' ? -29 : -6)
  }

  const days = daysBetween(startDate, endDate)
  if (days > maxCustomRangeDays) {
    throwRangeError(`Khoang ngay doanh thu toi da ${maxCustomRangeDays} ngay`)
  }

  return {
    range: preset,
    startDate: formatDateKey(startDate),
    endDate: formatDateKey(endDate),
    days,
  }
}

function formatTrendLabel(date, index, totalDays) {
  if (index === totalDays - 1 && formatDateKey(date) === formatDateKey(new Date())) return 'Hom nay'
  if (totalDays <= 31) {
    const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    return labels[date.getDay()]
  }

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function buildDailyRevenueTrend(rows, range) {
  const revenueByDate = new Map(rows.map((row) => [formatDateKey(row.date_key), Number(row.revenue ?? row.total ?? 0)]))
  const startDate = new Date(`${range.startDate}T00:00:00`)

  return Array.from({ length: range.days }, (_, index) => {
    const date = addDays(startDate, index)
    const dateKey = formatDateKey(date)

    return {
      day: formatTrendLabel(date, index, range.days),
      date: dateKey,
      value: revenueByDate.get(dateKey) || 0,
    }
  })
}

module.exports = {
  buildDailyRevenueTrend,
  normalizeRevenueRange,
}
