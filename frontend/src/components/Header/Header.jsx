import { Link } from 'react-router-dom'

import AccountButton from '../Auth/AccountButton'
import { useCart } from '../../context/useCart'

export default function Header() {
  const { cartCount } = useCart()
  const displayCount = cartCount > 99 ? '99+' : cartCount

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface shadow-[0px_4px_20px_rgba(0,0,0,0.05)] h-16 flex items-center">
      <div className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-16">
        <div className="flex items-center gap-8 flex-1">
          <Link to="/" aria-label="Trang chủ">
            <img src="/logo_shop_remote.png" alt="ShopBee" className="h-20 w-auto" />
          </Link>
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <input
              className="w-full h-10 pl-4 pr-12 rounded-lg border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-0 text-body-md"
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              type="text"
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary"
              type="button"
              aria-label="Tìm kiếm"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-6 px-8">
          <Link
            className="text-primary font-bold border-b-2 border-primary pb-1 font-label-md text-label-md"
            to="/"
          >
            Trang chủ
          </Link>
          <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md" href="#category-thoi-trang">
            Thời trang
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md" href="#category-gia-dung">
            Gia dụng
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md" href="#category-lam-dep">
            Làm đẹp
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md" href="#category-suc-khoe">
            Sức khỏe
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <button
            className="p-2 hover:bg-surface-container rounded-full relative"
            type="button"
            aria-label="Thông báo"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>
          <Link
            to="/cart"
            className="p-2 hover:bg-surface-container rounded-full relative"
            aria-label="Giỏ hàng"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
                {displayCount}
              </span>
            ) : null}
          </Link>
          <AccountButton buttonClassName="hover:bg-surface-container rounded-full" showName />
        </div>
      </div>
    </header>
  )
}
