import { useMemo, useState } from 'react'

import { EmptySellerNotice, MetricCard, RevenueChart } from './common'
import { apiAssetUrl } from '../../../lib/api'
import { orderStatusLabels, orderStatusOptions } from '../sellerChannel.constants'
import { formatCount, formatCurrency, formatDateTime } from '../sellerChannel.utils'

const orderStatusClassNames = {
  pending: 'bg-tertiary/10 text-tertiary',
  paid: 'bg-secondary-container text-on-secondary-container',
  processing: 'bg-primary-container text-primary',
  shipping: 'bg-surface-container-high text-on-surface',
  delivered: 'bg-primary/10 text-primary',
  cancelled: 'bg-error-container text-on-error-container',
  refunded: 'bg-surface-container text-on-surface-variant',
}

const allOrderTabs = [
  { value: 'all', label: 'Tất cả' },
  ...orderStatusOptions,
  { value: 'paid', label: orderStatusLabels.paid },
  { value: 'refunded', label: orderStatusLabels.refunded },
]

function IconButton({ icon, label, onClick }) {
  return (
    <button
      className="flex h-9 w-9 items-center justify-center rounded-md border border-outline-variant text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  )
}

function formatAddress(shipping) {
  return [shipping?.line1, shipping?.ward, shipping?.province, shipping?.country].filter(Boolean).join(', ')
}

function formatSelectedOptions(options) {
  const entries = Object.entries(options || {})
  if (!entries.length) return ''
  return entries.map(([name, value]) => `${name}: ${value}`).join(', ')
}

function getOrderItems(order) {
  if (Array.isArray(order?.items) && order.items.length) return order.items

  const names = String(order?.productNames || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  if (!names.length) return []

  const itemCount = Math.max(1, Number(order?.itemCount || names.length || 1))
  const estimatedLineTotal = Number(order?.shopSubtotal || order?.shopTotal || 0)
  const estimatedUnitPrice = estimatedLineTotal && itemCount ? estimatedLineTotal / itemCount : 0

  return names.map((name, index) => ({
    id: `fallback-${order.id || order.code}-${index}`,
    name,
    imageUrl: '',
    selectedOptions: {},
    unitPrice: estimatedUnitPrice,
    quantity: names.length === 1 ? itemCount : 1,
    lineTotal: names.length === 1 ? estimatedLineTotal : estimatedUnitPrice,
  }))
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildOrderPrintHtml(order) {
  const items = getOrderItems(order)
  const itemRows = items
    .map((item, index) => {
      const selectedOptions = formatSelectedOptions(item.selectedOptions)

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            ${selectedOptions ? `<div class="muted">${escapeHtml(selectedOptions)}</div>` : ''}
          </td>
          <td class="right">${escapeHtml(formatCurrency(item.unitPrice))}</td>
          <td class="right">${escapeHtml(formatCount(item.quantity))}</td>
          <td class="right">${escapeHtml(formatCurrency(item.lineTotal))}</td>
        </tr>
      `
    })
    .join('')
  const emptyItemRows = `
    <tr>
      <td colspan="5" class="muted">Chưa có dữ liệu sản phẩm cho đơn hàng này.</td>
    </tr>
  `

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Đơn hàng ${escapeHtml(order.code)}</title>
        <style>
          body { color: #1f2933; font-family: Arial, sans-serif; margin: 32px; }
          h1 { font-size: 22px; margin: 0 0 6px; }
          h2 { border-bottom: 1px solid #d8dee4; font-size: 15px; margin: 24px 0 10px; padding-bottom: 6px; }
          p { margin: 4px 0; }
          table { border-collapse: collapse; margin-top: 12px; width: 100%; }
          th, td { border: 1px solid #d8dee4; font-size: 12px; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; text-transform: uppercase; }
          .muted { color: #667085; font-size: 11px; margin-top: 3px; }
          .label { display: inline-block; font-weight: 700; min-width: 150px; }
          .right { text-align: right; }
          .summary { margin-left: auto; margin-top: 16px; width: 280px; }
          .summary div { display: flex; justify-content: space-between; padding: 5px 0; }
          .total { border-top: 1px solid #d8dee4; font-weight: 700; }
          @media print { body { margin: 18mm; } }
        </style>
      </head>
      <body>
        <h1>ShopBee - Phiếu đơn hàng</h1>
        <p>Mã đơn: <strong>#${escapeHtml(order.code)}</strong></p>
        <p>Ngày đặt: ${escapeHtml(formatDateTime(order.createdAt))}</p>
        <p>Trạng thái: ${escapeHtml(orderStatusLabels[order.status] || order.status)}</p>

        <h2>Khách hàng</h2>
        <p><span class="label">Tên khách hàng:</span> <strong>${escapeHtml(order.customer?.name || order.shipping?.fullName || '')}</strong></p>
        <p><span class="label">Số điện thoại:</span> ${escapeHtml(order.customer?.phone || order.shipping?.phone || '')}</p>
        <p><span class="label">Email:</span> ${escapeHtml(order.customer?.email || '')}</p>
        <p><span class="label">Địa chỉ:</span> ${escapeHtml(formatAddress(order.shipping))}</p>

        <h2>Sản phẩm của shop</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Sản phẩm</th>
              <th class="right">Đơn giá</th>
              <th class="right">SL</th>
              <th class="right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>${itemRows || emptyItemRows}</tbody>
        </table>

        <div class="summary">
          <div><span>Tạm tính</span><strong>${escapeHtml(formatCurrency(order.shopSubtotal))}</strong></div>
          <div><span>Phí vận chuyển</span><strong>${escapeHtml(formatCurrency(order.shopShippingFee))}</strong></div>
          <div class="total"><span>Tổng shop</span><strong>${escapeHtml(formatCurrency(order.shopTotal))}</strong></div>
        </div>
        ${order.note ? `<h2>Ghi chú</h2><p>${escapeHtml(order.note)}</p>` : ''}
      </body>
    </html>
  `
}

function printOrder(order) {
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return

  printWindow.document.write(buildOrderPrintHtml(order))
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

function SellerOrderDetailsModal({ order, onClose, onPrint }) {
  if (!order) return null
  const items = getOrderItems(order)

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-surface-container-lowest shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant px-5 py-4">
          <div>
            <h2 className="text-title-sm font-title-sm text-on-surface">Chi tiết đơn hàng #{order.code}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {formatDateTime(order.createdAt)} - {orderStatusLabels[order.status] || order.status}
            </p>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container"
            type="button"
            aria-label="Đóng"
            title="Đóng"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[19px]">close</span>
          </button>
        </div>

        <div className="max-h-[calc(90vh-138px)] overflow-y-auto px-5 py-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3">
              <p className="text-label-sm font-label-sm uppercase text-on-surface-variant">Khách hàng</p>
              <p className="mt-1 font-semibold text-on-surface">{order.customer?.name || order.shipping?.fullName}</p>
              <p className="text-body-sm text-on-surface-variant">{order.customer?.phone || order.shipping?.phone}</p>
              <p className="text-body-sm text-on-surface-variant">{order.customer?.email}</p>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 md:col-span-2">
              <p className="text-label-sm font-label-sm uppercase text-on-surface-variant">Địa chỉ nhận hàng</p>
              <p className="mt-1 text-body-sm text-on-surface">{formatAddress(order.shipping)}</p>
              {order.note ? <p className="mt-2 text-body-sm text-on-surface-variant">Ghi chú: {order.note}</p> : null}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-outline-variant">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="h-10 bg-surface-container-low text-label-sm font-label-sm uppercase text-on-surface-variant">
                  <th className="px-3">Sản phẩm</th>
                  <th className="px-3 text-right">Đơn giá</th>
                  <th className="px-3 text-right">Số lượng</th>
                  <th className="px-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const selectedOptions = formatSelectedOptions(item.selectedOptions)

                  return (
                    <tr key={item.id} className="border-t border-outline-variant text-body-sm">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              className="h-12 w-12 rounded-md border border-outline-variant object-cover"
                              src={apiAssetUrl(item.imageUrl)}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-outline-variant bg-surface-container-low text-on-surface-variant">
                              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-on-surface">{item.name}</p>
                            {selectedOptions ? <p className="mt-1 text-body-sm text-on-surface-variant">{selectedOptions}</p> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-3 text-right">{formatCount(item.quantity)}</td>
                      <td className="px-3 py-3 text-right font-semibold text-primary">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  )
                })}
                {!items.length ? (
                  <tr className="border-t border-outline-variant text-body-sm text-on-surface-variant">
                    <td className="px-3 py-5 text-center" colSpan={4}>
                      Chưa có dữ liệu sản phẩm cho đơn hàng này.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-4 w-full max-w-sm rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
            <div className="flex justify-between py-1 text-body-sm">
              <span>Tạm tính</span>
              <span className="font-semibold">{formatCurrency(order.shopSubtotal)}</span>
            </div>
            <div className="flex justify-between py-1 text-body-sm">
              <span>Phí vận chuyển</span>
              <span className="font-semibold">{formatCurrency(order.shopShippingFee)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-outline-variant pt-2 text-label-lg font-label-lg text-primary">
              <span>Tổng shop</span>
              <span>{formatCurrency(order.shopTotal)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-outline-variant px-5 py-3">
          <button
            className="flex h-10 items-center gap-2 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary"
            type="button"
            onClick={() => onPrint(order)}
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            In đơn hàng
          </button>
          <button
            className="h-10 rounded-lg bg-primary px-4 text-label-md font-label-md text-on-primary hover:bg-primary/90"
            type="button"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export function SellerOrdersPanel({ orders, workingOrderId, handleOrderStatus }) {
  const [activeTab, setActiveTab] = useState('all')
  const [viewingOrder, setViewingOrder] = useState(null)

  const tabs = useMemo(() => {
    const counts = orders.reduce(
      (result, order) => {
        result.all += 1
        result[order.status] = (result[order.status] || 0) + 1
        return result
      },
      { all: 0 },
    )

    return allOrderTabs
      .filter((tab, index, source) => source.findIndex((item) => item.value === tab.value) === index)
      .map((tab) => ({ ...tab, count: counts[tab.value] || 0 }))
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders
    return orders.filter((order) => order.status === activeTab)
  }, [activeTab, orders])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-title-sm font-title-sm text-on-surface">Quản lý đơn hàng</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">Chỉ hiển thị các đơn có sản phẩm thuộc cửa hàng của bạn.</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-3">
            <div className="rounded-md bg-surface-container-low px-3 py-2">
              <p className="text-label-sm font-label-sm text-on-surface-variant">Tổng đơn</p>
              <p className="mt-1 text-title-sm font-title-sm text-primary">{formatCount(orders.length)}</p>
            </div>
            <div className="rounded-md bg-surface-container-low px-3 py-2">
              <p className="text-label-sm font-label-sm text-on-surface-variant">Đang xử lý</p>
              <p className="mt-1 text-title-sm font-title-sm text-primary">
                {formatCount(orders.filter((order) => ['pending', 'paid', 'processing'].includes(order.status)).length)}
              </p>
            </div>
            <div className="rounded-md bg-surface-container-low px-3 py-2">
              <p className="text-label-sm font-label-sm text-on-surface-variant">Đã giao</p>
              <p className="mt-1 text-title-sm font-title-sm text-primary">{formatCount(orders.filter((order) => order.status === 'delivered').length)}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm">
        <div className="flex min-h-12 overflow-x-auto border-b border-outline-variant">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={`relative min-w-max px-4 text-label-md font-label-md transition-colors ${
                activeTab === tab.value ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
              }`}
              type="button"
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label} ({formatCount(tab.count)})
              {activeTab === tab.value ? <span className="absolute inset-x-0 bottom-0 h-px bg-primary" /> : null}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="h-11 bg-surface-container-low text-label-sm font-label-sm uppercase text-on-surface-variant">
                <th className="px-3">Đơn hàng</th>
                <th className="px-3">Khách hàng</th>
                <th className="px-3">Sản phẩm</th>
                <th className="px-3">Giá trị shop</th>
                <th className="px-3">Ngày đặt</th>
                <th className="px-3">Trạng thái</th>
                <th className="px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
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
                    <div className="space-y-2">
                      <span className={`inline-flex rounded-md px-2 py-1 text-label-sm font-label-sm ${orderStatusClassNames[order.status] || orderStatusClassNames.pending}`}>
                        {orderStatusLabels[order.status] || order.status}
                      </span>
                      <select
                        className="block h-10 rounded-md border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary disabled:opacity-60"
                        value={order.status}
                        onChange={(event) => handleOrderStatus(order, event.target.value)}
                        disabled={workingOrderId === order.id || order.status === 'delivered' || order.status === 'refunded'}
                      >
                        {orderStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        {order.status === 'paid' ? <option value="paid">Đã thanh toán</option> : null}
                        {order.status === 'refunded' ? <option value="refunded">Đã hoàn tiền</option> : null}
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <IconButton icon="visibility" label={`Xem đơn ${order.code}`} onClick={() => setViewingOrder(order)} />
                      <IconButton icon="print" label={`In đơn ${order.code}`} onClick={() => printOrder(order)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filteredOrders.length ? (
          <div className="border-t border-outline-variant px-4 py-10 text-center">
            <EmptySellerNotice icon="receipt_long" title="Chưa có đơn hàng" message="Khi khách mua sản phẩm, đơn hàng sẽ xuất hiện tại đây." />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low px-3 py-3 text-body-sm text-on-surface-variant">
          <p>
            Hiển thị {filteredOrders.length ? 1 : 0} - {formatCount(filteredOrders.length)} trên tổng số {formatCount(orders.length)} đơn hàng
          </p>
          <p className="font-semibold">Nguồn dữ liệu: đơn hàng của cửa hàng seller</p>
        </div>
      </section>

      <SellerOrderDetailsModal order={viewingOrder} onClose={() => setViewingOrder(null)} onPrint={printOrder} />
    </div>
  )
}

export function SellerReportsPanel({ stats, orders, revenueTrend, revenueRange, revenueFilter, orderStatusCounts, onRevenueFilterChange }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon="account_balance_wallet" label="Tổng doanh thu" value={formatCurrency(stats.totalRevenue)} note="Tất cả" />
        <MetricCard icon="payments" label="Doanh thu tháng" value={formatCurrency(stats.monthlyRevenue)} note="Tháng này" />
        <MetricCard icon="shopping_bag" label="Tổng đơn" value={formatCount(stats.orderCount)} note={`${formatCount(stats.pendingOrders)} chờ`} />
        <MetricCard icon="inventory" label="Sản phẩm" value={formatCount(stats.productCount)} note={`${formatCount(stats.activeProducts)} đang bán`} />
      </div>

      <RevenueChart
        trend={revenueTrend}
        revenueRange={revenueRange}
        revenueFilter={revenueFilter}
        onRevenueFilterChange={onRevenueFilterChange}
      />

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
