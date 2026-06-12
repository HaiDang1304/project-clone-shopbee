import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { registerSellerFlashSale } from '../../../lib/account'
import { formatCount, formatCurrency, formatDateTime } from '../sellerChannel.utils'

const registrationStatusMeta = {
  pending: {
    label: 'Chờ duyệt',
    className: 'bg-[#fff1cc] text-[#9a5a00]',
  },
  approved: {
    label: 'Đã duyệt',
    className: 'bg-[#dff8e7] text-[#087c32]',
  },
  rejected: {
    label: 'Từ chối',
    className: 'bg-[#ffe1dc] text-[#b42318]',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-surface-container text-on-surface-variant',
  },
}

function getRegistrationStatusMeta(status) {
  return registrationStatusMeta[status] || {
    label: status || 'Không rõ',
    className: 'bg-surface-container text-on-surface-variant',
  }
}

export function SellerFlashSalesPanel({ events, registrations, products, onRegistered }) {
  const openEvents = events || []
  const sellerProducts = (products || []).filter((product) => product.isActive && Number(product.stock || 0) > 0)
  const [form, setForm] = useState({ eventId: '', productId: '', salePrice: '', registeredStock: '' })
  const [submitting, setSubmitting] = useState(false)
  const selectedProduct = useMemo(
    () => sellerProducts.find((product) => String(product.id) === String(form.productId)),
    [form.productId, sellerProducts],
  )
  const openRegistrationCount = openEvents.filter((eventItem) => eventItem.registrationOpen).length

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await registerSellerFlashSale(form)
      toast.success('Đã gửi đăng ký flash sale.')
      setForm({ eventId: '', productId: '', salePrice: '', registeredStock: '' })
      onRegistered?.()
    } catch (err) {
      toast.error(err.message || 'Không gửi được đăng ký flash sale.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-title-md font-title-md text-on-surface">Flash Sale</h3>
            <p className="mt-1 max-w-2xl text-body-sm text-on-surface-variant">
              Theo dõi khung giờ của sàn và đăng ký sản phẩm đủ tồn kho để chờ admin duyệt.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-surface-container-low px-3 py-2">
              <p className="text-title-sm font-title-sm text-on-surface">{formatCount(openEvents.length)}</p>
              <p className="text-[11px] font-medium text-on-surface-variant">Khung giờ</p>
            </div>
            <div className="rounded-lg bg-[#fff7ea] px-3 py-2">
              <p className="text-title-sm font-title-sm text-[#9a5700]">{formatCount(openRegistrationCount)}</p>
              <p className="text-[11px] font-medium text-[#7b5b27]">Đang mở</p>
            </div>
            <div className="rounded-lg bg-surface-container-low px-3 py-2">
              <p className="text-title-sm font-title-sm text-on-surface">{formatCount(registrations?.length || 0)}</p>
              <p className="text-[11px] font-medium text-on-surface-variant">Đã đăng ký</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <section className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">bolt</span>
            <h3 className="text-title-sm font-title-sm text-on-surface">Đăng ký sản phẩm</h3>
          </div>

          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Khung giờ</span>
              <select className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary" value={form.eventId} onChange={(event) => setForm((current) => ({ ...current, eventId: event.target.value }))} required>
                <option value="">Chọn flash sale</option>
                {openEvents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {formatDateTime(item.startsAt)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Sản phẩm</span>
              <select className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary" value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))} required>
                <option value="">Chọn sản phẩm</option>
                {sellerProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Giá flash sale</span>
              <input className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary" type="number" min="1" value={form.salePrice} onChange={(event) => setForm((current) => ({ ...current, salePrice: event.target.value }))} required />
            </label>
            <label className="grid gap-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Số lượng đăng ký</span>
              <input className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary" type="number" min="1" max={selectedProduct?.stock || undefined} value={form.registeredStock} onChange={(event) => setForm((current) => ({ ...current, registeredStock: event.target.value }))} required />
            </label>

            <div className="sm:col-span-2 rounded-lg bg-surface-container-low px-3 py-3 text-body-sm text-on-surface-variant">
              {selectedProduct
                ? `Giá hiện tại ${formatCurrency(selectedProduct.price)} - tồn kho ${formatCount(selectedProduct.stock)}`
                : 'Sản phẩm được duyệt sẽ tự hiển thị khi tới giờ flash sale.'}
            </div>

            <button className="h-10 rounded-lg bg-primary px-4 text-label-md font-label-md text-on-primary disabled:opacity-60 sm:col-span-2" type="submit" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi đăng ký'}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-title-sm font-title-sm text-on-surface">Khung giờ của sàn</h3>
            <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-semibold text-on-surface-variant">
              {formatCount(openEvents.length)} khung giờ
            </span>
          </div>
          <div className="mt-3 space-y-3">
            {openEvents.map((eventItem) => (
              <article key={eventItem.id} className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-label-md font-label-md text-on-surface">{eventItem.name}</p>
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      {formatDateTime(eventItem.startsAt)} - {formatDateTime(eventItem.endsAt)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${eventItem.registrationOpen ? 'bg-[#dff8e7] text-[#087c32]' : 'bg-surface-container text-on-surface-variant'}`}>
                    {eventItem.registrationOpen ? 'Đang mở' : 'Đã đóng'}
                  </span>
                </div>
                {eventItem.description ? <p className="mt-2 text-body-sm text-on-surface-variant">{eventItem.description}</p> : null}
              </article>
            ))}
            {!openEvents.length ? <p className="rounded-lg border border-dashed border-outline-variant px-3 py-6 text-center text-body-sm text-on-surface-variant">Chưa có khung giờ flash sale.</p> : null}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-title-sm font-title-sm text-on-surface">Sản phẩm đã đăng ký</h3>
          <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-semibold text-on-surface-variant">
            {formatCount(registrations?.length || 0)} sản phẩm
          </span>
        </div>
        <div className="mt-3 space-y-3">
          {(registrations || []).map((item) => {
            const statusMeta = getRegistrationStatusMeta(item.status)

            return (
              <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-label-md font-label-md text-on-surface">{item.productName}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {item.eventName} - {formatCurrency(item.salePrice)} - SL {formatCount(item.registeredStock)}
                  </p>
                  {item.rejectReason ? <p className="text-body-sm text-error">Lý do từ chối: {item.rejectReason}</p> : null}
                </div>
                <span className={`rounded-full px-3 py-1 text-body-sm font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
              </article>
            )
          })}
          {!registrations?.length ? <p className="rounded-lg border border-dashed border-outline-variant px-3 py-6 text-center text-body-sm text-on-surface-variant">Chưa có sản phẩm đăng ký flash sale.</p> : null}
        </div>
      </section>
    </div>
  )
}
