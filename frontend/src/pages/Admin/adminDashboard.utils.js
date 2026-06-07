import {
  avatarColorClasses,
  orderStatusLabels,
} from './adminDashboard.constants'

export function getInitial(name, email) {
  return String(name || email || 'A').trim().slice(0, 1).toUpperCase()
}

export function formatCount(value) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function formatDateTime(value) {
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

export function formatShopAddress(shop) {
  return [shop.addressLine1, shop.ward, shop.province].filter(Boolean).join(', ') || 'Chưa cập nhật'
}

export function withAvatarClass(item, index) {
  return {
    ...item,
    avatarClass: item.avatarClass || avatarColorClasses[index % avatarColorClasses.length],
  }
}

export function buildOverviewStats(data) {
  const stats = data?.stats || {}

  return [
    {
      label: 'Tổng doanh thu (tháng)',
      value: formatCurrency(stats.monthlyRevenue),
      icon: 'payments',
      change: stats.monthlyRevenueChange || '0%',
      iconClass: 'bg-[#fff2df] text-[#d47b00]',
    },
    {
      label: 'Doanh thu phí sàn',
      value: formatCurrency(stats.monthlyPlatformFeeRevenue),
      icon: 'receipt',
      change: stats.monthlyPlatformFeeRevenueChange || '0%',
      iconClass: 'bg-[#e8fff5] text-[#047857]',
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

export function buildOrderTabs(data) {
  const tabs = data?.orders?.tabs
  if (!tabs?.length) return [{ value: 'all', label: orderStatusLabels.all, count: 0 }]

  return tabs.map((tab) => ({
    ...tab,
    label: orderStatusLabels[tab.value] || tab.value,
  }))
}

export function buildOrders(data) {
  const apiOrders = data?.orders?.items
  if (!apiOrders?.length) return []

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

export function buildPendingShops(data) {
  const shops = data?.pendingShops
  if (!shops?.length) return []

  return shops.map((shop, index) => {
    const dateTime = formatDateTime(shop.createdAt)

    return {
      ...shop,
      applicationId: shop.id,
      id: shop.initials || String(shop.id),
      category: shop.province || 'Chưa cập nhật',
      address: [shop.addressLine1, shop.ward, shop.province].filter(Boolean).join(', '),
      date: dateTime.date,
      colorClass: avatarColorClasses[index % avatarColorClasses.length],
    }
  })
}

export function buildUserStats(data) {
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

export function buildShopStats(data) {
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
      label: 'Phí sàn tháng',
      value: formatCurrency(stats.monthlyPlatformFee),
      icon: 'receipt',
      change: '5% đơn đã giao',
      iconClass: 'bg-[#e8fff5] text-[#047857]',
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
