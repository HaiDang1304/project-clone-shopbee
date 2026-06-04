import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import {
  deleteAdminUser,
  getAccountProfile,
  getAdminDashboardData,
  getAdminShopsData,
  getAdminUsersData,
  updateAdminUser,
} from '../../lib/account'
import { apiAssetUrl } from '../../lib/api'
import { getAuthUser } from '../../lib/auth'

const adminNavItems = [
  { value: 'dashboard', icon: 'grid_view', label: 'Dashboard' },
  { value: 'users', icon: 'groups', label: 'Quản trị người dùng' },
  { value: 'shops', icon: 'storefront', label: 'Quản lý cửa hàng' },
  { value: 'categories', icon: 'category', label: 'Quản trị danh mục' },
  { value: 'products', icon: 'inventory_2', label: 'Quản trị sản phẩm' },
  { value: 'orders', icon: 'shopping_cart', label: 'Quản trị đơn hàng' },
  { value: 'comments', icon: 'rate_review', label: 'Quản lý bình luận' },
  { value: 'promotions', icon: 'local_offer', label: 'Khuyến mãi' },
  { value: 'shipping', icon: 'local_shipping', label: 'Vận chuyển' },
  { value: 'reports', icon: 'bar_chart', label: 'Thống kê báo cáo' },
]

const defaultOrderTabs = [
  { value: 'all', label: 'Tất cả', count: 1240 },
  { value: 'pending', label: 'Chờ xác nhận', count: 45 },
  { value: 'processing', label: 'Đang xử lý', count: 12 },
  { value: 'shipping', label: 'Đang giao', count: 88 },
  { value: 'delivered', label: 'Đã giao', count: 1020 },
  { value: 'cancelled', label: 'Đã hủy', count: 75 },
]

const defaultOrders = [
  {
    id: 'SB-9241',
    customer: 'Nguyễn Văn Hùng',
    initials: 'NH',
    phone: '0982-xxx-xxx',
    store: 'Bee Electronics',
    date: '12/05/2024',
    time: '14:30',
    total: '2,450,000đ',
    status: 'pending',
    statusLabel: 'Chờ xác nhận',
    avatarClass: 'bg-[#e9e3df] text-[#755f55]',
  },
  {
    id: 'SB-9240',
    customer: 'Trần Lan Anh',
    initials: 'TL',
    phone: '0915-xxx-xxx',
    store: 'Fashion Hub',
    date: '12/05/2024',
    time: '10:15',
    total: '890,000đ',
    status: 'shipping',
    statusLabel: 'Đang giao',
    avatarClass: 'bg-[#ffb36a] text-[#7b3600]',
  },
  {
    id: 'SB-9238',
    customer: 'Quốc Trung',
    initials: 'QT',
    phone: '0342-xxx-xxx',
    store: 'Home Decors',
    date: '11/05/2024',
    time: '21:00',
    total: '5,200,000đ',
    status: 'delivered',
    statusLabel: 'Đã giao',
    avatarClass: 'bg-[#f1f1f1] text-[#4b4b4b]',
  },
  {
    id: 'SB-9235',
    customer: 'Minh Hoàng',
    initials: 'MH',
    phone: '0888-xxx-xxx',
    store: 'Bee Electronics',
    date: '11/05/2024',
    time: '16:45',
    total: '120,000đ',
    status: 'cancelled',
    statusLabel: 'Đã hủy',
    avatarClass: 'bg-[#ffe0df] text-[#be2420]',
  },
]

const defaultOverviewStats = [
  {
    label: 'Tổng doanh thu (tháng)',
    value: '1.240.500.000đ',
    icon: 'payments',
    change: '+12%',
    iconClass: 'bg-[#fff2df] text-[#d47b00]',
  },
  {
    label: 'Số đơn hàng mới',
    value: '3,456',
    icon: 'shopping_bag',
    change: '+8%',
    iconClass: 'bg-[#e8f0ff] text-[#2f6bf2]',
  },
  {
    label: 'Người dùng mới',
    value: '892',
    icon: 'person',
    change: '+2%',
    iconClass: 'bg-[#f3e8ff] text-[#9d4edd]',
  },
  {
    label: 'Cửa hàng chờ duyệt',
    value: '12',
    icon: 'storefront',
    change: 'Cần duyệt',
    iconClass: 'bg-[#fff0e7] text-[#e5791f]',
  },
]

