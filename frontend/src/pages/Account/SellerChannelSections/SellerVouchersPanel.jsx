import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { createSellerVoucher, deleteSellerVoucher, updateSellerVoucher } from '../../../lib/account'
import { formatCount, formatCurrency, formatDateTime } from '../sellerChannel.utils'

const emptyVoucherForm = {
  code: '',
  title: '',
  discountType: 'fixed',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderAmount: '0',
  usageLimit: '',
  perUserLimit: '1',
  startsAt: '',
  endsAt: '',
  isActive: true,
}

function normalizeVoucherCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 40)
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

function toVoucherForm(voucher) {
  if (!voucher) return emptyVoucherForm

  return {
    code: voucher.code || '',
    title: voucher.title || '',
    discountType: voucher.discountType || 'fixed',
    discountValue: String(voucher.discountValue ?? ''),
    maxDiscountAmount: voucher.maxDiscountAmount === '' ? '' : String(voucher.maxDiscountAmount ?? ''),
    minOrderAmount: String(voucher.minOrderAmount ?? 0),
    usageLimit: voucher.usageLimit === '' ? '' : String(voucher.usageLimit ?? ''),
    perUserLimit: voucher.perUserLimit === '' ? '' : String(voucher.perUserLimit ?? ''),
    startsAt: toDateTimeLocal(voucher.startsAt),
    endsAt: toDateTimeLocal(voucher.endsAt),
    isActive: Boolean(voucher.isActive),
  }
}

function voucherDiscountText(voucher) {
  if (voucher.discountType === 'free_shipping') return 'Miễn phí vận chuyển'
  if (voucher.discountType === 'percent') {
    return `${Number(voucher.discountValue || 0)}%${voucher.maxDiscountAmount ? ` tối đa ${formatCurrency(voucher.maxDiscountAmount)}` : ''}`
  }
  return formatCurrency(voucher.discountValue)
}

function voucherStatusMeta(voucher) {
  const now = Date.now()
  if (!voucher.isActive) return { label: 'Tạm tắt', className: 'bg-[#ffe1dc] text-[#b42318]' }
  if (voucher.startsAt && new Date(voucher.startsAt).getTime() > now) return { label: 'Sắp diễn ra', className: 'bg-[#fff1cc] text-[#9a5a00]' }
  if (voucher.endsAt && new Date(voucher.endsAt).getTime() < now) return { label: 'Hết hạn', className: 'bg-surface-container text-on-surface-variant' }
  if (voucher.usageLimit && Number(voucher.usedCount || 0) >= Number(voucher.usageLimit)) return { label: 'Hết lượt', className: 'bg-surface-container text-on-surface-variant' }
  return { label: 'Đang bật', className: 'bg-[#dff8e7] text-[#087c32]' }
}

