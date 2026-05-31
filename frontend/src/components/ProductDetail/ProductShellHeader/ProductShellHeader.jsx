import { Link } from 'react-router-dom'

export default function ProductShellHeader() {
  return (
    <nav className="sticky top-0 z-50 shadow-sm bg-surface dark:bg-surface-container-high transition-all">
      <div className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-16">
        <div className="flex items-center gap-8">
          <Link
            className="text-title-lg font-headline-lg text-primary dark:text-primary-fixed-dim"
            to="/"
            aria-label="Trang chủ"
          >
            ShopBee
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <a
              className="text-on-surface-variant dark:text-secondary-fixed-dim font-label-md text-label-md hover:text-primary transition-colors duration-200"
              href="#"
            >
              Điện tử
            </a>
            <a
              className="text-on-surface-variant dark:text-secondary-fixed-dim font-label-md text-label-md hover:text-primary transition-colors duration-200"
              href="#"
            >
              Thời trang
            </a>
            <a
              className="text-on-surface-variant dark:text-secondary-fixed-dim font-label-md text-label-md hover:text-primary transition-colors duration-200"
              href="#"
            >
              Gia dụng
            </a>
            <a
              className="text-on-surface-variant dark:text-secondary-fixed-dim font-label-md text-label-md hover:text-primary transition-colors duration-200"
              href="#"
            >
              Làm đẹp
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <input
              className="h-10 pl-10 pr-4 rounded-full border-none bg-surface-container text-body-md focus:ring-2 focus:ring-primary w-64 transition-all"
              placeholder="Tìm kiếm sản phẩm..."
              type="text"
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant">
              search
            </span>
          </div>
          <button
            className="relative p-2 text-on-surface-variant hover:text-primary transition-colors"
            type="button"
            aria-label="Giỏ hàng"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="absolute top-0 right-0 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              3
            </span>
          </button>
          <button
            className="p-2 text-on-surface-variant hover:text-primary transition-colors"
            type="button"
            aria-label="Thông báo"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            className="p-2 text-on-surface-variant hover:text-primary transition-colors"
            type="button"
            aria-label="Tài khoản"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
