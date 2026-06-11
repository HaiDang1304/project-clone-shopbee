import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import {
  getAccountProfile,
  getAdminCategoriesData,
  getAdminCommentsData,
  getAdminDashboardData,
  getAdminShopsData,
  getAdminUsersData,
} from '../../lib/account'
import { getAuthUser } from '../../lib/auth'
import { defaultRevenueFilter, revenueFilterParams } from '../../lib/revenueFilters'
import { adminNavItems } from './adminDashboard.constants'
import {
  AdminAvatar,
  CategoriesDashboard,
  CommentsDashboard,
  OrdersDashboard,
  OverviewDashboard,
  PlaceholderModule,
  ShopsDashboard,
  SidebarItem,
  UsersDashboard,
} from './AdminDashboardSections'

export default function AdminDashboardPage() {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [profile, setProfile] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [usersData, setUsersData] = useState(null)
  const [shopsData, setShopsData] = useState(null)
  const [categoriesData, setCategoriesData] = useState(null)
  const [commentsData, setCommentsData] = useState(null)
  const [revenueFilter, setRevenueFilter] = useState(defaultRevenueFilter)
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

        const [nextDashboardData, nextUsersData, nextShopsData, nextCategoriesData, nextCommentsData] = await Promise.all([
          getAdminDashboardData(revenueFilterParams(defaultRevenueFilter)),
          getAdminUsersData(),
          getAdminShopsData(),
          getAdminCategoriesData(),
          getAdminCommentsData(),
        ])
        if (!active) return

        setDashboardData(nextDashboardData)
        setUsersData(nextUsersData)
        setShopsData(nextShopsData)
        setCategoriesData(nextCategoriesData)
        setCommentsData(nextCommentsData)
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

  async function refreshDashboardData() {
    const nextDashboardData = await getAdminDashboardData(revenueFilterParams(revenueFilter))
    setDashboardData(nextDashboardData)
  }

  async function handleRevenueFilterChange(nextFilter, options = {}) {
    setRevenueFilter(nextFilter)
    if (options.deferLoad) return

    try {
      const nextDashboardData = await getAdminDashboardData(revenueFilterParams(nextFilter))
      setDashboardData(nextDashboardData)
    } catch (err) {
      toast.error(err.message || 'Khong tai duoc doanh thu theo khoang ngay')
    }
  }

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

            {!loading && !error && activeModule === 'dashboard' ? (
              <OverviewDashboard
                dashboardData={dashboardData}
                revenueFilter={revenueFilter}
                onDashboardRefresh={refreshDashboardData}
                onRevenueFilterChange={handleRevenueFilterChange}
              />
            ) : null}
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
            {!loading && !error && activeModule === 'categories' ? (
              <CategoriesDashboard
                searchTerm={searchTerm}
                categoriesData={categoriesData}
                onCategoriesDataChange={setCategoriesData}
              />
            ) : null}
            {!loading && !error && activeModule === 'orders' ? (
              <OrdersDashboard searchTerm={searchTerm} dashboardData={dashboardData} />
            ) : null}
            {!loading && !error && activeModule === 'comments' ? (
              <CommentsDashboard
                searchTerm={searchTerm}
                commentsData={commentsData}
                onCommentsDataChange={setCommentsData}
              />
            ) : null}
            {!loading &&
            !error &&
            activeModule !== 'dashboard' &&
            activeModule !== 'users' &&
            activeModule !== 'shops' &&
            activeModule !== 'categories' &&
            activeModule !== 'orders' &&
            activeModule !== 'comments' ? (
              <PlaceholderModule activeModule={activeModule} />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
