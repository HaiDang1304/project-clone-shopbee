export default function Breadcrumbs() {
  return (
    <nav className="flex items-center gap-2 mb-6 text-on-surface-variant font-label-md text-label-md">
      <a className="hover:text-primary" href="#">
        Trang chủ
      </a>
      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      <a className="hover:text-primary" href="#">
        Điện tử
      </a>
      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      <a className="hover:text-primary" href="#">
        Điện thoại
      </a>
      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      <span className="text-on-surface truncate max-w-[200px] md:max-w-none">
        Smartphone AI Thế Hệ Mới - Pro Max Edition
      </span>
    </nav>
  )
}
