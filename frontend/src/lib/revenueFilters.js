export const defaultRevenueFilter = {
  range: '7d',
  startDate: '',
  endDate: '',
}

export function revenueFilterParams(filter = defaultRevenueFilter) {
  if (filter.range === 'custom') {
    return {
      range: 'custom',
      startDate: filter.startDate,
      endDate: filter.endDate,
    }
  }

  return { range: filter.range || '7d' }
}

export function revenueRangeLabel(range) {
  if (!range?.startDate || !range?.endDate) return '7 ngày gần đây'
  return `${range.startDate} - ${range.endDate}`
}
