import { useState } from 'react'
import { Link } from 'react-router-dom'

import AuthModal from '../Auth/AuthModal'

export default function Header() {
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-surface shadow-[0px_4px_20px_rgba(0,0,0,0.05)] h-16 flex items-center">
        <div className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-8 flex-1">
            <Link to="/" aria-label="Trang chu">
              <img src="/logo_shop_remote.png" alt="ShopBee" className="h-20 w-auto" />
            </Link>
            <div className="hidden md:flex flex-1 max-w-xl relative">
              <input
                className="w-full h-10 pl-4 pr-12 rounded-lg border border-outline-variant bg-surface-container-low focus:border-primary focus:ring-0 text-body-md"
                placeholder="Tim kiem san pham, thuong hieu..."
                type="text"
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary"
                type="button"
                aria-label="Tim kiem"
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
              Trang chu
            </Link>
            <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md" href="#category-thoi-trang">
              Thoi trang
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md" href="#category-gia-dung">
              Gia dung
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md" href="#category-lam-dep">
              Lam dep
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md" href="#category-suc-khoe">
              Suc khoe
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              className="p-2 hover:bg-surface-container rounded-full relative"
              type="button"
              aria-label="Thong bao"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <button
              className="p-2 hover:bg-surface-container rounded-full relative"
              type="button"
              aria-label="Gio hang"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                3
              </span>
            </button>
            <button
              className="p-2 hover:bg-surface-container rounded-full"
              type="button"
              aria-label="Tai khoan"
              onClick={() => setAuthOpen(true)}
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
