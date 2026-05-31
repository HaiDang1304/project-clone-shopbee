export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface shadow-[0px_4px_20px_rgba(0,0,0,0.05)] h-16 flex items-center">
      <div className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-16">
        <div className="flex items-center gap-8 flex-1">
          <h1 className="text-title-lg font-headline-lg text-primary">AI Market</h1>
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
          <a
            className="text-primary font-bold border-b-2 border-primary pb-1 font-label-md text-label-md"
            href="#"
          >
            Điện tử
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md"
            href="#"
          >
            Thời trang
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md"
            href="#"
          >
            Gia dụng
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md"
            href="#"
          >
            Làm đẹp
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-md text-label-md"
            href="#"
          >
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
          <button
            className="p-2 hover:bg-surface-container rounded-full relative"
            type="button"
            aria-label="Giỏ hàng"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
              3
            </span>
          </button>
          <button
            className="p-2 hover:bg-surface-container rounded-full"
            type="button"
            aria-label="Tài khoản"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  )
}