const defaultRevenueTrend = [
  { day: 'Thứ 2', value: 0 },
  { day: 'Thứ 3', value: 0 },
  { day: 'Thứ 4', value: 0 },
  { day: 'Hôm nay', value: 0 },
  { day: 'Thứ 6', value: 0 },
  { day: 'Thứ 7', value: 0 },
  { day: 'CN', value: 0 },
]

const systemNotifications = [
  {
    icon: 'campaign',
    title: 'Khuyến mãi mới đã kích hoạt',
    description: 'Chiến dịch "Hè rực rỡ" đã lên sóng.',
    time: '1 giờ trước',
    accent: '#c57900',
  },
  {
    icon: 'info',
    title: 'Cập nhật API v2.1',
    description: 'Tối ưu API mã đơn được cập nhật cho dev.',
    time: '3 giờ trước',
    accent: '#69625d',
  },
]

const defaultPendingShops = [
  {
    id: 'GT',
    name: 'Gia Dụng Thông Minh',
    owner: 'Nguyễn Văn An',
    category: 'Điện tử',
    date: '14/10/2023',
    colorClass: 'bg-[#fff2df] text-[#c57900]',
  },
  {
    id: 'BC',
    name: 'Bee Coffee Roasters',
    owner: 'Trần Thị Bình',
    category: 'Thực phẩm',
    date: '15/10/2023',
    colorClass: 'bg-[#f4e8ff] text-[#8c38d8]',
  },
  {
    id: 'KF',
    name: 'Kids Fashion House',
    owner: 'Lê Minh Cường',
    category: 'Thời trang',
    date: '15/10/2023',
    colorClass: 'bg-[#e8f0ff] text-[#2f6bf2]',
  },
]

const moduleCopy = {
  dashboard: {
    title: 'Dashboard',
    description: 'Theo dõi nhanh hiệu suất vận hành toàn hệ thống ShopBee.',
  },
  users: {
    title: 'Quản trị người dùng',
    description: 'Quản lý tài khoản, phân quyền và trạng thái hoạt động của người dùng.',
  },
  shops: {
    title: 'Quản lý cửa hàng',
    description: 'Duyệt shop, theo dõi thông tin cửa hàng và trạng thái kinh doanh.',
  },
  categories: {
    title: 'Quản trị danh mục',
    description: 'Sắp xếp danh mục, ẩn hiện nhóm sản phẩm và chuẩn hóa cây ngành hàng.',
  },
  products: {
    title: 'Quản trị sản phẩm',
    description: 'Kiểm duyệt sản phẩm, theo dõi tồn kho và xử lý sản phẩm vi phạm.',
  },
  comments: {
    title: 'Quản lý bình luận',
    description: 'Kiểm duyệt đánh giá, phản hồi và nội dung cần xử lý.',
  },
  promotions: {
    title: 'Khuyến mãi',
    description: 'Quản lý mã giảm giá, flash sale và chiến dịch toàn sàn.',
  },
  shipping: {
    title: 'Vận chuyển',
    description: 'Theo dõi cấu hình phí, khu vực giao hàng và đối tác vận chuyển.',
  },
  reports: {
    title: 'Thống kê báo cáo',
    description: 'Tổng hợp doanh thu, đơn hàng, người dùng, shop và sản phẩm.',
  },
}

const statusClassNames = {
  pending: 'bg-[#fff1cc] text-[#9a5a00]',
  paid: 'bg-[#e5f4ff] text-[#0369a1]',
  shipping: 'bg-[#dce9ff] text-[#1f5fe0]',
  delivered: 'bg-[#d9f7df] text-[#087c32]',
  cancelled: 'bg-[#ffdcd6] text-[#b42318]',
  processing: 'bg-[#e9e4ff] text-[#5d43c5]',
  refunded: 'bg-[#eeeeed] text-[#4b4b4b]',
}

const orderStatusLabels = {
  all: 'Tất cả',
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
}

const userRoleLabels = {
  admin: 'Quản trị viên',
  seller: 'Người bán',
  customer: 'Khách hàng',
}

const userRoleClassNames = {
  admin: 'bg-[#ffe8cc] text-[#9a5700]',
  seller: 'bg-[#e8f0ff] text-[#1f5fe0]',
  customer: 'bg-[#eeeeed] text-[#4b4b4b]',
}

