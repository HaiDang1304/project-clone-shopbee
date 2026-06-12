import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import Footer from '../../components/Footer/Footer'
import Header from '../../components/Header/Header'
import { getAuthUser } from '../../lib/auth'
import { formatCurrency } from '../../lib/format'
import { claimVoucher, getAvailableVouchers } from '../../lib/vouchers'

function voucherDiscountText(voucher) {
  if (voucher.discountType === 'free_shipping') {
    return voucher.maxDiscountAmount ? `Miễn phí vận chuyển tối đa ${formatCurrency(voucher.maxDiscountAmount)}` : 'Miễn phí vận chuyển'
  }
  if (voucher.discountType === 'percent') {
    return `Giảm ${Number(voucher.discountValue || 0)}%${voucher.maxDiscountAmount ? ` tối đa ${formatCurrency(voucher.maxDiscountAmount)}` : ''}`
  }
  return `Giảm ${formatCurrency(voucher.discountValue)}`
}

function voucherConditionText(voucher) {
  return Number(voucher.minOrderAmount || 0) > 0
    ? `Đơn tối thiểu ${formatCurrency(voucher.minOrderAmount)}`
    : 'Không yêu cầu giá trị tối thiểu'
}

function formatDate(value) {
  if (!value) return 'Không giới hạn'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

function VoucherCard({ voucher, onClaim, claiming }) {
  return (
    <article className="grid overflow-hidden rounded-xl border border-[#eaded2] bg-white shadow-[0_8px_22px_rgba(60,42,22,0.05)] sm:grid-cols-[132px_minmax(0,1fr)]">
      <div className={`flex min-h-[132px] flex-col items-center justify-center px-4 py-5 text-center text-white ${voucher.scope === 'platform' ? 'bg-gradient-to-br from-[#c21d0b] to-[#ff8a00]' : 'bg-gradient-to-br from-[#995900] to-[#c98225]'}`}>
        <span className="material-symbols-outlined text-[30px]">{voucher.scope === 'platform' ? 'store' : 'storefront'}</span>
        <span className="mt-2 text-[12px] font-black uppercase">{voucher.scope === 'platform' ? 'ShopBee' : 'Cửa hàng'}</span>
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-4 p-4">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[16px] font-bold text-[#15110d]">{voucher.title}</h3>
              <p className="mt-1 text-[13px] font-bold text-[#c21d0b]">{voucherDiscountText(voucher)}</p>
            </div>
            <span className="rounded-md bg-[#fff2df] px-2 py-1 text-[11px] font-bold text-[#9a5700]">{voucher.code}</span>
          </div>
          <p className="mt-2 text-[12px] text-[#7b6556]">{voucherConditionText(voucher)}</p>
          {voucher.shopName ? <p className="mt-1 text-[12px] text-[#7b6556]">Áp dụng tại: {voucher.shopName}</p> : null}
          <p className="mt-1 text-[12px] text-[#7b6556]">Hạn dùng: {formatDate(voucher.endsAt)}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] font-medium text-[#8a7567]">
            Đã dùng {voucher.usedCount || 0}{voucher.usageLimit ? `/${voucher.usageLimit}` : ''}
          </span>
          <button
            className={`h-9 rounded-lg px-4 text-[12px] font-bold ${voucher.claimed ? 'border border-[#dfc8b5] bg-white text-[#7b6556]' : 'bg-[#995900] text-white hover:bg-[#7b4600]'} disabled:opacity-60`}
            type="button"
            disabled={voucher.claimed || claiming}
            onClick={() => onClaim(voucher)}
          >
            {voucher.claimed ? 'Đã lưu' : claiming ? 'Đang lưu...' : 'Lưu voucher'}
          </button>
        </div>
      </div>
    </article>
  )
}

function VoucherGroup({ title, description, vouchers, onClaim, claimingId }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[22px] font-bold text-[#15110d]">{title}</h2>
        <p className="mt-1 text-[13px] text-[#7b6556]">{description}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {vouchers.map((voucher) => (
          <VoucherCard key={voucher.id} voucher={voucher} claiming={claimingId === voucher.id} onClaim={onClaim} />
        ))}
      </div>
      {!vouchers.length ? (
        <div className="rounded-xl border border-dashed border-[#eaded2] bg-white px-4 py-8 text-center text-[13px] text-[#7b6556]">
          Chưa có voucher phù hợp.
        </div>
      ) : null}
    </section>
  )
}

export default function VoucherCenterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [voucherData, setVoucherData] = useState({ platform: [], shop: [], items: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [claimingId, setClaimingId] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadVouchers() {
      setLoading(true)
      try {
        const data = await getAvailableVouchers()
        if (!ignore) setVoucherData(data)
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được voucher')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadVouchers()

    return () => {
      ignore = true
    }
  }, [])

  async function handleClaim(voucher) {
    if (!getAuthUser()) {
      const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
      navigate(`/login?redirect=${redirect}`)
      return
    }

    setClaimingId(voucher.id)
    try {
      const nextData = await claimVoucher(voucher.id)
      setVoucherData(nextData)
      toast.success('Đã lưu voucher vào ví của bạn')
    } catch (err) {
      toast.error(err.message || 'Không lưu được voucher')
    } finally {
      setClaimingId(null)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-[640px] bg-[#f7f4f1] pb-14 pt-20">
        <section className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="overflow-hidden rounded-xl bg-[#21150f] text-white shadow-[0_14px_40px_rgba(23,18,14,0.16)]">
            <div className="grid gap-4 px-5 py-8 md:grid-cols-[minmax(0,1fr)_300px] md:px-8">
              <div>
                <p className="text-[12px] font-bold uppercase text-[#ffcf9a]">Kho voucher</p>
                <h1 className="mt-2 text-[34px] font-bold leading-[1.1]">Lưu voucher trước, chọn nhanh khi thanh toán</h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-6 text-white/82">
                  Voucher ShopBee áp dụng toàn sàn, voucher cửa hàng áp dụng cho sản phẩm của từng shop. Sau khi lưu, bạn có thể chọn trực tiếp ở trang thanh toán.
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                <p className="text-[13px] font-bold">Mẹo dùng voucher</p>
                <p className="mt-2 text-[13px] leading-5 text-white/80">Có thể kết hợp voucher ShopBee và voucher cửa hàng nếu đơn hàng đủ điều kiện.</p>
                <Link className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#ff5722] px-4 text-[12px] font-bold text-white" to="/checkout">
                  Đi tới thanh toán
                </Link>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-body-sm text-on-error-container">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-[164px] animate-pulse rounded-xl border border-[#eaded2] bg-white" />
              ))}
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              <VoucherGroup
                title="Voucher ShopBee"
                description="Ưu đãi toàn sàn do admin phát hành."
                vouchers={voucherData.platform || []}
                claimingId={claimingId}
                onClaim={handleClaim}
              />
              <VoucherGroup
                title="Voucher cửa hàng"
                description="Ưu đãi áp dụng cho sản phẩm của từng shop."
                vouchers={voucherData.shop || []}
                claimingId={claimingId}
                onClaim={handleClaim}
              />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
