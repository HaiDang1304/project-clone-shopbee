import { Link } from 'react-router-dom'

import { sellerTabs } from '../sellerChannel.constants'

export function SellerCenterShell({ profile, shop, activeTab, onTabChange, children }) {
  return (
    <main className="min-h-screen bg-surface-container-low font-['Be_Vietnam_Pro'] text-on-surface">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden border-r border-outline-variant bg-surface-container-lowest lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
          <div className="flex h-16 items-center gap-2 border-b border-outline-variant px-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary">
              <span className="material-symbols-outlined text-[21px]">storefront</span>
            </span>
            <div className="min-w-0">
              <p className="truncate text-title-sm font-title-sm text-on-surface">ShopBee Seller</p>
              <p className="truncate text-body-sm text-on-surface-variant">{shop?.name || 'Kênh bán hàng'}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-3 py-4">
            {sellerTabs.map((tab) => (
              <button
                key={tab.value}
                className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-label-md font-label-md transition-colors ${
                  activeTab === tab.value
                    ? 'bg-primary-container text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                type="button"
                onClick={() => onTabChange(tab.value)}
              >
                <span className="material-symbols-outlined text-[19px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="border-t border-outline-variant px-4 py-4">
            <p className="truncate text-label-md font-label-md text-on-surface">{profile?.name || 'Seller'}</p>
            <p className="truncate text-body-sm text-on-surface-variant">{profile?.email || ''}</p>
          </div>
        </aside>

        <section className="min-w-0 lg:flex lg:min-h-screen lg:flex-col">
          <header className="sticky top-0 z-10 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-lowest px-4 md:px-6">
            <div>
              <p className="text-title-sm font-title-sm text-on-surface">Seller Center</p>
              <p className="text-body-sm text-on-surface-variant">{shop?.name || 'Quản lý kênh bán hàng'}</p>
            </div>
            <Link className="rounded-md border border-outline-variant px-3 py-2 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary" to="/">
              Trang chủ
            </Link>
          </header>

          <nav className="flex min-h-12 shrink-0 gap-1 overflow-x-auto border-b border-outline-variant bg-surface-container-lowest px-3 py-2 lg:hidden">
            {sellerTabs.map((tab) => (
              <button
                key={tab.value}
                className={`flex min-w-max items-center gap-2 rounded-md px-3 text-label-md font-label-md transition-colors ${
                  activeTab === tab.value
                    ? 'bg-primary-container text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                type="button"
                onClick={() => onTabChange(tab.value)}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div id="top" className="px-4 py-5 md:px-6 xl:px-8">
            <div className="w-full">{children}</div>
          </div>
        </section>
      </div>
    </main>
  )
}