const avatarColorClasses = [
  'bg-[#e9e3df] text-[#755f55]',
  'bg-[#ffb36a] text-[#7b3600]',
  'bg-[#f1f1f1] text-[#4b4b4b]',
  'bg-[#ffe0df] text-[#be2420]',
  'bg-[#e8f0ff] text-[#2f6bf2]',
  'bg-[#f4e8ff] text-[#8c38d8]',
]

function getInitial(name, email) {
  return String(name || email || 'A').trim().slice(0, 1).toUpperCase()
}

function formatCount(value) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return {
      date: '--/--/----',
      time: '--:--',
    }
  }

  return {
    date: new Intl.DateTimeFormat('vi-VN').format(date),
    time: new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date),
  }
}

function formatShopAddress(shop) {
  return [shop.addressLine1, shop.ward, shop.district, shop.province].filter(Boolean).join(', ') || 'Chưa cập nhật'
}

function withAvatarClass(item, index) {
  return {
    ...item,
    avatarClass: item.avatarClass || avatarColorClasses[index % avatarColorClasses.length],
  }
}

function buildOverviewStats(data) {
  const stats = data?.stats
  if (!stats) return defaultOverviewStats

  return [
    {
      label: 'Tổng doanh thu (tháng)',
      value: formatCurrency(stats.monthlyRevenue),
      icon: 'payments',
      change: stats.monthlyRevenueChange || '0%',
      iconClass: 'bg-[#fff2df] text-[#d47b00]',
    },
    {
      label: 'Số đơn hàng mới',
      value: formatCount(stats.newOrders || 0),
      icon: 'shopping_bag',
      change: stats.newOrdersChange || '0%',
      iconClass: 'bg-[#e8f0ff] text-[#2f6bf2]',
    },
    {
      label: 'Người dùng mới',
      value: formatCount(stats.newUsers || 0),
      icon: 'person',
      change: stats.newUsersChange || '0%',
      iconClass: 'bg-[#f3e8ff] text-[#9d4edd]',
    },
    {
      label: 'Cửa hàng chờ duyệt',
      value: formatCount(stats.pendingShops || 0),
      icon: 'storefront',
      change: stats.pendingShops ? 'Cần duyệt' : 'Ổn định',
      iconClass: 'bg-[#fff0e7] text-[#e5791f]',
    },
  ]
}

function buildOrderTabs(data) {
  const tabs = data?.orders?.tabs
  if (!tabs?.length) return defaultOrderTabs

  return tabs.map((tab) => ({
    ...tab,
    label: orderStatusLabels[tab.value] || tab.value,
  }))
}

function buildOrders(data) {
  const apiOrders = data?.orders?.items
  if (!apiOrders) return defaultOrders

  return apiOrders.map((order, index) => {
    const dateTime = formatDateTime(order.createdAt)

    return withAvatarClass(
      {
        ...order,
        date: dateTime.date,
        time: dateTime.time,
        total: formatCurrency(order.total),
        statusLabel: orderStatusLabels[order.status] || order.status,
      },
      index,
    )
  })
}

function buildPendingShops(data) {
  const shops = data?.pendingShops
  if (!shops) return defaultPendingShops

  return shops.map((shop, index) => {
    const dateTime = formatDateTime(shop.createdAt)

    return {
      ...shop,
      id: shop.initials || String(shop.id),
      category: shop.province || 'Chưa cập nhật',
      date: dateTime.date,
      colorClass: avatarColorClasses[index % avatarColorClasses.length],
    }
  })
}

function buildUserStats(data) {
  const stats = data?.stats || {}

  return [
    {
      label: 'Tổng người dùng',
      value: formatCount(stats.total || 0),
      icon: 'groups',
      change: `${formatCount(stats.active || 0)} hoạt động`,
      iconClass: 'bg-[#e8f0ff] text-[#2f6bf2]',
    },
    {
      label: 'Khách hàng',
      value: formatCount(stats.customers || 0),
      icon: 'person',
      change: 'Customer',
      iconClass: 'bg-[#eeeeed] text-[#4b4b4b]',
    },
    {
      label: 'Người bán',
      value: formatCount(stats.sellers || 0),
      icon: 'storefront',
      change: 'Seller',
      iconClass: 'bg-[#fff2df] text-[#d47b00]',
    },
    {
      label: 'Quản trị viên',
      value: formatCount(stats.admins || 0),
      icon: 'admin_panel_settings',
      change: 'Admin',
      iconClass: 'bg-[#f3e8ff] text-[#9d4edd]',
    },
  ]
}

