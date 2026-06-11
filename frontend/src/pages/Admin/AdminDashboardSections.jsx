import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import RevenueRangeControls from '../../components/Charts/RevenueRangeControls'
import RevenueTrendChart from '../../components/Charts/RevenueTrendChart'
import {
  createAdminCategory,
  deleteAdminCategory,
  deleteAdminComment,
  deleteAdminUser,
  reviewSellerApplication,
  updateAdminCategory,
  updateAdminComment,
  updateAdminUser,
} from '../../lib/account'
import { apiAssetUrl } from '../../lib/api'
import {
  adminNavItems,
  moduleCopy,
  statusClassNames,
  userRoleClassNames,
  userRoleLabels,
} from './adminDashboard.constants'
import {
  buildOrderTabs,
  buildOrders,
  buildOverviewStats,
  buildPendingShops,
  buildShopStats,
  buildUserStats,
  formatCount,
  formatCurrency,
  formatDateTime,
  formatShopAddress,
  getInitial,
} from './adminDashboard.utils'

export function AdminAvatar({ profile }) {
  if (profile?.avatarUrl) {
    return (
      <img
        className="h-8 w-8 rounded-full border border-[#d9b99f] object-cover"
        src={apiAssetUrl(profile.avatarUrl)}
        alt={profile.name}
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d9b99f] bg-[#fff4e8] text-[12px] font-bold text-[#9a5700]">
      {getInitial(profile?.name, profile?.email)}
    </span>
  )
}

export function SidebarItem({ item, active, onClick }) {
  return (
    <button
      className={`flex h-8 w-full items-center gap-2 rounded-md px-3 text-left text-[11px] font-semibold transition-colors ${
        active
          ? 'bg-[#ff9800] text-[#2b1a02] shadow-[0_6px_14px_rgba(255,152,0,0.22)]'
          : 'text-[#5b4c41] hover:bg-[#fff5e8] hover:text-[#9a5700]'
      }`}
      type="button"
      onClick={onClick}
    >
      <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
      <span className="truncate">{item.label}</span>
    </button>
  )
}

function IconButton({ icon, label, className = '', disabled = false, onClick }) {
  return (
    <button
      className={`flex h-7 w-7 items-center justify-center rounded-md text-[#4e3d31] transition-colors hover:bg-[#f2e7db] hover:text-[#9a5700] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-[#4e3d31] ${className}`}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="material-symbols-outlined text-[17px]">{icon}</span>
    </button>
  )
}

function OverviewMetricCard({ stat }) {
  return (
    <article className="rounded-lg border border-[#eaded2] bg-white p-4 shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${stat.iconClass}`}>
          <span className="material-symbols-outlined text-[19px]">{stat.icon}</span>
        </span>
        <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-bold text-[#16a34a]">
          {stat.change}
        </span>
      </div>
      <p className="mt-4 text-[11px] font-medium text-[#7c6657]">{stat.label}</p>
      <p className="mt-1 text-[20px] font-bold leading-6 text-[#100d0a]">{stat.value}</p>
    </article>
  )
}

function RevenueTrendCard({ trend, revenueRange, revenueFilter, onRevenueFilterChange }) {
  const points = trend?.length ? trend : []
  const totalRevenue = points.reduce((sum, point) => sum + Number(point.value || 0), 0)
  const hasRevenue = totalRevenue > 0
  const peakPoint =
    points.reduce((best, point) => (Number(point.value || 0) > Number(best.value || 0) ? point : best), points[0] || {
      day: '-',
      value: 0,
    })

  return (
    <section className="rounded-lg border border-[#eaded2] bg-white p-4 shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#15110d]">Doanh thu theo khoang thoi gian</h2>
          <p className="mt-1 text-[11px] text-[#7c6657]">
            {hasRevenue
              ? `Cao nhất ${peakPoint.day}: ${formatCurrency(peakPoint.value)}`
              : 'Chưa có doanh thu phát sinh trong khoảng thời gian này.'}
          </p>
        </div>
        <div className="rounded-lg bg-[#fff7ea] px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase text-[#9a5700]">Tong doanh thu</p>
          <p className="mt-0.5 text-[18px] font-bold leading-6 text-[#2b1a02]">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <RevenueRangeControls
        className="mt-4"
        value={revenueFilter}
        revenueRange={revenueRange}
        onChange={onRevenueFilterChange}
      />

      <div className="mt-5 h-[220px] rounded-lg bg-[#fbfaf9] px-3 pb-3 pt-4">
        <RevenueTrendChart
          trend={points}
          lineColor="#c57900"
          fillStart="rgba(197, 121, 0, 0.28)"
          fillEnd="rgba(197, 121, 0, 0.03)"
          gridColor="rgba(124, 102, 87, 0.16)"
          tickColor="#6f5b4d"
        />
      </div>

      {!hasRevenue ? (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed border-[#eaded2] bg-[#fffaf4] px-3 py-2 text-[11px] text-[#7c6657]">
          <span className="material-symbols-outlined text-[16px] text-[#c57900]">info</span>
          Doanh thu sẽ tự cập nhật khi có đơn hàng được ghi nhận thành công.
        </div>
      ) : null}
    </section>
  )
}

function PlatformFeeShopsTable({ shops }) {
  const visibleShops = shops || []

  return (
    <section className="overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#15110d]">Doanh thu theo khoang thoi gian</h2>
          <p className="mt-0.5 text-[11px] text-[#7c6657]">Phí sàn cố định 5% trên đơn đã giao trong tháng.</p>
        </div>
        <span className="rounded-full bg-[#e8fff5] px-3 py-1 text-[10px] font-bold text-[#047857]">
          {formatCount(visibleShops.length)} cửa hàng
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="h-10 bg-[#f4f3f2] text-[10px] font-bold uppercase text-[#4b3527]">
              <th className="px-4">Cửa hàng</th>
              <th className="px-4">Chủ sở hữu</th>
              <th className="px-4">Đơn đã giao</th>
              <th className="px-4">Doanh thu đã giao</th>
              <th className="px-4">Phí sàn</th>
              <th className="px-4">Seller thực lãnh</th>
            </tr>
          </thead>
          <tbody>
            {visibleShops.map((shop) => (
              <tr key={shop.id} className="border-t border-[#f0e7df] text-[12px] text-[#17120e]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {shop.avatarUrl ? (
                      <img
                        className="h-8 w-8 rounded-md border border-[#eaded2] object-cover"
                        src={apiAssetUrl(shop.avatarUrl)}
                        alt={shop.name}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#fff2df] text-[10px] font-bold text-[#9a5700]">
                        {getInitial(shop.name, shop.slug)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#1d1712]">{shop.name}</p>
                      <p className="text-[10px] text-[#7b6556]">/{shop.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#2a211a]">{shop.owner?.name || 'Chưa cập nhật'}</p>
                  <p className="text-[10px] text-[#6e5c51]">{shop.owner?.email || 'Không có email'}</p>
                </td>
                <td className="px-4 py-3 font-semibold">{formatCount(shop.deliveredOrderCount)}</td>
                <td className="px-4 py-3 font-semibold text-[#a15d00]">{formatCurrency(shop.monthlyDeliveredRevenue)}</td>
                <td className="px-4 py-3 font-bold text-[#047857]">{formatCurrency(shop.monthlyPlatformFee)}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(shop.monthlyPayout)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!visibleShops.length ? (
        <div className="border-t border-[#f0e7df] px-4 py-8 text-center text-[13px] text-[#6e5c51]">
          Chưa có cửa hàng phát sinh phí sàn trong tháng.
        </div>
      ) : null}
    </section>
  )
}

function ShopApplicationDetailsModal({ shop, onClose }) {
  if (!shop) return null

  const rows = [
    ['Tên cửa hàng', shop.name],
    ['Slug', shop.slug || 'Chưa có'],
    ['Chủ sở hữu', shop.owner],
    ['Email chủ sở hữu', shop.ownerEmail || 'Chưa cập nhật'],
    ['Số điện thoại liên hệ', shop.contactPhone || 'Chưa cập nhật'],
    ['Email liên hệ', shop.contactEmail || 'Chưa cập nhật'],
    ['Địa chỉ', shop.address || 'Chưa cập nhật'],
    ['Quốc gia', shop.country || 'VN'],
    ['Ngày gửi', shop.date],
  ]

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#eaded2] px-5 py-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#15110d]">Thông tin cửa hàng</h2>
            <p className="mt-1 text-[12px] text-[#6f5b4d]">Kiểm tra hồ sơ đăng ký trước khi phê duyệt.</p>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#4e3d31] hover:bg-[#f2e7db]"
            type="button"
            onClick={onClose}
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="max-h-[calc(90vh-130px)] overflow-y-auto px-5 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#eaded2] bg-[#fbfaf9] px-3 py-3">
                <p className="text-[10px] font-bold uppercase text-[#8b6a52]">{label}</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1d1712]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-[#eaded2] bg-[#fbfaf9] px-3 py-3">
            <p className="text-[10px] font-bold uppercase text-[#8b6a52]">Mô tả cửa hàng</p>
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-5 text-[#1d1712]">
              {shop.description || 'Chưa có mô tả.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#eaded2] px-5 py-3">
          <button
            className="h-9 rounded-md bg-[#995900] px-4 text-[12px] font-bold text-white hover:bg-[#7b4600]"
            type="button"
            onClick={onClose}
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  )
}

function ApproveShopApplicationModal({ shop, submitting, onClose, onSubmit }) {
  if (!shop) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#eaded2] px-5 py-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#15110d]">Xác nhận phê duyệt</h2>
            <p className="mt-1 text-[12px] leading-5 text-[#6f5b4d]">
              Cửa hàng {shop.name} sẽ được kích hoạt và chủ sở hữu có thể bắt đầu bán hàng trên hệ thống.
            </p>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#4e3d31] hover:bg-[#f2e7db]"
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="rounded-lg border border-[#eaded2] bg-[#fbfaf9] px-3 py-3">
            <p className="text-[10px] font-bold uppercase text-[#8b6a52]">Cửa hàng</p>
            <p className="mt-1 text-[14px] font-bold text-[#1d1712]">{shop.name}</p>
            <p className="mt-1 text-[12px] text-[#6f5b4d]">Chủ sở hữu: {shop.owner}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#eaded2] px-5 py-3">
          <button
            className="h-9 rounded-md border border-[#bba795] bg-white px-4 text-[12px] font-bold text-[#4e3d31] hover:border-[#9a5700]"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            className="h-9 rounded-md bg-[#087c32] px-4 text-[12px] font-bold text-white hover:bg-[#066428] disabled:opacity-60"
            type="button"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? 'Đang xử lý...' : 'Phê duyệt'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RejectShopApplicationModal({ shop, reason, submitting, onReasonChange, onClose, onSubmit }) {
  if (!shop) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-6">
      <form className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-3 border-b border-[#eaded2] px-5 py-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#15110d]">Từ chối phê duyệt</h2>
            <p className="mt-1 text-[12px] text-[#6f5b4d]">Nhập lý do để lưu vào hồ sơ đăng ký của {shop.name}.</p>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#4e3d31] hover:bg-[#f2e7db]"
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="px-5 py-4">
          <label className="grid gap-2">
            <span className="text-[12px] font-bold text-[#4b3527]">Lý do từ chối</span>
            <textarea
              className="min-h-28 rounded-md border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0"
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Ví dụ: thiếu thông tin liên hệ, địa chỉ chưa rõ ràng..."
              disabled={submitting}
              required
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#eaded2] px-5 py-3">
          <button
            className="h-9 rounded-md border border-[#bba795] bg-white px-4 text-[12px] font-bold text-[#4e3d31] hover:border-[#9a5700]"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            className="h-9 rounded-md bg-[#b42318] px-4 text-[12px] font-bold text-white hover:bg-[#8f1a12] disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Đang xử lý...' : 'Từ chối'}
          </button>
        </div>
      </form>
    </div>
  )
}

function PendingShopsTable({ shops, totalCount, onReviewed }) {
  const visibleShops = shops || []
  const [viewingShop, setViewingShop] = useState(null)
  const [approvingShop, setApprovingShop] = useState(null)
  const [rejectingShop, setRejectingShop] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [workingShopId, setWorkingShopId] = useState(null)

  async function handleApprove(shop) {
    if (!shop) return

    setWorkingShopId(shop.id)
    try {
      await reviewSellerApplication(shop.applicationId, { action: 'approve' })
      toast.success('Đã duyệt cửa hàng.')
      setApprovingShop(null)
      await onReviewed?.()
    } catch (err) {
      toast.error(err.message || 'Duyệt cửa hàng thất bại')
    } finally {
      setWorkingShopId(null)
    }
  }

  function openRejectModal(shop) {
    setRejectingShop(shop)
    setRejectReason('')
  }

  async function handleRejectSubmit(event) {
    event.preventDefault()
    if (!rejectingShop) return

    const reason = rejectReason.trim()
    if (!reason) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }

    setWorkingShopId(rejectingShop.id)
    try {
      await reviewSellerApplication(rejectingShop.applicationId, {
        action: 'reject',
        rejectReason: reason,
      })
      toast.success('Đã từ chối đơn đăng ký.')
      setRejectingShop(null)
      setRejectReason('')
      await onReviewed?.()
    } catch (err) {
      toast.error(err.message || 'Từ chối đơn đăng ký thất bại')
    } finally {
      setWorkingShopId(null)
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#15110d]">Doanh thu theo khoang thoi gian</h2>
          <p className="mt-0.5 text-[11px] text-[#7c6657]">Kiểm tra thông tin pháp lý trước khi phê duyệt.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="h-7 rounded-md bg-[#eeeeed] px-3 text-[10px] font-bold text-[#3f332a] hover:bg-[#e4ded8]"
            type="button"
          >
            Xuất Excel
          </button>
          <button
            className="h-7 rounded-md bg-[#995900] px-3 text-[10px] font-bold text-white hover:bg-[#7b4600]"
            type="button"
          >
            Xem tất cả ({formatCount(totalCount ?? visibleShops.length)})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="h-10 bg-[#f4f3f2] text-[10px] font-bold text-[#4b3527]">
              <th className="px-4">Tên cửa hàng</th>
              <th className="px-4">Chủ sở hữu</th>
              <th className="px-4">Lĩnh vực</th>
              <th className="px-4">Ngày gửi</th>
              <th className="px-4">Trạng thái</th>
              <th className="px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visibleShops.map((shop) => (
              <tr key={shop.name} className="border-t border-[#f0e7df] text-[11px] text-[#17120e]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold ${shop.colorClass}`}>
                      {shop.id}
                    </span>
                    <span className="font-bold">{shop.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#4b3d32]">{shop.owner}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-[#f2f1ef] px-2 py-1 text-[10px] font-semibold text-[#6d5c50]">
                    {shop.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#4b3d32]">{shop.date}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9a5a00]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#c57900]" />
                    Chờ duyệt
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <IconButton icon="visibility" label={`Xem ${shop.name}`} onClick={() => setViewingShop(shop)} />
                    <IconButton
                      icon={workingShopId === shop.id ? 'sync' : 'check_circle'}
                      label={`Duyệt ${shop.name}`}
                      disabled={Boolean(workingShopId)}
                      onClick={() => setApprovingShop(shop)}
                    />
                    <IconButton
                      icon={workingShopId === shop.id ? 'sync' : 'cancel'}
                      label={`Từ chối ${shop.name}`}
                      className="text-[#b42318] hover:bg-[#ffe7e3] hover:text-[#8f1a12]"
                      disabled={Boolean(workingShopId)}
                      onClick={() => openRejectModal(shop)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!visibleShops.length ? (
        <div className="border-t border-[#f0e7df] px-4 py-8 text-center text-[13px] text-[#6e5c51]">
          Không có cửa hàng đang chờ duyệt.
        </div>
      ) : null}

      <ShopApplicationDetailsModal shop={viewingShop} onClose={() => setViewingShop(null)} />
      <ApproveShopApplicationModal
        shop={approvingShop}
        submitting={Boolean(workingShopId)}
        onClose={() => {
          if (workingShopId) return
          setApprovingShop(null)
        }}
        onSubmit={() => handleApprove(approvingShop)}
      />
      <RejectShopApplicationModal
        shop={rejectingShop}
        reason={rejectReason}
        submitting={Boolean(workingShopId)}
        onReasonChange={setRejectReason}
        onClose={() => {
          if (workingShopId) return
          setRejectingShop(null)
          setRejectReason('')
        }}
        onSubmit={handleRejectSubmit}
      />
    </section>
  )
}

export function OverviewDashboard({ dashboardData, revenueFilter, onDashboardRefresh, onRevenueFilterChange }) {
  const stats = buildOverviewStats(dashboardData)
  const trend = dashboardData?.revenueTrend || []
  const platformFeeShops = dashboardData?.platformFeeShops || []
  const shops = buildPendingShops(dashboardData)
  const pendingActions = dashboardData?.stats?.pendingActions ?? shops.length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[18px] font-bold leading-6 text-[#15110d]">Tổng quan hệ thống</h1>
        <p className="mt-0.5 text-[11px] text-[#7c6657]">
          Chào mừng trở lại, hôm nay có {formatCount(pendingActions)} yêu cầu mới cần xử lý.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <OverviewMetricCard key={stat.label} stat={stat} />
        ))}
      </div>

      <RevenueTrendCard
        trend={trend}
        revenueRange={dashboardData?.revenueRange}
        revenueFilter={revenueFilter}
        onRevenueFilterChange={onRevenueFilterChange}
      />

      <PlatformFeeShopsTable shops={platformFeeShops} />

      <PendingShopsTable
        shops={shops}
        totalCount={dashboardData?.stats?.pendingShops}
        onReviewed={onDashboardRefresh}
      />
    </div>
  )
}

export function PlaceholderModule({ activeModule }) {
  const current = moduleCopy[activeModule] || moduleCopy.dashboard

  return (
    <div className="rounded-lg border border-[#eaded2] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(60,42,22,0.06)]">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff2df] text-[#9a5700]">
          {adminNavItems.find((item) => item.value === activeModule)?.icon || 'grid_view'}
        </span>
        <div>
          <h1 className="text-[22px] font-bold text-[#1f160f]">{current.title}</h1>
          <p className="mt-1 text-[13px] text-[#6f5b4d]">{current.description}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {['Tổng quan', 'Danh sách', 'Thao tác'].map((label) => (
          <div key={label} className="rounded-lg bg-[#f7f5f2] px-4 py-4">
            <p className="text-[12px] font-semibold text-[#8b6a52]">{label}</p>
            <p className="mt-1 text-[13px] text-[#2c2118]">Sẵn sàng kết nối dữ liệu quản trị.</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ShopsDashboard({ searchTerm, shopsData }) {
  const [activeStatus, setActiveStatus] = useState('all')
  const stats = useMemo(() => buildShopStats(shopsData), [shopsData])
  const shops = useMemo(() => shopsData?.items || [], [shopsData])
  const statusTabs = [
    { value: 'all', label: 'Tất cả', count: shopsData?.stats?.total || 0 },
    { value: 'active', label: 'Đang hoạt động', count: shopsData?.stats?.active || 0 },
    { value: 'inactive', label: 'Tạm khóa', count: shopsData?.stats?.inactive || 0 },
  ]

  const filteredShops = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return shops.filter((shop) => {
      const matchesStatus =
        activeStatus === 'all' || (activeStatus === 'active' ? shop.isActive : !shop.isActive)
      const haystack = `${shop.id} ${shop.name} ${shop.slug} ${shop.owner?.name} ${shop.owner?.email} ${shop.province}`.toLowerCase()
      const matchesSearch = !keyword || haystack.includes(keyword)

      return matchesStatus && matchesSearch
    })
  }, [activeStatus, searchTerm, shops])

  const visibleCount = filteredShops.length
  const visibleStart = visibleCount ? 1 : 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold leading-8 text-[#15110d]">Quản lý cửa hàng</h1>
          <p className="mt-1 text-[12px] text-[#6b4d3e]">
            Theo dõi cửa hàng, chủ sở hữu, sản phẩm và doanh thu từ dữ liệu trong CSDL.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <OverviewMetricCard key={stat.label} stat={stat} />
        ))}
      </div>

      <section className="overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
        <div className="flex min-h-12 overflow-x-auto border-b border-[#eaded2]">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              className={`relative min-w-max px-5 text-[12px] font-medium transition-colors ${
                activeStatus === tab.value ? 'text-[#a15d00]' : 'text-[#34261b] hover:text-[#a15d00]'
              }`}
              type="button"
              onClick={() => setActiveStatus(tab.value)}
            >
              {tab.label} ({formatCount(tab.count)})
              {activeStatus === tab.value ? <span className="absolute inset-x-0 bottom-0 h-px bg-[#a15d00]" /> : null}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead>
              <tr className="h-12 bg-[#eeeeed] text-[10px] font-bold uppercase text-[#4b3527]">
                <th className="px-4">Cửa hàng</th>
                <th className="px-4">Chủ sở hữu</th>
                <th className="px-4">Địa chỉ</th>
                <th className="px-4">Sản phẩm</th>
                <th className="px-4">Đơn hàng</th>
                <th className="px-4">Doanh thu</th>
                <th className="px-4">Phí sàn tháng</th>
                <th className="px-4">Đánh giá</th>
                <th className="px-4">Theo dõi</th>
                <th className="px-4">Trạng thái</th>
                <th className="px-4">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map((shop) => {
                const createdAt = formatDateTime(shop.createdAt)

                return (
                  <tr key={shop.id} className="border-t border-[#f0e7df] text-[12px] text-[#17120e]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {shop.avatarUrl ? (
                          <img
                            className="h-9 w-9 rounded-md border border-[#eaded2] object-cover"
                            src={apiAssetUrl(shop.avatarUrl)}
                            alt={shop.name}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#fff2df] text-[11px] font-bold text-[#9a5700]">
                            {getInitial(shop.name, shop.slug)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-bold leading-5 text-[#1d1712]">{shop.name}</p>
                          <p className="text-[10px] leading-4 text-[#7b6556]">/{shop.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#2a211a]">{shop.owner?.name || 'Chưa cập nhật'}</p>
                      <p className="mt-0.5 text-[10px] text-[#6e5c51]">{shop.owner?.email || 'Không có email'}</p>
                    </td>
                    <td className="max-w-[260px] px-4 py-4 text-[#4b3d32]">
                      <p className="line-clamp-2 leading-5">{formatShopAddress(shop)}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold">{formatCount(shop.productCount)}</td>
                    <td className="px-4 py-4 font-semibold">{formatCount(shop.orderCount)}</td>
                    <td className="px-4 py-4 font-semibold text-[#a15d00]">{formatCurrency(shop.revenue)}</td>
                    <td className="px-4 py-4 font-bold text-[#047857]">{formatCurrency(shop.monthlyPlatformFee)}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{Number(shop.ratingAvg || 0).toFixed(1)}/5</p>
                      <p className="text-[10px] text-[#6e5c51]">{formatCount(shop.ratingCount)} lượt</p>
                    </td>
                    <td className="px-4 py-4 font-semibold">{formatCount(shop.followerCount)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                          shop.isActive ? 'text-[#087c32]' : 'text-[#b42318]'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${shop.isActive ? 'bg-[#16a34a]' : 'bg-[#dc2626]'}`} />
                        {shop.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{createdAt.date}</p>
                      <p className="text-[10px] text-[#6e5c51]">{createdAt.time}</p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!filteredShops.length ? (
          <div className="border-t border-[#f0e7df] px-4 py-10 text-center text-[13px] text-[#6e5c51]">
            Không tìm thấy cửa hàng phù hợp.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#eeeeed] px-4 py-3 text-[12px] text-[#4b3527]">
          <p>
            Hiển thị {visibleStart} - {visibleCount} trên tổng số {formatCount(shops.length)} cửa hàng
          </p>
          <p className="font-semibold text-[#7b6556]">Nguồn dữ liệu: bảng shops</p>
        </div>
      </section>
    </div>
  )
}

const emptyCategoryForm = {
  name: '',
  slug: '',
  parentId: '',
  sortOrder: '0',
  isActive: true,
}

function slugifyCategory(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function CategoriesDashboard({ searchTerm, categoriesData, onCategoriesDataChange }) {
  const [activeStatus, setActiveStatus] = useState('all')
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [workingCategoryId, setWorkingCategoryId] = useState(null)
  const [savingCategory, setSavingCategory] = useState(false)
  const categories = useMemo(() => categoriesData?.items || [], [categoriesData])
  const parentOptions = categories.filter((category) => Number(category.id) !== Number(editingCategoryId))
  const statusTabs = [
    { value: 'all', label: 'Tat ca', count: categoriesData?.stats?.total || 0 },
    { value: 'active', label: 'Dang hien thi', count: categoriesData?.stats?.active || 0 },
    { value: 'inactive', label: 'Tam an', count: categoriesData?.stats?.inactive || 0 },
  ]

  const filteredCategories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return categories.filter((category) => {
      const matchesStatus =
        activeStatus === 'all' ||
        (activeStatus === 'active' && category.isActive) ||
        (activeStatus === 'inactive' && !category.isActive)
      const haystack = `${category.id} ${category.name} ${category.slug}`.toLowerCase()
      const matchesSearch = !keyword || haystack.includes(keyword)

      return matchesStatus && matchesSearch
    })
  }, [activeStatus, categories, searchTerm])

  const categoryById = useMemo(() => {
    return categories.reduce((result, category) => {
      result[category.id] = category
      return result
    }, {})
  }, [categories])

  function resetCategoryForm() {
    setEditingCategoryId(null)
    setCategoryForm(emptyCategoryForm)
  }

  function updateCategoryField(field, value) {
    setCategoryForm((current) => {
      if (field === 'name' && !editingCategoryId && (!current.slug || current.slug === slugifyCategory(current.name))) {
        return { ...current, name: value, slug: slugifyCategory(value) }
      }

      return { ...current, [field]: value }
    })
  }

  function editCategory(category) {
    setEditingCategoryId(category.id)
    setCategoryForm({
      name: category.name || '',
      slug: category.slug || '',
      parentId: category.parentId ? String(category.parentId) : '',
      sortOrder: String(category.sortOrder ?? 0),
      isActive: Boolean(category.isActive),
    })
  }

  async function handleCategorySubmit(event) {
    event.preventDefault()
    setSavingCategory(true)

    const payload = {
      name: categoryForm.name,
      slug: categoryForm.slug,
      parentId: categoryForm.parentId || null,
      sortOrder: categoryForm.sortOrder,
      isActive: categoryForm.isActive,
    }

    try {
      const nextData = editingCategoryId
        ? await updateAdminCategory(editingCategoryId, payload)
        : await createAdminCategory(payload)
      onCategoriesDataChange(nextData)
      resetCategoryForm()
      toast.success(editingCategoryId ? 'Da cap nhat danh muc.' : 'Da tao danh muc.')
    } catch (err) {
      toast.error(err.message || 'Khong luu duoc danh muc.')
    } finally {
      setSavingCategory(false)
    }
  }

  async function handleToggleCategory(category) {
    setWorkingCategoryId(category.id)

    try {
      const nextData = await updateAdminCategory(category.id, { isActive: !category.isActive })
      onCategoriesDataChange(nextData)
      toast.success('Da cap nhat trang thai danh muc.')
    } catch (err) {
      toast.error(err.message || 'Khong cap nhat duoc danh muc.')
    } finally {
      setWorkingCategoryId(null)
    }
  }

  async function handleDeleteCategory(category) {
    if (!window.confirm(`Ban co chac muon xoa danh muc "${category.name}"?`)) return
    setWorkingCategoryId(category.id)

    try {
      const nextData = await deleteAdminCategory(category.id)
      onCategoriesDataChange(nextData)
      if (Number(editingCategoryId) === Number(category.id)) resetCategoryForm()
      toast.success('Da xoa danh muc.')
    } catch (err) {
      toast.error(err.message || 'Khong xoa duoc danh muc.')
    } finally {
      setWorkingCategoryId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold leading-8 text-[#15110d]">Quan tri danh muc</h1>
          <p className="mt-1 text-[12px] text-[#6b4d3e]">
            Tao, sap xep va an hien danh muc san pham cho trang mua hang va kenh nguoi ban.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetricCard stat={{ label: 'Tong danh muc', value: formatCount(categoriesData?.stats?.total || 0), icon: 'category', change: 'Tat ca', iconClass: 'bg-[#fff2df] text-[#d47b00]' }} />
        <OverviewMetricCard stat={{ label: 'Dang hien thi', value: formatCount(categoriesData?.stats?.active || 0), icon: 'visibility', change: 'Active', iconClass: 'bg-[#e8fff5] text-[#047857]' }} />
        <OverviewMetricCard stat={{ label: 'Tam an', value: formatCount(categoriesData?.stats?.inactive || 0), icon: 'visibility_off', change: 'Inactive', iconClass: 'bg-[#fff0e7] text-[#e5791f]' }} />
        <OverviewMetricCard stat={{ label: 'Danh muc goc', value: formatCount(categoriesData?.stats?.roots || 0), icon: 'account_tree', change: 'Root', iconClass: 'bg-[#e8f0ff] text-[#2f6bf2]' }} />
      </div>

      <section className="rounded-lg border border-[#eaded2] bg-white p-4 shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_140px_130px_auto]" onSubmit={handleCategorySubmit}>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Ten danh muc</span>
            <input
              className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0"
              value={categoryForm.name}
              onChange={(event) => updateCategoryField('name', event.target.value)}
              placeholder="Vi du: Dien tu"
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Slug</span>
            <input
              className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0"
              value={categoryForm.slug}
              onChange={(event) => updateCategoryField('slug', slugifyCategory(event.target.value))}
              placeholder="dien-tu"
              required
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Danh muc cha</span>
            <select
              className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0"
              value={categoryForm.parentId}
              onChange={(event) => updateCategoryField('parentId', event.target.value)}
            >
              <option value="">Danh muc goc</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Thu tu</span>
            <input
              className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0"
              type="number"
              min="0"
              value={categoryForm.sortOrder}
              onChange={(event) => updateCategoryField('sortOrder', event.target.value)}
            />
          </label>
          <div className="flex items-end gap-2">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-[#dfc8b5] bg-[#fbfaf9] px-3 text-[12px] font-semibold text-[#4b3527]">
              <input
                className="rounded border-[#dfc8b5] text-[#c57900] focus:ring-[#c57900]"
                type="checkbox"
                checked={categoryForm.isActive}
                onChange={(event) => updateCategoryField('isActive', event.target.checked)}
              />
              Hien thi
            </label>
            <button
              className="h-10 rounded-lg bg-[#995900] px-4 text-[12px] font-bold text-white hover:bg-[#7b4600] disabled:opacity-60"
              type="submit"
              disabled={savingCategory}
            >
              {savingCategory ? 'Dang luu...' : editingCategoryId ? 'Cap nhat' : 'Them'}
            </button>
            {editingCategoryId ? (
              <button
                className="h-10 rounded-lg border border-[#bba795] px-3 text-[12px] font-bold text-[#4e3d31] hover:border-[#9a5700]"
                type="button"
                onClick={resetCategoryForm}
              >
                Huy
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
        <div className="flex min-h-12 overflow-x-auto border-b border-[#eaded2]">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              className={`relative min-w-max px-5 text-[12px] font-medium transition-colors ${
                activeStatus === tab.value ? 'text-[#a15d00]' : 'text-[#34261b] hover:text-[#a15d00]'
              }`}
              type="button"
              onClick={() => setActiveStatus(tab.value)}
            >
              {tab.label} ({formatCount(tab.count)})
              {activeStatus === tab.value ? <span className="absolute inset-x-0 bottom-0 h-px bg-[#a15d00]" /> : null}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="h-12 bg-[#eeeeed] text-[10px] font-bold uppercase text-[#4b3527]">
                <th className="px-4">Danh muc</th>
                <th className="px-4">Danh muc cha</th>
                <th className="px-4">Thu tu</th>
                <th className="px-4">San pham</th>
                <th className="px-4">Danh muc con</th>
                <th className="px-4">Trang thai</th>
                <th className="px-4">Cap nhat</th>
                <th className="px-4 text-center">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => {
                const updatedAt = formatDateTime(category.updatedAt)
                const isWorking = workingCategoryId === category.id || savingCategory

                return (
                  <tr key={category.id} className="border-t border-[#f0e7df] text-[12px] text-[#17120e]">
                    <td className="px-4 py-4">
                      <p className="font-bold text-[#1d1712]">{category.name}</p>
                      <p className="mt-0.5 text-[10px] text-[#7b6556]">/{category.slug}</p>
                    </td>
                    <td className="px-4 py-4">{category.parentId ? categoryById[category.parentId]?.name || `#${category.parentId}` : 'Danh muc goc'}</td>
                    <td className="px-4 py-4 font-semibold">{formatCount(category.sortOrder)}</td>
                    <td className="px-4 py-4">{formatCount(category.productCount)}</td>
                    <td className="px-4 py-4">{formatCount(category.childCount)}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${category.isActive ? 'bg-[#d9f7df] text-[#087c32]' : 'bg-[#ffdcd6] text-[#b42318]'}`}>
                        {category.isActive ? 'Dang hien thi' : 'Tam an'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{updatedAt.date}</p>
                      <p className="text-[10px] text-[#6e5c51]">{updatedAt.time}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-1">
                        <IconButton icon="edit" label="Sua danh muc" disabled={isWorking} onClick={() => editCategory(category)} />
                        <IconButton
                          icon={category.isActive ? 'visibility_off' : 'visibility'}
                          label={category.isActive ? 'Tam an' : 'Hien thi'}
                          disabled={isWorking}
                          onClick={() => handleToggleCategory(category)}
                        />
                        <IconButton icon="delete" label="Xoa danh muc" disabled={isWorking} onClick={() => handleDeleteCategory(category)} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!filteredCategories.length ? (
          <div className="border-t border-[#f0e7df] px-4 py-10 text-center text-[13px] text-[#6e5c51]">
            Khong tim thay danh muc phu hop.
          </div>
        ) : null}
      </section>
    </div>
  )
}

function RatingStars({ value }) {
  const rating = Number(value || 0)

  return (
    <span className="inline-flex items-center gap-0.5 text-[#f59e0b]" title={`${rating}/5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={`material-symbols-outlined text-[15px] ${rating >= index + 1 ? 'opacity-100' : 'opacity-25'}`}>
          star
        </span>
      ))}
    </span>
  )
}

export function CommentsDashboard({ searchTerm, commentsData, onCommentsDataChange }) {
  const [activeStatus, setActiveStatus] = useState('all')
  const [workingCommentId, setWorkingCommentId] = useState(null)
  const comments = useMemo(() => commentsData?.items || [], [commentsData])
  const statusTabs = [
    { value: 'all', label: 'Tat ca', count: commentsData?.stats?.total || 0 },
    { value: 'visible', label: 'Dang hien thi', count: commentsData?.stats?.visible || 0 },
    { value: 'hidden', label: 'Da an', count: commentsData?.stats?.hidden || 0 },
    { value: 'low', label: 'Rating thap', count: commentsData?.stats?.lowRating || 0 },
  ]

  const filteredComments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return comments.filter((comment) => {
      const matchesStatus =
        activeStatus === 'all' ||
        (activeStatus === 'visible' && comment.isVisible) ||
        (activeStatus === 'hidden' && !comment.isVisible) ||
        (activeStatus === 'low' && Number(comment.rating || 0) <= 2)
      const haystack = [
        comment.id,
        comment.comment,
        comment.user?.name,
        comment.user?.email,
        comment.product?.name,
        comment.shop?.name,
        comment.orderId,
      ].join(' ').toLowerCase()
      const matchesSearch = !keyword || haystack.includes(keyword)

      return matchesStatus && matchesSearch
    })
  }, [activeStatus, comments, searchTerm])

  async function handleToggleComment(comment) {
    setWorkingCommentId(comment.id)

    try {
      const nextData = await updateAdminComment(comment.id, { isVisible: !comment.isVisible })
      onCommentsDataChange(nextData)
      toast.success('Da cap nhat trang thai binh luan.')
    } catch (err) {
      toast.error(err.message || 'Khong cap nhat duoc binh luan.')
    } finally {
      setWorkingCommentId(null)
    }
  }

  async function handleDeleteComment(comment) {
    if (!window.confirm(`Ban co chac muon xoa binh luan #${comment.id}?`)) return
    setWorkingCommentId(comment.id)

    try {
      const nextData = await deleteAdminComment(comment.id)
      onCommentsDataChange(nextData)
      toast.success('Da xoa binh luan.')
    } catch (err) {
      toast.error(err.message || 'Khong xoa duoc binh luan.')
    } finally {
      setWorkingCommentId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold leading-8 text-[#15110d]">Quan ly binh luan</h1>
          <p className="mt-1 text-[12px] text-[#6b4d3e]">
            Kiem duyet danh gia san pham, an hien noi dung va theo doi nhung rating can xu ly.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetricCard stat={{ label: 'Tong binh luan', value: formatCount(commentsData?.stats?.total || 0), icon: 'rate_review', change: 'Tat ca', iconClass: 'bg-[#fff2df] text-[#d47b00]' }} />
        <OverviewMetricCard stat={{ label: 'Dang hien thi', value: formatCount(commentsData?.stats?.visible || 0), icon: 'visibility', change: 'Public', iconClass: 'bg-[#e8fff5] text-[#047857]' }} />
        <OverviewMetricCard stat={{ label: 'Da an', value: formatCount(commentsData?.stats?.hidden || 0), icon: 'visibility_off', change: 'Hidden', iconClass: 'bg-[#fff0e7] text-[#e5791f]' }} />
        <OverviewMetricCard stat={{ label: 'Rating thap', value: formatCount(commentsData?.stats?.lowRating || 0), icon: 'priority_high', change: 'Can xem', iconClass: 'bg-[#ffe0df] text-[#be2420]' }} />
      </div>

      <section className="overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
        <div className="flex min-h-12 overflow-x-auto border-b border-[#eaded2]">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              className={`relative min-w-max px-5 text-[12px] font-medium transition-colors ${
                activeStatus === tab.value ? 'text-[#a15d00]' : 'text-[#34261b] hover:text-[#a15d00]'
              }`}
              type="button"
              onClick={() => setActiveStatus(tab.value)}
            >
              {tab.label} ({formatCount(tab.count)})
              {activeStatus === tab.value ? <span className="absolute inset-x-0 bottom-0 h-px bg-[#a15d00]" /> : null}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead>
              <tr className="h-12 bg-[#eeeeed] text-[10px] font-bold uppercase text-[#4b3527]">
                <th className="px-4">Binh luan</th>
                <th className="px-4">Khach hang</th>
                <th className="px-4">San pham</th>
                <th className="px-4">Shop</th>
                <th className="px-4">Danh gia</th>
                <th className="px-4">Trang thai</th>
                <th className="px-4">Ngay gui</th>
                <th className="px-4 text-center">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {filteredComments.map((comment) => {
                const createdAt = formatDateTime(comment.createdAt)
                const isWorking = workingCommentId === comment.id

                return (
                  <tr key={comment.id} className="border-t border-[#f0e7df] text-[12px] text-[#17120e]">
                    <td className="max-w-[360px] px-4 py-4">
                      <p className="line-clamp-3 leading-5 text-[#1d1712]">
                        {comment.comment || 'Khach hang khong de lai binh luan.'}
                      </p>
                      <p className="mt-1 text-[10px] text-[#7b6556]">Review #{comment.id} · Don #{comment.orderId || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold">{comment.user?.name || 'Khach hang'}</p>
                      <p className="text-[10px] text-[#7b6556]">{comment.user?.email || 'Chua co email'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="line-clamp-2 font-semibold">{comment.product?.name || 'San pham'}</p>
                      <p className="text-[10px] text-[#7b6556]">ID #{comment.product?.id}</p>
                    </td>
                    <td className="px-4 py-4">{comment.shop?.name || 'Shop'}</td>
                    <td className="px-4 py-4">
                      <RatingStars value={comment.rating} />
                      <p className="text-[10px] font-semibold text-[#7b6556]">{comment.rating}/5</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${comment.isVisible ? 'bg-[#d9f7df] text-[#087c32]' : 'bg-[#ffdcd6] text-[#b42318]'}`}>
                        {comment.isVisible ? 'Dang hien thi' : 'Da an'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{createdAt.date}</p>
                      <p className="text-[10px] text-[#6e5c51]">{createdAt.time}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-1">
                        <IconButton
                          icon={comment.isVisible ? 'visibility_off' : 'visibility'}
                          label={comment.isVisible ? 'An binh luan' : 'Hien thi binh luan'}
                          disabled={isWorking}
                          onClick={() => handleToggleComment(comment)}
                        />
                        <IconButton icon="delete" label="Xoa binh luan" disabled={isWorking} onClick={() => handleDeleteComment(comment)} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!filteredComments.length ? (
          <div className="border-t border-[#f0e7df] px-4 py-10 text-center text-[13px] text-[#6e5c51]">
            Khong tim thay binh luan phu hop.
          </div>
        ) : null}
      </section>
    </div>
  )
}

export function UsersDashboard({ searchTerm, usersData, currentUserId, onUsersDataChange }) {
  const [activeRole, setActiveRole] = useState('all')
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const stats = useMemo(() => buildUserStats(usersData), [usersData])
  const users = useMemo(() => usersData?.items || [], [usersData])
  const roleTabs = [
    { value: 'all', label: 'Tất cả', count: usersData?.stats?.total || 0 },
    { value: 'customer', label: userRoleLabels.customer, count: usersData?.stats?.customers || 0 },
    { value: 'seller', label: userRoleLabels.seller, count: usersData?.stats?.sellers || 0 },
    { value: 'admin', label: userRoleLabels.admin, count: usersData?.stats?.admins || 0 },
  ]

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return users.filter((user) => {
      const matchesRole = activeRole === 'all' || user.role === activeRole
      const haystack = `${user.id} ${user.name} ${user.email} ${user.phone} ${user.role}`.toLowerCase()
      const matchesSearch = !keyword || haystack.includes(keyword)

      return matchesRole && matchesSearch
    })
  }, [activeRole, searchTerm, users])

  const visibleCount = filteredUsers.length
  const visibleStart = visibleCount ? 1 : 0

  async function handleUpdateUser(user, payload) {
    setUpdatingUserId(user.id)

    try {
      const nextUsersData = await updateAdminUser(user.id, payload)
      onUsersDataChange(nextUsersData)
      toast.success('Đã cập nhật người dùng.')
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được người dùng.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function handleDeleteUser(user) {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản ${user.name}?`)) return

    setUpdatingUserId(user.id)

    try {
      const nextUsersData = await deleteAdminUser(user.id)
      onUsersDataChange(nextUsersData)
      toast.success('Đã xóa người dùng.')
    } catch (err) {
      toast.error(err.message || 'Không xóa được người dùng.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  function handleToggleUserStatus(user) {
    const nextActive = !user.isActive
    const actionText = nextActive ? 'mở khóa' : 'khóa'

    if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản ${user.name}?`)) return
    handleUpdateUser(user, { isActive: nextActive })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold leading-8 text-[#15110d]">Quản trị người dùng</h1>
          <p className="mt-1 text-[12px] text-[#6b4d3e]">
            Theo dõi tài khoản, vai trò và trạng thái hoạt động từ dữ liệu trong CSDL.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <OverviewMetricCard key={stat.label} stat={stat} />
        ))}
      </div>

      <section className="overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
        <div className="flex min-h-12 overflow-x-auto border-b border-[#eaded2]">
          {roleTabs.map((tab) => (
            <button
              key={tab.value}
              className={`relative min-w-max px-5 text-[12px] font-medium transition-colors ${
                activeRole === tab.value ? 'text-[#a15d00]' : 'text-[#34261b] hover:text-[#a15d00]'
              }`}
              type="button"
              onClick={() => setActiveRole(tab.value)}
            >
              {tab.label} ({formatCount(tab.count)})
              {activeRole === tab.value ? <span className="absolute inset-x-0 bottom-0 h-px bg-[#a15d00]" /> : null}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="h-12 bg-[#eeeeed] text-[10px] font-bold uppercase text-[#4b3527]">
                <th className="px-4">Người dùng</th>
                <th className="w-[150px] px-4">Vai trò</th>
                <th className="px-4">Liên hệ</th>
                <th className="px-4">Đơn hàng</th>
                <th className="px-4">Chi tiêu</th>
                <th className="px-4">Cửa hàng</th>
                <th className="px-4">Trạng thái</th>
                <th className="px-4">Ngày tạo</th>
                <th className="px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const createdAt = formatDateTime(user.createdAt)
                const isCurrentUser = Number(user.id) === Number(currentUserId)
                const isUpdating = updatingUserId === user.id

                return (
                  <tr key={user.id} className="border-t border-[#f0e7df] text-[12px] text-[#17120e]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {user.avatarUrl ? (
                          <img
                            className="h-8 w-8 rounded-full border border-[#eaded2] object-cover"
                            src={apiAssetUrl(user.avatarUrl)}
                            alt={user.name}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff2df] text-[11px] font-bold text-[#9a5700]">
                            {getInitial(user.name, user.email)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-bold leading-5 text-[#1d1712]">{user.name}</p>
                          <p className="text-[10px] leading-4 text-[#7b6556]">ID #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <label className="relative block w-[138px]">
                        <select
                          className={`h-8 w-full appearance-none rounded-md border border-[#dfc8b5] py-0 pl-3 pr-8 text-[11px] font-bold leading-8 focus:border-[#c98225] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-75 ${
                            userRoleClassNames[user.role] || userRoleClassNames.customer
                          }`}
                          value={user.role}
                          disabled={isCurrentUser || isUpdating}
                          title={isCurrentUser ? 'Không thể tự đổi vai trò tài khoản đang đăng nhập' : 'Đổi vai trò người dùng'}
                          onChange={(event) => handleUpdateUser(user, { role: event.target.value })}
                        >
                          <option value="customer">Khách hàng</option>
                          <option value="seller">Người bán</option>
                          <option value="admin">Quản trị viên</option>
                        </select>
                        <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#6e5c51]">
                          expand_more
                        </span>
                      </label>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#2a211a]">{user.email}</p>
                      <p className="mt-0.5 text-[10px] text-[#6e5c51]">{user.phone || 'Chưa cập nhật SĐT'}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold">{formatCount(user.orderCount)}</td>
                    <td className="px-4 py-4 font-semibold text-[#a15d00]">{formatCurrency(user.totalSpent)}</td>
                    <td className="px-4 py-4 font-semibold">{formatCount(user.shopCount)}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            user.isActive ? 'text-[#087c32]' : 'text-[#b42318]'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-[#16a34a]' : 'bg-[#dc2626]'}`} />
                          {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                        <p className="text-[10px] text-[#7b6556]">
                          {user.emailVerified ? 'Đã xác minh email' : 'Chưa xác minh email'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{createdAt.date}</p>
                      <p className="text-[10px] text-[#6e5c51]">{createdAt.time}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <IconButton
                          icon={isUpdating ? 'sync' : 'close'}
                          label={`Xóa ${user.name}`}
                          className="text-[#b42318] hover:bg-[#ffe7e3] hover:text-[#8f1a12] disabled:hover:text-[#b42318]"
                          disabled={isCurrentUser || isUpdating}
                          onClick={() => handleDeleteUser(user)}
                        />
                        <IconButton
                          icon={isUpdating ? 'sync' : user.isActive ? 'lock_open' : 'lock'}
                          label={user.isActive ? `Khóa ${user.name}` : `Mở khóa ${user.name}`}
                          className={
                            user.isActive
                              ? 'text-[#087c32] hover:bg-[#dcfce7] hover:text-[#066428]'
                              : 'text-[#b42318] hover:bg-[#ffe7e3] hover:text-[#8f1a12]'
                          }
                          disabled={isCurrentUser || isUpdating}
                          onClick={() => handleToggleUserStatus(user)}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!filteredUsers.length ? (
          <div className="border-t border-[#f0e7df] px-4 py-10 text-center text-[13px] text-[#6e5c51]">
            Không tìm thấy người dùng phù hợp.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#eeeeed] px-4 py-3 text-[12px] text-[#4b3527]">
          <p>
            Hiển thị {visibleStart} - {visibleCount} trên tổng số {formatCount(users.length)} người dùng
          </p>
          <p className="font-semibold text-[#7b6556]">Nguồn dữ liệu: bảng users</p>
        </div>
      </section>
    </div>
  )
}

export function OrdersDashboard({ searchTerm, dashboardData }) {
  const [activeTab, setActiveTab] = useState('all')
  const tabs = useMemo(() => buildOrderTabs(dashboardData), [dashboardData])
  const sourceOrders = useMemo(() => buildOrders(dashboardData), [dashboardData])

  const filteredOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return sourceOrders.filter((order) => {
      const matchesStatus = activeTab === 'all' || order.status === activeTab
      const haystack = `${order.id} ${order.customer} ${order.phone} ${order.store}`.toLowerCase()
      const matchesSearch = !keyword || haystack.includes(keyword)

      return matchesStatus && matchesSearch
    })
  }, [activeTab, searchTerm, sourceOrders])

  const totalOrders = tabs.find((tab) => tab.value === activeTab)?.count || filteredOrders.length
  const visibleCount = filteredOrders.length
  const visibleStart = visibleCount ? 1 : 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold leading-8 text-[#15110d]">Quản trị đơn hàng</h1>
          <p className="mt-1 text-[12px] text-[#6b4d3e]">
            Quản lý và theo dõi tất cả giao dịch trong hệ thống ShopBee.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="flex h-9 items-center gap-2 rounded-md border border-[#bba795] bg-white px-4 text-[12px] font-semibold text-[#8c5400] transition-colors hover:border-[#9a5700] hover:text-[#6d3c00]"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Xuất báo cáo
          </button>
          <button
            className="flex h-9 items-center gap-2 rounded-md bg-[#995900] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(153,89,0,0.22)] transition-colors hover:bg-[#7b4600]"
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            Tạo đơn hàng mới
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
        <div className="flex min-h-12 overflow-x-auto border-b border-[#eaded2]">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={`relative min-w-max px-5 text-[12px] font-medium transition-colors ${
                activeTab === tab.value ? 'text-[#a15d00]' : 'text-[#34261b] hover:text-[#a15d00]'
              }`}
              type="button"
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label} ({formatCount(tab.count)})
              {activeTab === tab.value ? (
                <span className="absolute inset-x-0 bottom-0 h-px bg-[#a15d00]" />
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap gap-3">
            <button
              className="flex h-10 min-w-[172px] items-center justify-between gap-4 rounded-md border border-[#e5d8ca] bg-[#f2f1ef] px-3 text-[12px] text-[#4c382c]"
              type="button"
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[17px]">calendar_today</span>
                Tháng này
              </span>
              <span className="material-symbols-outlined text-[17px]">keyboard_arrow_down</span>
            </button>

            <button
              className="flex h-10 min-w-[162px] items-center justify-between gap-4 rounded-md border border-[#e5d8ca] bg-[#f2f1ef] px-3 text-[12px] text-[#4c382c]"
              type="button"
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[17px]">filter_list</span>
                Tất cả cửa hàng
              </span>
              <span className="material-symbols-outlined text-[17px]">keyboard_arrow_down</span>
            </button>
          </div>

          <button className="text-[12px] font-medium text-[#6f4938] hover:text-[#9a5700]" type="button">
            Xóa bộ lọc
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse text-left">
            <thead>
              <tr className="h-12 bg-[#eeeeed] text-[10px] font-bold uppercase text-[#4b3527]">
                <th className="w-12 px-3">
                  <input className="h-3.5 w-3.5 rounded border-[#e0cfc0] text-[#9a5700] focus:ring-[#9a5700]" type="checkbox" />
                </th>
                <th className="px-3">Mã đơn</th>
                <th className="px-3">Khách hàng</th>
                <th className="px-3">Cửa hàng</th>
                <th className="px-3">Ngày đặt</th>
                <th className="px-3">Tổng tiền</th>
                <th className="px-3">Trạng thái</th>
                <th className="px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-[#f0e7df] text-[12px] text-[#17120e]">
                  <td className="px-3 py-4">
                    <input className="h-3.5 w-3.5 rounded border-[#e0cfc0] text-[#9a5700] focus:ring-[#9a5700]" type="checkbox" />
                  </td>
                  <td className="px-3 py-4 font-medium text-[#b26700]">#{order.id}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${order.avatarClass}`}>
                        {order.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold leading-5 text-[#1d1712]">{order.customer}</p>
                        <p className="text-[10px] leading-4 text-[#6e5c51]">{order.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 font-medium">{order.store}</td>
                  <td className="px-3 py-4">
                    <p className="font-semibold">{order.date}</p>
                    <p className="text-[10px] text-[#6e5c51]">{order.time}</p>
                  </td>
                  <td className="px-3 py-4 font-semibold text-[#a15d00]">{order.total}</td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex max-w-[88px] items-center rounded-md px-1.5 py-1 text-[10px] font-bold leading-4 ${statusClassNames[order.status] || statusClassNames.pending}`}>
                      {order.statusLabel}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <IconButton icon="visibility" label={`Xem ${order.id}`} />
                      <IconButton icon="print" label={`In ${order.id}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filteredOrders.length ? (
          <div className="border-t border-[#f0e7df] px-4 py-10 text-center text-[13px] text-[#6e5c51]">
            Không tìm thấy đơn hàng phù hợp.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#eeeeed] px-3 py-3 text-[12px] text-[#4b3527]">
          <p>
            Hiển thị {visibleStart} - {visibleCount} trên tổng số {formatCount(totalOrders)} đơn hàng
          </p>
          <p className="font-semibold text-[#7b6556]">Nguồn dữ liệu: bảng orders</p>
        </div>
      </section>
    </div>
  )
}