export function SellerVouchersPanel({ vouchersData, onVouchersDataChange }) {
  const vouchers = useMemo(() => vouchersData?.items || [], [vouchersData])
  const stats = vouchersData?.stats || {}
  const [form, setForm] = useState(emptyVoucherForm)
  const [editingVoucherId, setEditingVoucherId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [workingVoucherId, setWorkingVoucherId] = useState(null)

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value }
      if (field === 'discountType' && value === 'free_shipping') {
        next.discountValue = '0'
      }
      return next
    })
  }

  function resetForm() {
    setEditingVoucherId(null)
    setForm(emptyVoucherForm)
  }

  function editVoucher(voucher) {
    setEditingVoucherId(voucher.id)
    setForm(toVoucherForm(voucher))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (form.startsAt && form.endsAt && new Date(form.startsAt).getTime() >= new Date(form.endsAt).getTime()) {
      toast.error('Thời gian kết thúc voucher phải lớn hơn thời gian bắt đầu.')
      return
    }
    setSaving(true)

    try {
      const payload = {
        ...form,
        code: normalizeVoucherCode(form.code),
        scope: 'shop',
      }
      const nextData = editingVoucherId
        ? await updateSellerVoucher(editingVoucherId, payload)
        : await createSellerVoucher(payload)
      onVouchersDataChange(nextData)
      resetForm()
      toast.success(editingVoucherId ? 'Đã cập nhật voucher.' : 'Đã tạo voucher cho shop.')
    } catch (err) {
      toast.error(err.message || 'Không lưu được voucher.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleVoucher(voucher) {
    setWorkingVoucherId(voucher.id)

    try {
      const nextData = await updateSellerVoucher(voucher.id, { isActive: !voucher.isActive })
      onVouchersDataChange(nextData)
      toast.success('Đã cập nhật trạng thái voucher.')
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được voucher.')
    } finally {
      setWorkingVoucherId(null)
    }
  }

  async function handleDeleteVoucher(voucher) {
    if (!window.confirm(`Bạn có chắc muốn xóa voucher ${voucher.code}?`)) return
    setWorkingVoucherId(voucher.id)

    try {
      const nextData = await deleteSellerVoucher(voucher.id)
      onVouchersDataChange(nextData)
      if (Number(editingVoucherId) === Number(voucher.id)) resetForm()
      toast.success('Đã xóa voucher.')
    } catch (err) {
      toast.error(err.message || 'Không xóa được voucher.')
    } finally {
      setWorkingVoucherId(null)
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-title-md font-title-md text-on-surface">Voucher của shop</h3>
            <p className="mt-1 max-w-2xl text-body-sm text-on-surface-variant">
              Tạo mã giảm giá riêng cho cửa hàng. Voucher shop chỉ áp dụng cho sản phẩm thuộc shop và phần giảm sẽ trừ vào doanh thu shop.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-surface-container-low px-3 py-2">
              <p className="text-title-sm font-title-sm text-on-surface">{formatCount(stats.total || 0)}</p>
              <p className="text-[11px] font-medium text-on-surface-variant">Tổng mã</p>
            </div>
            <div className="rounded-lg bg-[#e8fff5] px-3 py-2">
              <p className="text-title-sm font-title-sm text-[#087c32]">{formatCount(stats.active || 0)}</p>
              <p className="text-[11px] font-medium text-[#087c32]">Đang bật</p>
            </div>
            <div className="rounded-lg bg-surface-container-low px-3 py-2">
              <p className="text-title-sm font-title-sm text-on-surface">{formatCount(stats.used || 0)}</p>
              <p className="text-[11px] font-medium text-on-surface-variant">Đã dùng</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">local_offer</span>
            <h3 className="text-title-sm font-title-sm text-on-surface">{editingVoucherId ? 'Sửa voucher' : 'Tạo voucher mới'}</h3>
          </div>

          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Mã voucher</span>
              <input className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm uppercase focus:border-primary focus:ring-primary" value={form.code} onChange={(event) => updateField('code', normalizeVoucherCode(event.target.value))} placeholder="SHOP10" required />
            </label>
            <label className="grid gap-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Tên chương trình</span>
              <input className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary" value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Ưu đãi khách quen" required />
            </label>

            <label className="grid gap-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Kiểu giảm</span>
              <select className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary" value={form.discountType} onChange={(event) => updateField('discountType', event.target.value)}>
                <option value="fixed">Giảm tiền</option>
                <option value="percent">Giảm phần trăm</option>
                <option value="free_shipping">Miễn phí vận chuyển</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Giá trị giảm</span>
              <input className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary disabled:opacity-60" type="number" min="0" value={form.discountValue} onChange={(event) => updateField('discountValue', event.target.value)} placeholder={form.discountType === 'percent' ? '10' : '50000'} disabled={form.discountType === 'free_shipping'} required={form.discountType !== 'free_shipping'} />
            </label>

            <label className="grid gap-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Giảm tối đa</span>
              <input className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary" type="number" min="0" value={form.maxDiscountAmount} onChange={(event) => updateField('maxDiscountAmount', event.target.value)} placeholder="Bỏ trống nếu không giới hạn" />
            </label>
            <label className="grid gap-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Đơn tối thiểu</span>
              <input className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary" type="number" min="0" value={form.minOrderAmount} onChange={(event) => updateField('minOrderAmount', event.target.value)} />
            </label>

            <label className="grid gap-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Tổng lượt</span>
              <input className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary" type="number" min="1" value={form.usageLimit} onChange={(event) => updateField('usageLimit', event.target.value)} placeholder="Không giới hạn" />
            </label>
            <label className="grid gap-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Mỗi người</span>
              <input className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary" type="number" min="1" value={form.perUserLimit} onChange={(event) => updateField('perUserLimit', event.target.value)} />
            </label>

            <label className="grid gap-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Bắt đầu</span>
              <input className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary" type="datetime-local" value={form.startsAt} onChange={(event) => updateField('startsAt', event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className="text-body-sm font-medium text-on-surface-variant">Kết thúc</span>
              <input className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary" type="datetime-local" value={form.endsAt} onChange={(event) => updateField('endsAt', event.target.value)} />
            </label>

            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <label className="flex h-10 items-center gap-2 rounded-lg border border-outline-variant px-3 text-body-sm text-on-surface">
                <input className="rounded border-outline-variant text-primary focus:ring-primary" type="checkbox" checked={form.isActive} onChange={(event) => updateField('isActive', event.target.checked)} />
                Bật voucher
              </label>
              <button className="h-10 rounded-lg bg-primary px-4 text-label-md font-label-md text-on-primary disabled:opacity-60" type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : editingVoucherId ? 'Cập nhật' : 'Tạo voucher'}
              </button>
              {editingVoucherId ? (
                <button className="h-10 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary" type="button" onClick={resetForm}>
                  Hủy
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <h3 className="text-title-sm font-title-sm text-on-surface">Danh sách voucher</h3>
            <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-semibold text-on-surface-variant">
              {formatCount(vouchers.length)} mã
            </span>
          </div>

          <div className="divide-y divide-outline-variant">
            {vouchers.map((voucher) => {
              const statusMeta = voucherStatusMeta(voucher)
              const isWorking = workingVoucherId === voucher.id

              return (
                <article key={voucher.id} className="px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-title-sm font-title-sm text-on-surface">{voucher.code}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
                      </div>
                      <p className="mt-1 text-body-sm text-on-surface-variant">{voucher.title}</p>
                    </div>
                    <p className="rounded-lg bg-surface-container-low px-3 py-2 text-label-md font-label-md text-on-surface">
                      {voucherDiscountText(voucher)}
                    </p>
                  </div>

                  <div className="mt-3 grid gap-2 text-body-sm text-on-surface-variant sm:grid-cols-3">
                    <p>Từ {formatCurrency(voucher.minOrderAmount)}</p>
                    <p>Đã dùng {formatCount(voucher.usedCount)} / {voucher.usageLimit ? formatCount(voucher.usageLimit) : '∞'}</p>
                    <p>Mỗi người {voucher.perUserLimit ? formatCount(voucher.perUserLimit) : '∞'} lượt</p>
                    <p>{voucher.startsAt ? formatDateTime(voucher.startsAt) : 'Không giới hạn bắt đầu'}</p>
                    <p>{voucher.endsAt ? `đến ${formatDateTime(voucher.endsAt)}` : 'Không giới hạn kết thúc'}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="h-9 rounded-lg border border-outline-variant px-3 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary disabled:opacity-60" type="button" disabled={isWorking} onClick={() => editVoucher(voucher)}>
                      Sửa
                    </button>
                    <button className="h-9 rounded-lg border border-outline-variant px-3 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary disabled:opacity-60" type="button" disabled={isWorking} onClick={() => handleToggleVoucher(voucher)}>
                      {voucher.isActive ? 'Tắt' : 'Bật'}
                    </button>
                    <button className="h-9 rounded-lg border border-error/30 px-3 text-label-md font-label-md text-error hover:bg-error-container disabled:opacity-60" type="button" disabled={isWorking} onClick={() => handleDeleteVoucher(voucher)}>
                      Xóa
                    </button>
                  </div>
                </article>
              )
            })}

            {!vouchers.length ? (
              <div className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
                Shop chưa tạo voucher nào.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