function buildShopStats(data) {
  const stats = data?.stats || {}

  return [
    {
      label: 'Tổng cửa hàng',
      value: formatCount(stats.total || 0),
      icon: 'storefront',
      change: `${formatCount(stats.active || 0)} đang mở`,
      iconClass: 'bg-[#fff2df] text-[#d47b00]',
    },
    {
      label: 'Cửa hàng tạm khóa',
      value: formatCount(stats.inactive || 0),
      icon: 'lock',
      change: 'Inactive',
      iconClass: 'bg-[#ffe0df] text-[#be2420]',
    },
    {
      label: 'Đơn chờ duyệt',
      value: formatCount(stats.pendingApplications || 0),
      icon: 'pending_actions',
      change: 'Cần xử lý',
      iconClass: 'bg-[#f3e8ff] text-[#9d4edd]',
    },
    {
      label: 'Sản phẩm toàn sàn',
      value: formatCount(stats.products || 0),
      icon: 'inventory_2',
      change: 'Products',
      iconClass: 'bg-[#e8f0ff] text-[#2f6bf2]',
    },
  ]
}

function AdminAvatar({ profile }) {
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

function SidebarItem({ item, active, onClick }) {
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

function RevenueTrendCard({ trend }) {
  const points = trend?.length ? trend : defaultRevenueTrend
  const totalRevenue = points.reduce((sum, point) => sum + Number(point.value || 0), 0)
  const maxValue = Math.max(1, ...points.map((point) => Number(point.value || 0)))
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
          <h2 className="text-[15px] font-bold text-[#15110d]">Doanh thu 7 ngày gần đây</h2>
          <p className="mt-1 text-[11px] text-[#7c6657]">
            {hasRevenue
              ? `Cao nhất ${peakPoint.day}: ${formatCurrency(peakPoint.value)}`
              : 'Chưa có doanh thu phát sinh trong khoảng thời gian này.'}
          </p>
        </div>
        <div className="rounded-lg bg-[#fff7ea] px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase text-[#9a5700]">Tổng 7 ngày</p>
          <p className="mt-0.5 text-[18px] font-bold leading-6 text-[#2b1a02]">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-[#fbfaf9] px-4 pb-3 pt-4">
        <div className="flex h-[142px] items-end gap-3">
          {points.map((point) => {
            const value = Number(point.value || 0)
            const barHeight = hasRevenue ? Math.max(8, Math.round((value / maxValue) * 100)) : 4

            return (
              <div key={`${point.day}-${point.date || value}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="flex h-[116px] w-full items-end">
                  <div
                    className={`mx-auto w-full max-w-[34px] rounded-t-md transition-all ${
                      value > 0 ? 'bg-[#c57900]' : 'bg-[#eaded2]'
                    }`}
                    style={{ height: `${barHeight}%` }}
                    title={`${point.day}: ${formatCurrency(value)}`}
                  />
                </div>
                <span className="h-4 text-[10px] font-semibold text-[#5f5147]">{point.day}</span>
              </div>
            )
          })}
        </div>
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

function SystemNoticePanel() {
  return (
    <section className="rounded-lg border border-[#eaded2] bg-white p-4 shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
      <h2 className="text-[15px] font-bold text-[#15110d]">Thông báo hệ thống</h2>

      <div className="mt-4 space-y-4">
        {systemNotifications.map((notice) => (
          <article key={notice.title} className="relative pl-5">
            <span className="absolute bottom-0 left-0 top-0 w-0.5 rounded-full" style={{ backgroundColor: notice.accent }} />
            <div className="flex gap-2">
              <span className="material-symbols-outlined mt-0.5 text-[17px]" style={{ color: notice.accent }}>
                {notice.icon}
              </span>
              <div>
                <h3 className="text-[12px] font-bold leading-4 text-[#1a130f]">{notice.title}</h3>
                <p className="mt-1 text-[11px] leading-4 text-[#6f5b4d]">{notice.description}</p>
                <p className="mt-1 text-[9px] font-semibold text-[#a18470]">{notice.time}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button className="mt-5 w-full text-center text-[11px] font-bold text-[#c57900] hover:text-[#8f5300]" type="button">
        Xem tất cả thông báo
      </button>
    </section>
  )
}

function PendingShopsTable({ shops, totalCount }) {
  const visibleShops = shops || defaultPendingShops

  return (
    <section className="overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-[0_8px_24px_rgba(60,42,22,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#15110d]">Danh sách cửa hàng chờ duyệt</h2>
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
                    <IconButton icon="visibility" label={`Xem ${shop.name}`} />
                    <IconButton icon="check_circle" label={`Duyệt ${shop.name}`} />
                    <IconButton icon="cancel" label={`Từ chối ${shop.name}`} />
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
    </section>
  )
}

function OverviewDashboard({ dashboardData }) {
  const stats = buildOverviewStats(dashboardData)
  const trend = dashboardData?.revenueTrend || defaultRevenueTrend
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <RevenueTrendCard trend={trend} />
        <SystemNoticePanel />
      </div>

      <PendingShopsTable shops={shops} totalCount={dashboardData?.stats?.pendingShops} />
    </div>
  )
}

function PlaceholderModule({ activeModule }) {
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

function ShopsDashboard({ searchTerm, shopsData }) {
  const [activeStatus, setActiveStatus] = useState('all')
  const stats = useMemo(() => buildShopStats(shopsData), [shopsData])
  const shops = shopsData?.items || []
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
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead>
              <tr className="h-12 bg-[#eeeeed] text-[10px] font-bold uppercase text-[#4b3527]">
                <th className="px-4">Cửa hàng</th>
                <th className="px-4">Chủ sở hữu</th>
                <th className="px-4">Địa chỉ</th>
                <th className="px-4">Sản phẩm</th>
                <th className="px-4">Đơn hàng</th>
                <th className="px-4">Doanh thu</th>
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

function UsersDashboard({ searchTerm, usersData, currentUserId, onUsersDataChange }) {
  const [activeRole, setActiveRole] = useState('all')
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const stats = useMemo(() => buildUserStats(usersData), [usersData])
  const users = usersData?.items || []
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
                          icon={isUpdating ? 'sync' : user.isActive ? 'lock' : 'lock_open'}
                          label={user.isActive ? `Khóa ${user.name}` : `Mở khóa ${user.name}`}
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

function OrdersDashboard({ searchTerm, dashboardData }) {
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
          <div className="flex items-center gap-2">
            <IconButton icon="chevron_left" label="Trang trước" className="border border-[#e2d5c8] bg-[#f4f1ee]" />
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                className={`h-6 min-w-6 rounded-md border px-2 text-[11px] font-semibold ${
                  page === 1
                    ? 'border-[#9a5700] bg-[#9a5700] text-white'
                    : 'border-[#dccdbf] bg-[#f8f5f2] text-[#4b3527] hover:border-[#9a5700]'
                }`}
                type="button"
              >
                {page}
              </button>
            ))}
            <span className="text-[#786255]">...</span>
            <button
              className="h-6 min-w-6 rounded-md border border-[#dccdbf] bg-[#f8f5f2] px-2 text-[11px] font-semibold text-[#4b3527] hover:border-[#9a5700]"
              type="button"
            >
              310
            </button>
            <IconButton icon="chevron_right" label="Trang sau" className="border border-[#e2d5c8] bg-[#f4f1ee]" />
          </div>
        </div>
      </section>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [profile, setProfile] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [usersData, setUsersData] = useState(null)
  const [shopsData, setShopsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const authUser = getAuthUser()
    if (!authUser) {
      const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
      navigate(`/login?redirect=${redirect}`, { replace: true })
      return undefined
    }

    let active = true

    async function loadProfile() {
      try {
        const nextProfile = await getAccountProfile()
        if (!active) return

        setProfile(nextProfile)
        if (nextProfile?.role !== 'admin') {
          setError('Bạn không có quyền truy cập dashboard admin.')
          return
        }

        const [nextDashboardData, nextUsersData, nextShopsData] = await Promise.all([
          getAdminDashboardData(),
          getAdminUsersData(),
          getAdminShopsData(),
        ])
        if (!active) return

        setDashboardData(nextDashboardData)
        setUsersData(nextUsersData)
        setShopsData(nextShopsData)
        setError('')
      } catch (err) {
        if (active) setError(err.message || 'Không tải được dashboard admin.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [location.pathname, location.search, navigate])

  const activeNav = adminNavItems.find((item) => item.value === activeModule)

  return (
    <main className="min-h-screen bg-[#f7f5f2] font-['Be_Vietnam_Pro'] text-[#1d1712] lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen grid-cols-1 lg:h-full lg:min-h-0 lg:grid-cols-[174px_minmax(0,1fr)]">
        <aside className="flex min-h-full flex-col border-b border-[#e8ded4] bg-[#f1f0ee] lg:h-screen lg:min-h-0 lg:overflow-hidden lg:border-b-0 lg:border-r">
          <div className="flex h-[62px] items-center gap-2 px-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff9800] text-[#5d3500]">
              <span className="material-symbols-outlined text-[19px]">shopping_bag</span>
            </span>
            <div className="min-w-0">
              <p className="text-[22px] font-bold leading-6 text-[#3b2508]">ShopBee</p>
              <p className="text-[11px] font-medium text-[#8b7461]">Hệ thống quản trị</p>
            </div>
          </div>

          <nav className="flex-1 space-y-3 px-2 py-4">
            {adminNavItems.map((item) => (
              <SidebarItem
                key={item.value}
                item={item}
                active={activeModule === item.value}
                onClick={() => setActiveModule(item.value)}
              />
            ))}
          </nav>

          <div className="border-t border-[#e3d9cf] px-2 py-4">
            <SidebarItem
              item={{ value: 'settings', icon: 'settings', label: 'Cài đặt' }}
              active={activeModule === 'settings'}
              onClick={() => setActiveModule('settings')}
            />
            <button
              className="mt-2 flex h-8 w-full items-center gap-2 rounded-md px-3 text-left text-[11px] font-semibold text-[#d31818] transition-colors hover:bg-[#ffe7e3]"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">logout</span>
              Đăng xuất
            </button>
          </div>
        </aside>

        <section className="min-w-0 lg:flex lg:h-screen lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <header className="sticky top-0 z-20 flex min-h-[38px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e2cdbb] bg-[#fbfaf9] px-4 py-1.5 shadow-[0_1px_0_rgba(130,92,52,0.04)]">
            <label className="relative flex h-8 w-full max-w-[312px] items-center md:max-w-[420px]">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[18px] text-[#6e4d36]">
                search
              </span>
              <input
                className="h-8 w-full rounded-full border border-[#dfc8b5] bg-white py-0 pl-9 pr-4 text-[12px] text-[#2a211a] placeholder:text-[#8a7768] focus:border-[#c98225] focus:ring-0"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm kiếm đơn hàng, khách hàng..."
              />
            </label>

            <div className="flex items-center gap-4">
              <button
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-[#3e2e24] transition-colors hover:bg-[#f2e7db]"
                type="button"
                aria-label="Thông báo"
                title="Thông báo"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[#d62020]" />
              </button>

              <div className="flex items-center gap-2">
                <div className="hidden text-right sm:block">
                  <p className="text-[11px] font-bold leading-4 text-[#130f0b]">
                    {profile?.name || 'Admin ShopBee'}
                  </p>
                  <p className="text-[10px] font-semibold leading-3 text-[#9a5700]">
                    {profile?.role === 'admin' ? 'Quản trị viên' : activeNav?.label || 'Quản trị viên'}
                  </p>
                </div>
                <AdminAvatar profile={profile} />
              </div>
            </div>
          </header>

          <div className="px-4 py-6 md:px-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {loading ? (
              <div className="rounded-lg border border-[#eaded2] bg-white px-4 py-4 text-[13px] text-[#6f5b4d]">
                Đang tải dashboard admin...
              </div>
            ) : null}

            {!loading && error ? (
              <div className="rounded-lg border border-[#ffd0ca] bg-[#fff0ee] px-4 py-4 text-[13px] text-[#ba1a1a]">
                {error}
              </div>
            ) : null}

            {!loading && !error && activeModule === 'dashboard' ? <OverviewDashboard dashboardData={dashboardData} /> : null}
            {!loading && !error && activeModule === 'users' ? (
              <UsersDashboard
                searchTerm={searchTerm}
                usersData={usersData}
                currentUserId={profile?.id}
                onUsersDataChange={setUsersData}
              />
            ) : null}
            {!loading && !error && activeModule === 'shops' ? (
              <ShopsDashboard searchTerm={searchTerm} shopsData={shopsData} />
            ) : null}
            {!loading && !error && activeModule === 'orders' ? (
              <OrdersDashboard searchTerm={searchTerm} dashboardData={dashboardData} />
            ) : null}
            {!loading &&
            !error &&
            activeModule !== 'dashboard' &&
            activeModule !== 'users' &&
            activeModule !== 'shops' &&
            activeModule !== 'orders' ? (
              <PlaceholderModule activeModule={activeModule} />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
