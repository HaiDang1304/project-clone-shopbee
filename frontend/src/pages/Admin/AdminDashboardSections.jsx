import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import RevenueRangeControls from '../../components/Charts/RevenueRangeControls'
import RevenueTrendChart from '../../components/Charts/RevenueTrendChart'
import SummaryBarChart from '../../components/Charts/SummaryBarChart'
import {
  createAdminCategory,
  createAdminFlashSale,
  createAdminVoucher,
  deleteAdminCategory,
  deleteAdminComment,
  deleteAdminUser,
  deleteAdminVoucher,
  reviewSellerApplication,
  reviewAdminFlashSaleRegistration,
  updateAdminCategory,
  updateAdminFlashSale,
  updateAdminComment,
  updateAdminShop,
  updateAdminUser,
  updateAdminVoucher,
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
          <h2 className="text-[15px] font-bold text-[#15110d]">Doanh thu theo khoảng thời gian</h2>
          <p className="mt-1 text-[11px] text-[#7c6657]">
            {hasRevenue
              ? `Cao nhất ${peakPoint.day}: ${formatCurrency(peakPoint.value)}`
              : 'Chưa có doanh thu phát sinh trong khoảng thời gian này.'}
          </p>
        </div>
        <div className="rounded-lg bg-[#fff7ea] px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase text-[#9a5700]">Tổng doanh thu</p>
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
          <h2 className="text-[15px] font-bold text-[#15110d]">Doanh thu theo khoảng thời gian</h2>
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
          <h2 className="text-[15px] font-bold text-[#15110d]">Doanh thu theo khoảng thời gian</h2>
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

export function ReportsDashboard({ dashboardData, shopsData, revenueFilter, onRevenueFilterChange }) {
  const [selectedShopId, setSelectedShopId] = useState('')
  const shops = shopsData?.items || []
  const selectedShop = shops.find((shop) => String(shop.id) === String(selectedShopId))
  const revenueTrend = dashboardData?.revenueTrend || []
  const revenueTotal = revenueTrend.reduce((sum, point) => sum + Number(point.value || 0), 0)
  const platformFeeShops = dashboardData?.platformFeeShops || []
  const totalDeliveredRevenue = platformFeeShops.reduce((sum, shop) => sum + Number(shop.monthlyDeliveredRevenue || 0), 0)
  const totalPlatformFee = platformFeeShops.reduce((sum, shop) => sum + Number(shop.monthlyPlatformFee || 0), 0)
  const orders = dashboardData?.orders?.items || []
  const orderTabs = dashboardData?.orders?.tabs || []
  const topShops = [...shops].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0)).slice(0, 8)
  const topShopChartItems = topShops.map((shop) => ({
    label: shop.name,
    value: Number(shop.revenue || 0),
  }))
  const statusChartItems = orderTabs
    .filter((tab) => tab.value !== 'all')
    .map((tab) => ({ label: tab.value, value: Number(tab.count || 0) }))
    .filter((item) => item.value > 0)
  const selectedShopFee = platformFeeShops.find((shop) => String(shop.id) === String(selectedShopId))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold leading-8 text-[#15110d]">Thống kê báo cáo</h1>
          <p className="mt-1 text-[12px] text-[#6b4d3e]">
            Tổng hợp doanh thu, phí sàn, đơn hàng và hiệu quả của từng cửa hàng.
          </p>
        </div>
        <label className="grid min-w-[260px] gap-1.5">
          <span className="text-[11px] font-bold text-[#4b3527]">Xem chi tiết cửa hàng</span>
          <select
            className="h-10 rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0"
            value={selectedShopId}
            onChange={(event) => setSelectedShopId(event.target.value)}
          >
            <option value="">Tổng quan toàn sàn</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetricCard stat={{ label: 'Doanh thu khoảng chọn', value: formatCurrency(revenueTotal), icon: 'payments', change: 'Theo biểu đồ', iconClass: 'bg-[#fff2df] text-[#d47b00]' }} />
        <OverviewMetricCard stat={{ label: 'Doanh thu đã giao tháng', value: formatCurrency(totalDeliveredRevenue), icon: 'inventory', change: 'Đã giao', iconClass: 'bg-[#e8fff5] text-[#047857]' }} />
        <OverviewMetricCard stat={{ label: 'Đơn hàng gần đây', value: formatCount(orders.length), icon: 'shopping_bag', change: 'Mới nhất', iconClass: 'bg-[#e8f0ff] text-[#2f6bf2]' }} />
        <OverviewMetricCard stat={{ label: 'Phí sàn tháng', value: formatCurrency(totalPlatformFee), icon: 'receipt', change: `${formatCount(shopsData?.stats?.active || 0)} shop đang bán`, iconClass: 'bg-[#f3e8ff] text-[#8c38d8]' }} />
      </div>

      <section className="rounded-lg border border-[#eaded2] bg-white p-4 shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-[#15110d]">Doanh thu hoạt động của sàn</h2>
            <p className="mt-1 text-[11px] text-[#7c6657]">Tổng doanh thu đơn hàng hợp lệ theo khoảng ngày đang chọn.</p>
          </div>
          <RevenueRangeControls value={revenueFilter} revenueRange={dashboardData?.revenueRange} onChange={onRevenueFilterChange} />
        </div>
        <div className="mt-5 h-[250px] rounded-lg bg-[#fbfaf9] px-3 pb-3 pt-4">
          <RevenueTrendChart trend={revenueTrend} lineColor="#c57900" fillStart="rgba(197, 121, 0, 0.28)" fillEnd="rgba(197, 121, 0, 0.03)" gridColor="rgba(124, 102, 87, 0.16)" tickColor="#6f5b4d" />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-[#eaded2] bg-white p-4 shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
          <h2 className="text-[15px] font-bold text-[#15110d]">Top cửa hàng theo doanh thu</h2>
          <div className="mt-4 h-[240px] rounded-lg bg-[#fbfaf9] px-3 pb-3 pt-4">
            <SummaryBarChart items={topShopChartItems} valueType="currency" color="#047857" />
          </div>
        </section>
        <section className="rounded-lg border border-[#eaded2] bg-white p-4 shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
          <h2 className="text-[15px] font-bold text-[#15110d]">Trạng thái đơn hàng</h2>
          <div className="mt-4 h-[240px] rounded-lg bg-[#fbfaf9] px-3 pb-3 pt-4">
            <SummaryBarChart items={statusChartItems} color="#2f6bf2" />
          </div>
        </section>
      </div>

      {selectedShop ? (
        <section className="rounded-lg border border-[#eaded2] bg-white p-4 shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-bold text-[#15110d]">{selectedShop.name}</h2>
              <p className="mt-1 text-[12px] text-[#7c6657]">{selectedShop.owner?.name || 'Chủ shop'} · {formatShopAddress(selectedShop)}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${selectedShop.isActive ? 'bg-[#d9f7df] text-[#087c32]' : 'bg-[#ffdcd6] text-[#b42318]'}`}>
              {selectedShop.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-[#fbfaf9] px-4 py-3">
              <p className="text-[11px] font-bold uppercase text-[#7c6657]">Tổng doanh thu</p>
              <p className="mt-1 text-[18px] font-bold text-[#a15d00]">{formatCurrency(selectedShop.revenue)}</p>
            </div>
            <div className="rounded-lg bg-[#fbfaf9] px-4 py-3">
              <p className="text-[11px] font-bold uppercase text-[#7c6657]">Phí sàn tháng</p>
              <p className="mt-1 text-[18px] font-bold text-[#047857]">{formatCurrency(selectedShop.monthlyPlatformFee)}</p>
            </div>
            <div className="rounded-lg bg-[#fbfaf9] px-4 py-3">
              <p className="text-[11px] font-bold uppercase text-[#7c6657]">Đơn hàng</p>
              <p className="mt-1 text-[18px] font-bold text-[#15110d]">{formatCount(selectedShop.orderCount)}</p>
            </div>
            <div className="rounded-lg bg-[#fbfaf9] px-4 py-3">
              <p className="text-[11px] font-bold uppercase text-[#7c6657]">Đánh giá</p>
              <p className="mt-1 text-[18px] font-bold text-[#15110d]">{Number(selectedShop.ratingAvg || 0).toFixed(1)}/5</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <p className="rounded-lg border border-[#eaded2] px-4 py-3 text-[12px] text-[#4b3527]">
              Doanh thu đã giao tháng: <span className="font-bold text-[#15110d]">{formatCurrency(selectedShopFee?.monthlyDeliveredRevenue || selectedShop.monthlyDeliveredRevenue || 0)}</span>
            </p>
            <p className="rounded-lg border border-[#eaded2] px-4 py-3 text-[12px] text-[#4b3527]">
              Thực nhận ước tính: <span className="font-bold text-[#15110d]">{formatCurrency(selectedShopFee?.monthlyPayout || Math.max(0, Number(selectedShop.monthlyDeliveredRevenue || 0) - Number(selectedShop.monthlyPlatformFee || 0)))}</span>
            </p>
            <p className="rounded-lg border border-[#eaded2] px-4 py-3 text-[12px] text-[#4b3527]">
              Sản phẩm đang quản lý: <span className="font-bold text-[#15110d]">{formatCount(selectedShop.productCount)}</span>
            </p>
          </div>
        </section>
      ) : (
        <PlatformFeeShopsTable shops={platformFeeShops} />
      )}
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

export function ShopsDashboard({ searchTerm, shopsData, onShopsDataChange }) {
  const [activeStatus, setActiveStatus] = useState('all')
  const [workingShopId, setWorkingShopId] = useState(null)
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

  async function handleToggleShop(shop) {
    const nextActive = !shop.isActive
    const actionText = nextActive ? 'mở khóa' : 'khóa'
    if (!window.confirm(`Bạn có chắc muốn ${actionText} cửa hàng "${shop.name}"?`)) return

    setWorkingShopId(shop.id)
    try {
      const nextData = await updateAdminShop(shop.id, { isActive: nextActive })
      onShopsDataChange?.(nextData)
      toast.success(nextActive ? 'Đã mở khóa cửa hàng.' : 'Đã khóa cửa hàng.')
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được trạng thái cửa hàng.')
    } finally {
      setWorkingShopId(null)
    }
  }

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
                <th className="px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map((shop) => {
                const createdAt = formatDateTime(shop.createdAt)
                const isWorking = workingShopId === shop.id

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
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <IconButton
                          icon={isWorking ? 'sync' : shop.isActive ? 'lock_open' : 'lock'}
                          label={shop.isActive ? `Khóa ${shop.name}` : `Mở khóa ${shop.name}`}
                          disabled={isWorking}
                          onClick={() => handleToggleShop(shop)}
                        />
                      </div>
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
    { value: 'all', label: 'Tất cả', count: categoriesData?.stats?.total || 0 },
    { value: 'active', label: 'Đang hiển thị', count: categoriesData?.stats?.active || 0 },
    { value: 'inactive', label: 'Tạm ẩn', count: categoriesData?.stats?.inactive || 0 },
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
      toast.success(editingCategoryId ? 'Đã cập nhật danh mục.' : 'Đã tạo danh mục.')
    } catch (err) {
      toast.error(err.message || 'Không lưu được danh mục.')
    } finally {
      setSavingCategory(false)
    }
  }

  async function handleToggleCategory(category) {
    setWorkingCategoryId(category.id)

    try {
      const nextData = await updateAdminCategory(category.id, { isActive: !category.isActive })
      onCategoriesDataChange(nextData)
      toast.success('Đã cập nhật trạng thái danh mục.')
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được danh mục.')
    } finally {
      setWorkingCategoryId(null)
    }
  }

  async function handleDeleteCategory(category) {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`)) return
    setWorkingCategoryId(category.id)

    try {
      const nextData = await deleteAdminCategory(category.id)
      onCategoriesDataChange(nextData)
      if (Number(editingCategoryId) === Number(category.id)) resetCategoryForm()
      toast.success('Đã xóa danh mục.')
    } catch (err) {
      toast.error(err.message || 'Không xóa được danh mục.')
    } finally {
      setWorkingCategoryId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold leading-8 text-[#15110d]">Quản trị danh mục</h1>
          <p className="mt-1 text-[12px] text-[#6b4d3e]">
            Tạo, sắp xếp và ẩn hiện danh mục sản phẩm cho trang mua hàng và kênh người bán.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetricCard stat={{ label: 'Tổng danh mục', value: formatCount(categoriesData?.stats?.total || 0), icon: 'category', change: 'Tất cả', iconClass: 'bg-[#fff2df] text-[#d47b00]' }} />
        <OverviewMetricCard stat={{ label: 'Đang hiển thị', value: formatCount(categoriesData?.stats?.active || 0), icon: 'visibility', change: 'Active', iconClass: 'bg-[#e8fff5] text-[#047857]' }} />
        <OverviewMetricCard stat={{ label: 'Tạm ẩn', value: formatCount(categoriesData?.stats?.inactive || 0), icon: 'visibility_off', change: 'Inactive', iconClass: 'bg-[#fff0e7] text-[#e5791f]' }} />
        <OverviewMetricCard stat={{ label: 'Danh mục gốc', value: formatCount(categoriesData?.stats?.roots || 0), icon: 'account_tree', change: 'Root', iconClass: 'bg-[#e8f0ff] text-[#2f6bf2]' }} />
      </div>

      <section className="rounded-lg border border-[#eaded2] bg-white p-4 shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_140px_130px_auto]" onSubmit={handleCategorySubmit}>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Tên danh mục</span>
            <input
              className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0"
              value={categoryForm.name}
              onChange={(event) => updateCategoryField('name', event.target.value)}
              placeholder="Ví dụ: Điện tử"
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
            <span className="text-[11px] font-bold text-[#4b3527]">Danh mục cha</span>
            <select
              className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0"
              value={categoryForm.parentId}
              onChange={(event) => updateCategoryField('parentId', event.target.value)}
            >
              <option value="">Danh mục gốc</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Thứ tự</span>
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
              Hiển thị
            </label>
            <button
              className="h-10 rounded-lg bg-[#995900] px-4 text-[12px] font-bold text-white hover:bg-[#7b4600] disabled:opacity-60"
              type="submit"
              disabled={savingCategory}
            >
              {savingCategory ? 'Đang lưu...' : editingCategoryId ? 'Cập nhật' : 'Thêm'}
            </button>
            {editingCategoryId ? (
              <button
                className="h-10 rounded-lg border border-[#bba795] px-3 text-[12px] font-bold text-[#4e3d31] hover:border-[#9a5700]"
                type="button"
                onClick={resetCategoryForm}
              >
                Hủy
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
                <th className="px-4">Danh mục</th>
                <th className="px-4">Danh mục cha</th>
                <th className="px-4">Thứ tự</th>
                <th className="px-4">Sản phẩm</th>
                <th className="px-4">Danh mục con</th>
                <th className="px-4">Trạng thái</th>
                <th className="px-4">Cập nhật</th>
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
                    <td className="px-4 py-4">{category.parentId ? categoryById[category.parentId]?.name || `#${category.parentId}` : 'Danh mục gốc'}</td>
                    <td className="px-4 py-4 font-semibold">{formatCount(category.sortOrder)}</td>
                    <td className="px-4 py-4">{formatCount(category.productCount)}</td>
                    <td className="px-4 py-4">{formatCount(category.childCount)}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${category.isActive ? 'bg-[#d9f7df] text-[#087c32]' : 'bg-[#ffdcd6] text-[#b42318]'}`}>
                        {category.isActive ? 'Đang hiển thị' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{updatedAt.date}</p>
                      <p className="text-[10px] text-[#6e5c51]">{updatedAt.time}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-1">
                        <IconButton icon="edit" label="Sửa danh mục" disabled={isWorking} onClick={() => editCategory(category)} />
                        <IconButton
                          icon={category.isActive ? 'visibility_off' : 'visibility'}
                          label={category.isActive ? 'Tạm ẩn' : 'Hiển thị'}
                          disabled={isWorking}
                          onClick={() => handleToggleCategory(category)}
                        />
                        <IconButton icon="delete" label="Xóa danh mục" disabled={isWorking} onClick={() => handleDeleteCategory(category)} />
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
            Không tìm thấy danh mục phù hợp.
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
    { value: 'all', label: 'Tất cả', count: commentsData?.stats?.total || 0 },
    { value: 'visible', label: 'Đang hiển thị', count: commentsData?.stats?.visible || 0 },
    { value: 'hidden', label: 'Đã ẩn', count: commentsData?.stats?.hidden || 0 },
    { value: 'low', label: 'Rating thấp', count: commentsData?.stats?.lowRating || 0 },
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
      toast.success('Đã cập nhật trạng thái bình luận.')
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được bình luận.')
    } finally {
      setWorkingCommentId(null)
    }
  }

  async function handleDeleteComment(comment) {
    if (!window.confirm(`Bạn có chắc muốn xóa bình luận #${comment.id}?`)) return
    setWorkingCommentId(comment.id)

    try {
      const nextData = await deleteAdminComment(comment.id)
      onCommentsDataChange(nextData)
      toast.success('Đã xóa bình luận.')
    } catch (err) {
      toast.error(err.message || 'Không xóa được bình luận.')
    } finally {
      setWorkingCommentId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold leading-8 text-[#15110d]">Quản lý bình luận</h1>
          <p className="mt-1 text-[12px] text-[#6b4d3e]">
            Kiểm duyệt đánh giá sản phẩm, ẩn hiện nội dung và theo dõi những rating cần xử lý.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetricCard stat={{ label: 'Tổng bình luận', value: formatCount(commentsData?.stats?.total || 0), icon: 'rate_review', change: 'Tất cả', iconClass: 'bg-[#fff2df] text-[#d47b00]' }} />
        <OverviewMetricCard stat={{ label: 'Đang hiển thị', value: formatCount(commentsData?.stats?.visible || 0), icon: 'visibility', change: 'Public', iconClass: 'bg-[#e8fff5] text-[#047857]' }} />
        <OverviewMetricCard stat={{ label: 'Đã ẩn', value: formatCount(commentsData?.stats?.hidden || 0), icon: 'visibility_off', change: 'Hidden', iconClass: 'bg-[#fff0e7] text-[#e5791f]' }} />
        <OverviewMetricCard stat={{ label: 'Rating thấp', value: formatCount(commentsData?.stats?.lowRating || 0), icon: 'priority_high', change: 'Cần xem', iconClass: 'bg-[#ffe0df] text-[#be2420]' }} />
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
                <th className="px-4">Bình luận</th>
                <th className="px-4">Khách hàng</th>
                <th className="px-4">Sản phẩm</th>
                <th className="px-4">Shop</th>
                <th className="px-4">Đánh giá</th>
                <th className="px-4">Trạng thái</th>
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
                        {comment.comment || 'Khách hàng không để lại bình luận.'}
                      </p>
                      <p className="mt-1 text-[10px] text-[#7b6556]">Review #{comment.id} · Đơn #{comment.orderId || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold">{comment.user?.name || 'Khách hàng'}</p>
                      <p className="text-[10px] text-[#7b6556]">{comment.user?.email || 'Chưa có email'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="line-clamp-2 font-semibold">{comment.product?.name || 'Sản phẩm'}</p>
                      <p className="text-[10px] text-[#7b6556]">ID #{comment.product?.id}</p>
                    </td>
                    <td className="px-4 py-4">{comment.shop?.name || 'Shop'}</td>
                    <td className="px-4 py-4">
                      <RatingStars value={comment.rating} />
                      <p className="text-[10px] font-semibold text-[#7b6556]">{comment.rating}/5</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${comment.isVisible ? 'bg-[#d9f7df] text-[#087c32]' : 'bg-[#ffdcd6] text-[#b42318]'}`}>
                        {comment.isVisible ? 'Đang hiển thị' : 'Đã ẩn'}
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
                          label={comment.isVisible ? 'Ẩn bình luận' : 'Hiển thị bình luận'}
                          disabled={isWorking}
                          onClick={() => handleToggleComment(comment)}
                        />
                        <IconButton icon="delete" label="Xóa bình luận" disabled={isWorking} onClick={() => handleDeleteComment(comment)} />
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
            Không tìm thấy bình luận phù hợp.
          </div>
        ) : null}
      </section>
    </div>
  )
}

const emptyVoucherForm = {
  code: '',
  title: '',
  scope: 'platform',
  shopId: '',
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

const emptyFlashSaleForm = {
  name: '',
  description: '',
  startsAt: '',
  endsAt: '',
  registrationStartsAt: '',
  registrationEndsAt: '',
  isActive: true,
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

function normalizeVoucherCodeInput(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, '')
}

function voucherDiscountText(voucher) {
  if (voucher.discountType === 'free_shipping') return 'Miễn phí vận chuyển'
  if (voucher.discountType === 'percent') {
    return `${Number(voucher.discountValue || 0)}%${voucher.maxDiscountAmount ? ` tối đa ${formatCurrency(voucher.maxDiscountAmount)}` : ''}`
  }
  return formatCurrency(voucher.discountValue)
}

function getAdminFlashSaleEventStatus(eventItem) {
  if (!eventItem?.isActive) return 'disabled'

  const now = Date.now()
  const startsAt = eventItem.startsAt ? new Date(eventItem.startsAt).getTime() : 0
  const endsAt = eventItem.endsAt ? new Date(eventItem.endsAt).getTime() : 0

  if (startsAt && now < startsAt) return 'upcoming'
  if (endsAt && now > endsAt) return 'ended'
  return 'live'
}

function getAdminFlashSaleEventMeta(eventItem) {
  if (!eventItem?.isActive) {
    return {
      label: 'Tạm tắt',
      className: 'bg-[#f1e8df] text-[#6b4d3e]',
    }
  }

  const now = Date.now()
  const startsAt = eventItem.startsAt ? new Date(eventItem.startsAt).getTime() : 0
  const endsAt = eventItem.endsAt ? new Date(eventItem.endsAt).getTime() : 0

  if (startsAt && now < startsAt) {
    return {
      label: 'Sắp diễn ra',
      className: 'bg-[#e8f0ff] text-[#2f5fd0]',
    }
  }
  if (endsAt && now > endsAt) {
    return {
      label: 'Đã kết thúc',
      className: 'bg-[#eeeeed] text-[#5f5148]',
    }
  }

  return {
    label: 'Đang diễn ra',
    className: 'bg-[#d9f7df] text-[#087c32]',
  }
}

function getAdminFlashSaleRegistrationMeta(status) {
  if (status === 'approved') {
    return {
      label: 'Đã duyệt',
      className: 'bg-[#d9f7df] text-[#087c32]',
    }
  }
  if (status === 'rejected') {
    return {
      label: 'Từ chối',
      className: 'bg-[#ffdcd6] text-[#b42318]',
    }
  }
  if (status === 'cancelled') {
    return {
      label: 'Đã hủy',
      className: 'bg-[#eeeeed] text-[#5f5148]',
    }
  }
  return {
    label: 'Chờ duyệt',
    className: 'bg-[#fff1cc] text-[#9a5a00]',
  }
}

function AdminFormModal({ title, description, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="max-h-[calc(100vh-48px)] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#eaded2] bg-[#fffaf4] px-5 py-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#15110d]">{title}</h2>
            {description ? <p className="mt-1 text-[12px] text-[#6b4d3e]">{description}</p> : null}
          </div>
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#4b3527] hover:bg-[#f2e7db]" type="button" onClick={onClose} aria-label="Dong modal">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="max-h-[calc(100vh-140px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

// eslint-disable-next-line no-unused-vars
function AdminFlashSalesPanel({
  flashSalesData,
  flashSaleForm,
  flashSaleEvents,
  flashSaleRegistrations,
  savingFlashSale,
  workingRegistrationId,
  creatingFlashSale,
  onFlashSaleFormChange,
  onFlashSaleSubmit,
  onCreateFlashSaleClick,
  onCloseFlashSaleModal,
  onToggleFlashSale,
  onReviewFlashSaleRegistration,
}) {
  const pendingRegistrations = flashSalesData?.stats?.pendingRegistrations || 0
  const activeEvents = flashSalesData?.stats?.activeEvents || flashSaleEvents.filter((eventItem) => eventItem.isActive).length
  const orderedRegistrations = [...flashSaleRegistrations].sort((left, right) => {
    if (left.status === right.status) return 0
    if (left.status === 'pending') return -1
    if (right.status === 'pending') return 1
    return 0
  })

  function updateField(field, value) {
    onFlashSaleFormChange((current) => ({ ...current, [field]: value }))
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
      <div className="border-b border-[#eaded2] bg-[#fffaf4] px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#15110d]">Flash Sale của sàn</h2>
            <p className="mt-1 max-w-3xl text-[12px] text-[#6b4d3e]">
              Admin tạo khung giờ, seller đăng ký sản phẩm và số lượng bán, sản phẩm được duyệt sẽ tự hiển thị đúng thời gian.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#995900] px-4 text-[12px] font-bold text-white hover:bg-[#7b4600]" type="button" onClick={onCreateFlashSaleClick}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tạo khung giờ
            </button>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white px-3 py-2">
              <p className="text-[18px] font-bold text-[#15110d]">{formatCount(flashSaleEvents.length)}</p>
              <p className="text-[10px] font-bold uppercase text-[#7b6556]">Khung giờ</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2">
              <p className="text-[18px] font-bold text-[#087c32]">{formatCount(activeEvents)}</p>
              <p className="text-[10px] font-bold uppercase text-[#7b6556]">Đang bật</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2">
              <p className="text-[18px] font-bold text-[#9a5700]">{formatCount(pendingRegistrations)}</p>
              <p className="text-[10px] font-bold uppercase text-[#7b6556]">Chờ duyệt</p>
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {creatingFlashSale ? (
          <AdminFormModal title="Tạo khung giờ flash sale" description="Thiết lập thời gian bán và thời gian seller đăng ký sản phẩm." onClose={onCloseFlashSaleModal}>
        <form className="rounded-lg border border-[#eaded2] bg-[#fbfaf9] p-4" onSubmit={onFlashSaleSubmit}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#c57900]">edit_calendar</span>
            <h3 className="text-[15px] font-bold text-[#15110d]">Tạo khung giờ</h3>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 sm:col-span-2">
              <span className="text-[11px] font-bold text-[#4b3527]">Tên chương trình</span>
              <input className="h-10 rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" value={flashSaleForm.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Flash Sale cuối tuần" required />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold text-[#4b3527]">Bắt đầu bán</span>
              <input className="h-10 rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="datetime-local" value={flashSaleForm.startsAt} onChange={(event) => updateField('startsAt', event.target.value)} required />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold text-[#4b3527]">Kết thúc bán</span>
              <input className="h-10 rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="datetime-local" value={flashSaleForm.endsAt} onChange={(event) => updateField('endsAt', event.target.value)} required />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold text-[#4b3527]">Mở đăng ký</span>
              <input className="h-10 rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="datetime-local" value={flashSaleForm.registrationStartsAt} onChange={(event) => updateField('registrationStartsAt', event.target.value)} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[11px] font-bold text-[#4b3527]">Đóng đăng ký</span>
              <input className="h-10 rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="datetime-local" value={flashSaleForm.registrationEndsAt} onChange={(event) => updateField('registrationEndsAt', event.target.value)} />
            </label>
            <label className="grid gap-1.5 sm:col-span-2">
              <span className="text-[11px] font-bold text-[#4b3527]">Mô tả</span>
              <textarea className="min-h-[78px] resize-y rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" value={flashSaleForm.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Ghi chú ngắn cho seller khi đăng ký." />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-[#dfc8b5] bg-white px-3 text-[12px] font-semibold text-[#4b3527]">
              <input className="rounded border-[#dfc8b5] text-[#c57900] focus:ring-[#c57900]" type="checkbox" checked={flashSaleForm.isActive} onChange={(event) => updateField('isActive', event.target.checked)} />
              Đang bật
            </label>
            <button className="h-10 rounded-lg bg-[#995900] px-4 text-[12px] font-bold text-white hover:bg-[#7b4600] disabled:opacity-60" type="submit" disabled={savingFlashSale}>
              {savingFlashSale ? 'Đang tạo...' : 'Tạo flash sale'}
            </button>
          </div>
        </form>
          </AdminFormModal>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[15px] font-bold text-[#15110d]">Khung giờ đã tạo</h3>
            <span className="rounded-full bg-[#fff2df] px-3 py-1 text-[10px] font-bold text-[#9a5700]">{formatCount(flashSaleEvents.length)} khung giờ</span>
          </div>
          <div className="max-h-[425px] space-y-3 overflow-y-auto pr-1">
            {flashSaleEvents.map((eventItem) => {
              const eventMeta = getAdminFlashSaleEventMeta(eventItem)
              const startsAt = formatDateTime(eventItem.startsAt)
              const endsAt = formatDateTime(eventItem.endsAt)

              return (
                <article key={eventItem.id} className="rounded-lg border border-[#eaded2] bg-white px-3 py-3 text-[12px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold text-[#1d1712]">{eventItem.name}</p>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${eventMeta.className}`}>{eventMeta.label}</span>
                      </div>
                      <p className="mt-1 text-[#7b6556]">
                        {startsAt.date} {startsAt.time} - {endsAt.date} {endsAt.time}
                      </p>
                      <p className="mt-1 text-[#7b6556]">
                        {formatCount(eventItem.approvedCount)} đã duyệt - {formatCount(eventItem.pendingCount)} chờ duyệt
                      </p>
                    </div>
                    <button className="shrink-0 rounded-md border border-[#dfc8b5] px-3 py-1 text-[11px] font-bold text-[#4b3527] hover:border-[#9a5700]" type="button" onClick={() => onToggleFlashSale(eventItem)}>
                      {eventItem.isActive ? 'Tắt' : 'Bật'}
                    </button>
                  </div>
                  {eventItem.description ? <p className="mt-2 rounded-md bg-[#fbfaf9] px-2 py-2 text-[#6b4d3e]">{eventItem.description}</p> : null}
                </article>
              )
            })}
            {!flashSaleEvents.length ? <p className="rounded-lg border border-dashed border-[#eaded2] px-3 py-8 text-center text-[12px] text-[#7b6556]">Chưa có khung giờ flash sale.</p> : null}
          </div>
        </div>
      </div>

      <div className="border-t border-[#eaded2] px-4 pb-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#15110d]">Sản phẩm seller đăng ký</h3>
            <p className="mt-0.5 text-[11px] text-[#7b6556]">Ưu tiên xử lý sản phẩm đang chờ duyệt để kịp lên flash sale.</p>
          </div>
          <span className="rounded-full bg-[#fff2df] px-3 py-1 text-[10px] font-bold text-[#9a5700]">
            {formatCount(orderedRegistrations.length)} đăng ký
          </span>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {orderedRegistrations.map((item) => {
            const statusMeta = getAdminFlashSaleRegistrationMeta(item.status)
            const isWorking = workingRegistrationId === item.id

            return (
              <article key={item.id} className="rounded-lg border border-[#eaded2] bg-[#fbfaf9] px-3 py-3 text-[12px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#1d1712]">{item.product?.name || 'Sản phẩm không xác định'}</p>
                    <p className="mt-1 text-[#7b6556]">{item.shop?.name || 'Shop'} - {item.eventName || `Khung giờ #${item.eventId}`}</p>
                    <p className="mt-1 font-semibold text-[#a15d00]">
                      {formatCurrency(item.salePrice)} - SL {formatCount(item.registeredStock)} - Đã bán {formatCount(item.soldCount)}
                    </p>
                    {item.rejectReason ? <p className="mt-1 text-[#b42318]">Lý do từ chối: {item.rejectReason}</p> : null}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${statusMeta.className}`}>{statusMeta.label}</span>
                </div>
                {item.status === 'pending' ? (
                  <div className="mt-3 flex justify-end gap-2">
                    <button className="rounded-md bg-[#087c32] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60" type="button" disabled={isWorking} onClick={() => onReviewFlashSaleRegistration(item, 'approve')}>
                      Duyệt
                    </button>
                    <button className="rounded-md bg-[#b42318] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60" type="button" disabled={isWorking} onClick={() => onReviewFlashSaleRegistration(item, 'reject')}>
                      Từ chối
                    </button>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>

        {!orderedRegistrations.length ? <p className="mt-3 rounded-lg border border-dashed border-[#eaded2] px-3 py-8 text-center text-[12px] text-[#7b6556]">Chưa có sản phẩm đăng ký flash sale.</p> : null}
      </div>
    </section>
  )
}

function AdminFlashSalesPanelV2({
  flashSalesData,
  flashSaleForm,
  flashSaleEvents,
  flashSaleRegistrations,
  savingFlashSale,
  workingRegistrationId,
  creatingFlashSale,
  onFlashSaleFormChange,
  onFlashSaleSubmit,
  onCreateFlashSaleClick,
  onCloseFlashSaleModal,
  onToggleFlashSale,
  onReviewFlashSaleRegistration,
}) {
  const [eventStatusFilter, setEventStatusFilter] = useState('all')
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState('all')
  const [activeEventId, setActiveEventId] = useState('')
  const [registrationKeyword, setRegistrationKeyword] = useState('')
  const pendingRegistrations = flashSalesData?.stats?.pendingRegistrations || 0
  const activeEvents = flashSalesData?.stats?.activeEvents || flashSaleEvents.filter((eventItem) => eventItem.isActive).length
  const eventStatusTabs = [
    { value: 'all', label: 'Tất cả', count: flashSaleEvents.length },
    { value: 'live', label: 'Đang chạy', count: flashSaleEvents.filter((eventItem) => getAdminFlashSaleEventStatus(eventItem) === 'live').length },
    { value: 'upcoming', label: 'Sắp tới', count: flashSaleEvents.filter((eventItem) => getAdminFlashSaleEventStatus(eventItem) === 'upcoming').length },
    { value: 'ended', label: 'Hết hạn', count: flashSaleEvents.filter((eventItem) => getAdminFlashSaleEventStatus(eventItem) === 'ended').length },
    { value: 'disabled', label: 'Tạm tắt', count: flashSaleEvents.filter((eventItem) => getAdminFlashSaleEventStatus(eventItem) === 'disabled').length },
  ]

  const filteredEvents = useMemo(
    () => flashSaleEvents.filter((eventItem) => eventStatusFilter === 'all' || getAdminFlashSaleEventStatus(eventItem) === eventStatusFilter),
    [eventStatusFilter, flashSaleEvents],
  )
  const selectedEvent = filteredEvents.find((eventItem) => String(eventItem.id) === String(activeEventId)) || filteredEvents[0] || null
  const selectedEventRegistrations = selectedEvent
    ? flashSaleRegistrations.filter((item) => Number(item.eventId) === Number(selectedEvent.id))
    : []
  const registrationStatusTabs = [
    { value: 'all', label: 'Tất cả', count: selectedEventRegistrations.length },
    { value: 'pending', label: 'Chờ duyệt', count: selectedEventRegistrations.filter((item) => item.status === 'pending').length },
    { value: 'approved', label: 'Đã duyệt', count: selectedEventRegistrations.filter((item) => item.status === 'approved').length },
    { value: 'rejected', label: 'Từ chối', count: selectedEventRegistrations.filter((item) => item.status === 'rejected').length },
  ]
  const visibleRegistrations = selectedEventRegistrations
    .filter((item) => registrationStatusFilter === 'all' || item.status === registrationStatusFilter)
    .filter((item) => {
      const keyword = registrationKeyword.trim().toLowerCase()
      if (!keyword) return true
      return `${item.product?.name || ''} ${item.shop?.name || ''} ${item.shop?.ownerEmail || ''}`.toLowerCase().includes(keyword)
    })
    .sort((left, right) => {
      if (left.status === right.status) return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
      if (left.status === 'pending') return -1
      if (right.status === 'pending') return 1
      return 0
    })

  function updateField(field, value) {
    onFlashSaleFormChange((current) => ({ ...current, [field]: value }))
  }

  function selectEvent(eventId) {
    setActiveEventId(String(eventId))
    setRegistrationStatusFilter('all')
    setRegistrationKeyword('')
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
      <div className="border-b border-[#eaded2] bg-[#fffaf4] px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#15110d]">Flash Sale của sàn</h2>
            <p className="mt-1 max-w-3xl text-[12px] text-[#6b4d3e]">
              Chọn từng khung giờ để duyệt sản phẩm đăng ký riêng, tránh trộn lẫn giữa khung giờ mới, đang chạy và đã hết hạn.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#995900] px-4 text-[12px] font-bold text-white hover:bg-[#7b4600]" type="button" onClick={onCreateFlashSaleClick}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tạo khung giờ
            </button>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white px-3 py-2">
                <p className="text-[18px] font-bold text-[#15110d]">{formatCount(flashSaleEvents.length)}</p>
                <p className="text-[10px] font-bold uppercase text-[#7b6556]">Khung giờ</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2">
                <p className="text-[18px] font-bold text-[#087c32]">{formatCount(activeEvents)}</p>
                <p className="text-[10px] font-bold uppercase text-[#7b6556]">Đang bật</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2">
                <p className="text-[18px] font-bold text-[#9a5700]">{formatCount(pendingRegistrations)}</p>
                <p className="text-[10px] font-bold uppercase text-[#7b6556]">Chờ duyệt</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {creatingFlashSale ? (
        <AdminFormModal title="Tạo khung giờ flash sale" description="Thiết lập thời gian bán và thời gian seller đăng ký sản phẩm." onClose={onCloseFlashSaleModal}>
          <form className="rounded-lg border border-[#eaded2] bg-[#fbfaf9] p-4" onSubmit={onFlashSaleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-[11px] font-bold text-[#4b3527]">Tên chương trình</span>
                <input className="h-10 rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" value={flashSaleForm.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Flash Sale cuối tuần" required />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[11px] font-bold text-[#4b3527]">Bắt đầu bán</span>
                <input className="h-10 rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="datetime-local" value={flashSaleForm.startsAt} onChange={(event) => updateField('startsAt', event.target.value)} required />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[11px] font-bold text-[#4b3527]">Kết thúc bán</span>
                <input className="h-10 rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="datetime-local" value={flashSaleForm.endsAt} onChange={(event) => updateField('endsAt', event.target.value)} required />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[11px] font-bold text-[#4b3527]">Mở đăng ký</span>
                <input className="h-10 rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="datetime-local" value={flashSaleForm.registrationStartsAt} onChange={(event) => updateField('registrationStartsAt', event.target.value)} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[11px] font-bold text-[#4b3527]">Đóng đăng ký</span>
                <input className="h-10 rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="datetime-local" value={flashSaleForm.registrationEndsAt} onChange={(event) => updateField('registrationEndsAt', event.target.value)} />
              </label>
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-[11px] font-bold text-[#4b3527]">Mô tả</span>
                <textarea className="min-h-[78px] resize-y rounded-lg border-[#dfc8b5] bg-white text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" value={flashSaleForm.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Ghi chú ngắn cho seller khi đăng ký." />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="flex h-10 items-center gap-2 rounded-lg border border-[#dfc8b5] bg-white px-3 text-[12px] font-semibold text-[#4b3527]">
                <input className="rounded border-[#dfc8b5] text-[#c57900] focus:ring-[#c57900]" type="checkbox" checked={flashSaleForm.isActive} onChange={(event) => updateField('isActive', event.target.checked)} />
                Đang bật
              </label>
              <button className="h-10 rounded-lg bg-[#995900] px-4 text-[12px] font-bold text-white hover:bg-[#7b4600] disabled:opacity-60" type="submit" disabled={savingFlashSale}>
                {savingFlashSale ? 'Đang tạo...' : 'Tạo flash sale'}
              </button>
            </div>
          </form>
        </AdminFormModal>
      ) : null}

      <div className="grid gap-4 p-4 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-lg border border-[#eaded2] bg-[#fbfaf9]">
          <div className="border-b border-[#eaded2] p-3">
            <h3 className="text-[14px] font-bold text-[#15110d]">Khung giờ</h3>
            <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
              {eventStatusTabs.map((tab) => (
                <button
                  key={tab.value}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${eventStatusFilter === tab.value ? 'bg-[#995900] text-white' : 'bg-white text-[#5f5148] hover:text-[#995900]'}`}
                  type="button"
                  onClick={() => {
                    setEventStatusFilter(tab.value)
                    setActiveEventId('')
                    setRegistrationStatusFilter('all')
                  }}
                >
                  {tab.label} ({formatCount(tab.count)})
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[620px] overflow-y-auto p-2">
            {filteredEvents.map((eventItem) => {
              const eventMeta = getAdminFlashSaleEventMeta(eventItem)
              const startsAt = formatDateTime(eventItem.startsAt)
              const endsAt = formatDateTime(eventItem.endsAt)
              const selected = selectedEvent && Number(selectedEvent.id) === Number(eventItem.id)

              return (
                <button
                  key={eventItem.id}
                  className={`mb-2 w-full rounded-lg border px-3 py-3 text-left text-[12px] transition ${selected ? 'border-[#995900] bg-white shadow-sm' : 'border-transparent bg-white hover:border-[#dfc8b5]'}`}
                  type="button"
                  onClick={() => selectEvent(eventItem.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate font-bold text-[#1d1712]">{eventItem.name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${eventMeta.className}`}>{eventMeta.label}</span>
                  </div>
                  <p className="mt-2 text-[#7b6556]">{startsAt.date} {startsAt.time}</p>
                  <p className="text-[#7b6556]">đến {endsAt.date} {endsAt.time}</p>
                  <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                    <span className="rounded-md bg-[#fff2df] px-2 py-1 text-[10px] font-bold text-[#9a5700]">{formatCount(eventItem.registrationCount)} đơn</span>
                    <span className="rounded-md bg-[#d9f7df] px-2 py-1 text-[10px] font-bold text-[#087c32]">{formatCount(eventItem.approvedCount)} duyệt</span>
                    <span className="rounded-md bg-[#fff1cc] px-2 py-1 text-[10px] font-bold text-[#9a5a00]">{formatCount(eventItem.pendingCount)} chờ</span>
                  </div>
                </button>
              )
            })}
            {!filteredEvents.length ? <p className="rounded-lg border border-dashed border-[#eaded2] bg-white px-3 py-8 text-center text-[12px] text-[#7b6556]">Không có khung giờ phù hợp.</p> : null}
          </div>
        </aside>

        <div className="min-w-0 rounded-lg border border-[#eaded2] bg-white">
          {selectedEvent ? (
            <>
              <div className="border-b border-[#eaded2] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-[17px] font-bold text-[#15110d]">{selectedEvent.name}</h3>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${getAdminFlashSaleEventMeta(selectedEvent).className}`}>{getAdminFlashSaleEventMeta(selectedEvent).label}</span>
                    </div>
                    <p className="mt-1 text-[12px] text-[#7b6556]">
                      {formatDateTime(selectedEvent.startsAt).date} {formatDateTime(selectedEvent.startsAt).time} - {formatDateTime(selectedEvent.endsAt).date} {formatDateTime(selectedEvent.endsAt).time}
                    </p>
                    {selectedEvent.description ? <p className="mt-2 text-[12px] leading-5 text-[#6b4d3e]">{selectedEvent.description}</p> : null}
                  </div>
                  <button className="h-9 rounded-lg border border-[#dfc8b5] px-3 text-[12px] font-bold text-[#4b3527] hover:border-[#9a5700]" type="button" onClick={() => onToggleFlashSale(selectedEvent)}>
                    {selectedEvent.isActive ? 'Tắt khung giờ' : 'Bật khung giờ'}
                  </button>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-[#fbfaf9] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[#7b6556]">Tổng đăng ký</p>
                    <p className="mt-1 text-[18px] font-bold text-[#15110d]">{formatCount(selectedEvent.registrationCount)}</p>
                  </div>
                  <div className="rounded-lg bg-[#fbfaf9] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[#7b6556]">Chờ duyệt</p>
                    <p className="mt-1 text-[18px] font-bold text-[#9a5700]">{formatCount(selectedEvent.pendingCount)}</p>
                  </div>
                  <div className="rounded-lg bg-[#fbfaf9] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[#7b6556]">Đã duyệt</p>
                    <p className="mt-1 text-[18px] font-bold text-[#087c32]">{formatCount(selectedEvent.approvedCount)}</p>
                  </div>
                  <div className="rounded-lg bg-[#fbfaf9] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[#7b6556]">Hiển thị</p>
                    <p className="mt-1 text-[18px] font-bold text-[#15110d]">{selectedEvent.isActive ? 'Có' : 'Không'}</p>
                  </div>
                </div>
              </div>
              <div className="border-b border-[#eaded2] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {registrationStatusTabs.map((tab) => (
                      <button
                        key={tab.value}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${registrationStatusFilter === tab.value ? 'bg-[#995900] text-white' : 'bg-[#f3f1ed] text-[#5f5148] hover:text-[#995900]'}`}
                        type="button"
                        onClick={() => setRegistrationStatusFilter(tab.value)}
                      >
                        {tab.label} ({formatCount(tab.count)})
                      </button>
                    ))}
                  </div>
                  <label className="relative flex h-9 min-w-[220px] items-center">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[17px] text-[#7b6556]">search</span>
                    <input
                      className="h-9 w-full rounded-lg border-[#dfc8b5] bg-[#fbfaf9] pl-9 pr-3 text-[12px] focus:border-[#c98225] focus:ring-0"
                      value={registrationKeyword}
                      onChange={(event) => setRegistrationKeyword(event.target.value)}
                      placeholder="Tìm sản phẩm, shop..."
                    />
                  </label>
                </div>
              </div>
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[860px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#eeeeed]">
                    <tr className="h-11 text-[10px] font-bold uppercase text-[#4b3527]">
                      <th className="px-4">Sản phẩm</th>
                      <th className="px-4">Shop</th>
                      <th className="px-4">Giá sale</th>
                      <th className="px-4">Số lượng</th>
                      <th className="px-4">Trạng thái</th>
                      <th className="px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRegistrations.map((item) => {
                      const statusMeta = getAdminFlashSaleRegistrationMeta(item.status)
                      const isWorking = workingRegistrationId === item.id

                      return (
                        <tr key={item.id} className="border-t border-[#f0e7df] text-[12px] text-[#17120e]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img className="h-11 w-11 shrink-0 rounded-lg bg-[#f3f1ed] object-cover" src={apiAssetUrl(item.product?.thumbnailUrl)} alt="" />
                              <div className="min-w-0">
                                <p className="truncate font-bold text-[#1d1712]">{item.product?.name || 'Sản phẩm không xác định'}</p>
                                <p className="mt-0.5 text-[10px] text-[#7b6556]">Giá gốc {formatCurrency(item.product?.price || 0)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold">{item.shop?.name || 'Shop'}</p>
                            <p className="mt-0.5 text-[10px] text-[#7b6556]">{item.shop?.ownerEmail || item.shop?.ownerName || ''}</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-[#a15d00]">{formatCurrency(item.salePrice)}</td>
                          <td className="px-4 py-3">
                            <p>{formatCount(item.soldCount)} / {formatCount(item.registeredStock)}</p>
                            <p className="mt-0.5 text-[10px] text-[#7b6556]">Tồn kho {formatCount(item.product?.stock || 0)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${statusMeta.className}`}>{statusMeta.label}</span>
                            {item.rejectReason ? <p className="mt-1 max-w-[220px] text-[10px] text-[#b42318]">{item.rejectReason}</p> : null}
                          </td>
                          <td className="px-4 py-3">
                            {item.status === 'pending' ? (
                              <div className="flex justify-center gap-2">
                                <button className="rounded-md bg-[#087c32] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60" type="button" disabled={isWorking} onClick={() => onReviewFlashSaleRegistration(item, 'approve')}>
                                  Duyệt
                                </button>
                                <button className="rounded-md bg-[#b42318] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60" type="button" disabled={isWorking} onClick={() => onReviewFlashSaleRegistration(item, 'reject')}>
                                  Từ chối
                                </button>
                              </div>
                            ) : (
                              <p className="text-center text-[11px] text-[#7b6556]">Đã xử lý</p>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {!visibleRegistrations.length ? <p className="border-t border-[#f0e7df] px-4 py-10 text-center text-[13px] text-[#6e5c51]">Không có đăng ký phù hợp trong khung giờ này.</p> : null}
              </div>
            </>
          ) : (
            <div className="flex min-h-[360px] items-center justify-center px-4 py-12 text-center">
              <div>
                <span className="material-symbols-outlined text-[44px] text-[#c57900]">event_busy</span>
                <h3 className="mt-3 text-[17px] font-bold text-[#15110d]">Chưa có khung giờ</h3>
                <p className="mt-1 max-w-sm text-[12px] leading-5 text-[#7b6556]">Tạo khung giờ flash sale mới để seller bắt đầu đăng ký sản phẩm.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function PromotionsDashboard({ searchTerm, promotionsData, flashSalesData, onPromotionsDataChange, onFlashSalesDataChange }) {
  const [activePromotionTab, setActivePromotionTab] = useState('vouchers')
  const [activeScope, setActiveScope] = useState('all')
  const [voucherForm, setVoucherForm] = useState(emptyVoucherForm)
  const [editingVoucherId, setEditingVoucherId] = useState(null)
  const [voucherModalOpen, setVoucherModalOpen] = useState(false)
  const [savingVoucher, setSavingVoucher] = useState(false)
  const [workingVoucherId, setWorkingVoucherId] = useState(null)
  const [flashSaleForm, setFlashSaleForm] = useState(emptyFlashSaleForm)
  const [flashSaleModalOpen, setFlashSaleModalOpen] = useState(false)
  const [savingFlashSale, setSavingFlashSale] = useState(false)
  const [workingRegistrationId, setWorkingRegistrationId] = useState(null)
  const vouchers = useMemo(() => promotionsData?.items || [], [promotionsData])
  const flashSaleEvents = flashSalesData?.events || []
  const flashSaleRegistrations = flashSalesData?.registrations || []
  const shops = promotionsData?.shops || []
  const scopeTabs = [
    { value: 'all', label: 'Tất cả', count: promotionsData?.stats?.total || 0 },
    { value: 'platform', label: 'Voucher sàn', count: promotionsData?.stats?.platform || 0 },
    { value: 'shop', label: 'Voucher shop', count: promotionsData?.stats?.shop || 0 },
    { value: 'active', label: 'Đang bật', count: promotionsData?.stats?.active || 0 },
    { value: 'inactive', label: 'Tạm tắt', count: promotionsData?.stats?.inactive || 0 },
  ]

  const filteredVouchers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return vouchers.filter((voucher) => {
      const matchesScope =
        activeScope === 'all' ||
        voucher.scope === activeScope ||
        (activeScope === 'active' && voucher.isActive) ||
        (activeScope === 'inactive' && !voucher.isActive)
      const haystack = `${voucher.code} ${voucher.title} ${voucher.scope} ${voucher.shopName}`.toLowerCase()
      const matchesSearch = !keyword || haystack.includes(keyword)

      return matchesScope && matchesSearch
    })
  }, [activeScope, searchTerm, vouchers])

  function resetVoucherForm() {
    setEditingVoucherId(null)
    setVoucherForm(emptyVoucherForm)
  }

  function openVoucherModal() {
    resetVoucherForm()
    setVoucherModalOpen(true)
  }

  function closeVoucherModal() {
    if (savingVoucher) return
    resetVoucherForm()
    setVoucherModalOpen(false)
  }

  function openFlashSaleModal() {
    setFlashSaleForm(emptyFlashSaleForm)
    setFlashSaleModalOpen(true)
  }

  function closeFlashSaleModal() {
    if (savingFlashSale) return
    setFlashSaleForm(emptyFlashSaleForm)
    setFlashSaleModalOpen(false)
  }

  function updateVoucherField(field, value) {
    setVoucherForm((current) => {
      const next = { ...current, [field]: value }
      if (field === 'scope' && value === 'platform') next.shopId = ''
      if (field === 'discountType' && value === 'free_shipping' && !next.discountValue) next.discountValue = '0'
      return next
    })
  }

  function editVoucher(voucher) {
    setEditingVoucherId(voucher.id)
    setVoucherModalOpen(true)
    setVoucherForm({
      code: voucher.code || '',
      title: voucher.title || '',
      scope: voucher.scope || 'platform',
      shopId: voucher.shopId ? String(voucher.shopId) : '',
      discountType: voucher.discountType || 'fixed',
      discountValue: String(voucher.discountValue ?? ''),
      maxDiscountAmount: voucher.maxDiscountAmount === '' ? '' : String(voucher.maxDiscountAmount ?? ''),
      minOrderAmount: String(voucher.minOrderAmount ?? 0),
      usageLimit: voucher.usageLimit === '' ? '' : String(voucher.usageLimit ?? ''),
      perUserLimit: voucher.perUserLimit === '' ? '' : String(voucher.perUserLimit ?? ''),
      startsAt: toDateTimeLocal(voucher.startsAt),
      endsAt: toDateTimeLocal(voucher.endsAt),
      isActive: Boolean(voucher.isActive),
    })
  }

  async function handleVoucherSubmit(event) {
    event.preventDefault()
    if (voucherForm.startsAt && voucherForm.endsAt && new Date(voucherForm.startsAt).getTime() >= new Date(voucherForm.endsAt).getTime()) {
      toast.error('Thời gian kết thúc voucher phải lớn hơn thời gian bắt đầu.')
      return
    }
    setSavingVoucher(true)

    const payload = {
      ...voucherForm,
      code: normalizeVoucherCodeInput(voucherForm.code),
      shopId: voucherForm.scope === 'shop' ? voucherForm.shopId : null,
    }

    try {
      const nextData = editingVoucherId
        ? await updateAdminVoucher(editingVoucherId, payload)
        : await createAdminVoucher(payload)
      onPromotionsDataChange(nextData)
      resetVoucherForm()
      setVoucherModalOpen(false)
      toast.success(editingVoucherId ? 'Đã cập nhật voucher.' : 'Đã tạo voucher.')
    } catch (err) {
      toast.error(err.message || 'Không lưu được voucher.')
    } finally {
      setSavingVoucher(false)
    }
  }

  async function handleToggleVoucher(voucher) {
    setWorkingVoucherId(voucher.id)

    try {
      const nextData = await updateAdminVoucher(voucher.id, { isActive: !voucher.isActive })
      onPromotionsDataChange(nextData)
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
      const nextData = await deleteAdminVoucher(voucher.id)
      onPromotionsDataChange(nextData)
      if (Number(editingVoucherId) === Number(voucher.id)) resetVoucherForm()
      toast.success('Đã xóa voucher.')
    } catch (err) {
      toast.error(err.message || 'Không xóa được voucher.')
    } finally {
      setWorkingVoucherId(null)
    }
  }

  async function handleFlashSaleSubmit(event) {
    event.preventDefault()
    setSavingFlashSale(true)
    try {
      const nextData = await createAdminFlashSale(flashSaleForm)
      onFlashSalesDataChange(nextData)
      setFlashSaleForm(emptyFlashSaleForm)
      setFlashSaleModalOpen(false)
      toast.success('Đã tạo khung giờ flash sale.')
    } catch (err) {
      toast.error(err.message || 'Không tạo được flash sale.')
    } finally {
      setSavingFlashSale(false)
    }
  }

  async function handleToggleFlashSale(eventItem) {
    try {
      const nextData = await updateAdminFlashSale(eventItem.id, { isActive: !eventItem.isActive })
      onFlashSalesDataChange(nextData)
      toast.success('Đã cập nhật flash sale.')
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được flash sale.')
    }
  }

  async function handleReviewFlashSaleRegistration(item, action) {
    const rejectReason = action === 'reject' ? window.prompt('Lý do từ chối đăng ký flash sale?', 'Giá hoặc số lượng chưa phù hợp') : ''
    if (action === 'reject' && rejectReason === null) return
    setWorkingRegistrationId(item.id)
    try {
      const nextData = await reviewAdminFlashSaleRegistration(item.id, { action, rejectReason })
      onFlashSalesDataChange(nextData)
      toast.success(action === 'approve' ? 'Đã duyệt sản phẩm flash sale.' : 'Đã từ chối đăng ký.')
    } catch (err) {
      toast.error(err.message || 'Không xử lý được đăng ký.')
    } finally {
      setWorkingRegistrationId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold leading-8 text-[#15110d]">Khuyến mãi và voucher</h1>
          <p className="mt-1 text-[12px] text-[#6b4d3e]">
            Quản lý voucher sàn và voucher của từng shop. Voucher shop sẽ trừ vào doanh thu shop, voucher sàn chỉ trừ tổng thanh toán của khách.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetricCard stat={{ label: 'Tổng voucher', value: formatCount(promotionsData?.stats?.total || 0), icon: 'local_offer', change: 'Tất cả', iconClass: 'bg-[#fff2df] text-[#d47b00]' }} />
        <OverviewMetricCard stat={{ label: 'Đang bật', value: formatCount(promotionsData?.stats?.active || 0), icon: 'toggle_on', change: 'Active', iconClass: 'bg-[#e8fff5] text-[#047857]' }} />
        <OverviewMetricCard stat={{ label: 'Voucher sàn', value: formatCount(promotionsData?.stats?.platform || 0), icon: 'store', change: 'Platform', iconClass: 'bg-[#e8f0ff] text-[#2f6bf2]' }} />
        <OverviewMetricCard stat={{ label: 'Voucher shop', value: formatCount(promotionsData?.stats?.shop || 0), icon: 'storefront', change: 'Shop', iconClass: 'bg-[#f3e8ff] text-[#8c38d8]' }} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#eaded2] bg-white p-3 shadow-sm">
        <div className="flex overflow-hidden rounded-lg bg-[#f3f1ed] p-1">
          {[
            { value: 'vouchers', label: 'Voucher', icon: 'local_offer' },
            { value: 'flashSales', label: 'Flash sales', icon: 'bolt' },
          ].map((tab) => (
            <button
              key={tab.value}
              className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-[12px] font-bold transition ${activePromotionTab === tab.value ? 'bg-white text-[#995900] shadow-sm' : 'text-[#4b3527] hover:text-[#995900]'}`}
              type="button"
              onClick={() => setActivePromotionTab(tab.value)}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        {activePromotionTab === 'vouchers' ? (
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#995900] px-4 text-[12px] font-bold text-white hover:bg-[#7b4600]" type="button" onClick={openVoucherModal}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm voucher
          </button>
        ) : null}
      </div>

      {voucherModalOpen ? (
        <AdminFormModal title={editingVoucherId ? 'Cập nhật voucher' : 'Thêm voucher'} description="Nhập thông tin mã giảm giá và điều kiện áp dụng." onClose={closeVoucherModal}>
      <section className="rounded-lg border border-[#eaded2] bg-white p-4 shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
        <form className="grid gap-3 xl:grid-cols-4" onSubmit={handleVoucherSubmit}>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Ma voucher</span>
            <input className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] uppercase text-[#1d1712] focus:border-[#c98225] focus:ring-0" value={voucherForm.code} onChange={(event) => updateVoucherField('code', normalizeVoucherCodeInput(event.target.value))} placeholder="SHOPBEE50" required />
          </label>
          <label className="grid gap-1.5 xl:col-span-2">
            <span className="text-[11px] font-bold text-[#4b3527]">Ten chuong trinh</span>
            <input className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" value={voucherForm.title} onChange={(event) => updateVoucherField('title', event.target.value)} placeholder="Giảm giá khai trương" required />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Pham vi</span>
            <select className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" value={voucherForm.scope} onChange={(event) => updateVoucherField('scope', event.target.value)}>
              <option value="platform">Voucher sàn</option>
              <option value="shop">Voucher cửa hàng</option>
            </select>
          </label>
          {voucherForm.scope === 'shop' ? (
            <label className="grid gap-1.5 xl:col-span-2">
              <span className="text-[11px] font-bold text-[#4b3527]">Shop ap dung</span>
              <select className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" value={voucherForm.shopId} onChange={(event) => updateVoucherField('shopId', event.target.value)} required>
                <option value="">Chon shop</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Kiểu giảm</span>
            <select className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" value={voucherForm.discountType} onChange={(event) => updateVoucherField('discountType', event.target.value)}>
              <option value="fixed">Giảm tiền</option>
              <option value="percent">Giảm %</option>
              <option value="free_shipping">Miễn phí ship</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Giá trị</span>
            <input className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="number" min="0" value={voucherForm.discountValue} onChange={(event) => updateVoucherField('discountValue', event.target.value)} placeholder={voucherForm.discountType === 'percent' ? '10' : '50000'} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Giảm tối đa</span>
            <input className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="number" min="0" value={voucherForm.maxDiscountAmount} onChange={(event) => updateVoucherField('maxDiscountAmount', event.target.value)} placeholder="Bỏ trống nếu không giới hạn" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Đơn tối thiểu</span>
            <input className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="number" min="0" value={voucherForm.minOrderAmount} onChange={(event) => updateVoucherField('minOrderAmount', event.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Tổng lượt</span>
            <input className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="number" min="1" value={voucherForm.usageLimit} onChange={(event) => updateVoucherField('usageLimit', event.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Mỗi người</span>
            <input className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="number" min="1" value={voucherForm.perUserLimit} onChange={(event) => updateVoucherField('perUserLimit', event.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Bat dau</span>
            <input className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="datetime-local" value={voucherForm.startsAt} onChange={(event) => updateVoucherField('startsAt', event.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold text-[#4b3527]">Ket thuc</span>
            <input className="h-10 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] text-[#1d1712] focus:border-[#c98225] focus:ring-0" type="datetime-local" value={voucherForm.endsAt} onChange={(event) => updateVoucherField('endsAt', event.target.value)} />
          </label>
          <div className="flex items-end gap-2">
            <label className="flex h-10 items-center gap-2 rounded-lg border border-[#dfc8b5] bg-[#fbfaf9] px-3 text-[12px] font-semibold text-[#4b3527]">
              <input className="rounded border-[#dfc8b5] text-[#c57900] focus:ring-[#c57900]" type="checkbox" checked={voucherForm.isActive} onChange={(event) => updateVoucherField('isActive', event.target.checked)} />
              Bat
            </label>
            <button className="h-10 rounded-lg bg-[#995900] px-4 text-[12px] font-bold text-white hover:bg-[#7b4600] disabled:opacity-60" type="submit" disabled={savingVoucher}>
              {savingVoucher ? 'Đang lưu...' : editingVoucherId ? 'Cập nhật' : 'Thêm'}
            </button>
            {editingVoucherId ? (
              <button className="h-10 rounded-lg border border-[#bba795] px-3 text-[12px] font-bold text-[#4e3d31] hover:border-[#9a5700]" type="button" onClick={closeVoucherModal}>
                Hủy
              </button>
            ) : null}
          </div>
        </form>
      </section>
        </AdminFormModal>
      ) : null}

      {activePromotionTab === 'vouchers' ? (
      <section className="overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
        <div className="flex min-h-12 overflow-x-auto border-b border-[#eaded2]">
          {scopeTabs.map((tab) => (
            <button key={tab.value} className={`relative min-w-max px-5 text-[12px] font-medium transition-colors ${activeScope === tab.value ? 'text-[#a15d00]' : 'text-[#34261b] hover:text-[#a15d00]'}`} type="button" onClick={() => setActiveScope(tab.value)}>
              {tab.label} ({formatCount(tab.count)})
              {activeScope === tab.value ? <span className="absolute inset-x-0 bottom-0 h-px bg-[#a15d00]" /> : null}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead>
              <tr className="h-12 bg-[#eeeeed] text-[10px] font-bold uppercase text-[#4b3527]">
                <th className="px-4">Voucher</th>
                <th className="px-4">Pham vi</th>
                <th className="px-4">Giảm giá</th>
                <th className="px-4">Dieu kien</th>
                <th className="px-4">Luot dung</th>
                <th className="px-4">Thoi gian</th>
                <th className="px-4">Trạng thái</th>
                <th className="px-4 text-center">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.map((voucher) => {
                const isWorking = workingVoucherId === voucher.id
                return (
                  <tr key={voucher.id} className="border-t border-[#f0e7df] text-[12px] text-[#17120e]">
                    <td className="px-4 py-4">
                      <p className="font-bold text-[#1d1712]">{voucher.code}</p>
                      <p className="mt-0.5 text-[10px] text-[#7b6556]">{voucher.title}</p>
                    </td>
                    <td className="px-4 py-4">{voucher.scope === 'shop' ? voucher.shopName || `Shop #${voucher.shopId}` : 'Toàn sàn'}</td>
                    <td className="px-4 py-4 font-semibold">{voucherDiscountText(voucher)}</td>
                    <td className="px-4 py-4">Tu {formatCurrency(voucher.minOrderAmount)}</td>
                    <td className="px-4 py-4">{formatCount(voucher.usedCount)} / {voucher.usageLimit || '∞'}</td>
                    <td className="px-4 py-4">
                      <p>{voucher.startsAt ? formatDateTime(voucher.startsAt).date : 'Không giới hạn'}</p>
                      <p className="text-[10px] text-[#6e5c51]">{voucher.endsAt ? `đến ${formatDateTime(voucher.endsAt).date}` : ''}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${voucher.isActive ? 'bg-[#d9f7df] text-[#087c32]' : 'bg-[#ffdcd6] text-[#b42318]'}`}>
                        {voucher.isActive ? 'Đang bật' : 'Tạm tắt'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-1">
                        <IconButton icon="edit" label="Sửa voucher" disabled={isWorking} onClick={() => editVoucher(voucher)} />
                        <IconButton icon={voucher.isActive ? 'toggle_off' : 'toggle_on'} label={voucher.isActive ? 'Tắt voucher' : 'Bật voucher'} disabled={isWorking} onClick={() => handleToggleVoucher(voucher)} />
                        <IconButton icon="delete" label="Xóa voucher" disabled={isWorking} onClick={() => handleDeleteVoucher(voucher)} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!filteredVouchers.length ? (
          <div className="border-t border-[#f0e7df] px-4 py-10 text-center text-[13px] text-[#6e5c51]">
            Không tìm thấy voucher phù hợp.
          </div>
        ) : null}
      </section>
      ) : null}

      {activePromotionTab === 'flashSales' ? (
      <AdminFlashSalesPanelV2
        flashSalesData={flashSalesData}
        flashSaleForm={flashSaleForm}
        flashSaleEvents={flashSaleEvents}
        flashSaleRegistrations={flashSaleRegistrations}
        savingFlashSale={savingFlashSale}
        workingRegistrationId={workingRegistrationId}
        creatingFlashSale={flashSaleModalOpen}
        onFlashSaleFormChange={setFlashSaleForm}
        onFlashSaleSubmit={handleFlashSaleSubmit}
        onCreateFlashSaleClick={openFlashSaleModal}
        onCloseFlashSaleModal={closeFlashSaleModal}
        onToggleFlashSale={handleToggleFlashSale}
        onReviewFlashSaleRegistration={handleReviewFlashSaleRegistration}
      />
      ) : null}
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
