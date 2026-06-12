import { Link } from 'react-router-dom'

const heroBanners = [
  {
    label: 'Siêu sale hôm nay',
    title: 'Deal đẹp mở ngày, săn giá tốt mọi ngành hàng',
    description: 'Voucher toàn sàn, flash sale theo khung giờ và ưu đãi từ các shop nổi bật đang chờ bạn.',
    cta: 'Săn deal ngay',
    href: '/vouchers',
    image:
      'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1400&q=85',
  },
  {
    label: 'Thời trang',
    title: 'Bộ sưu tập mới',
    description: 'Tối đa 45%',
    href: '/category/thoi-trang',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=720&q=85',
  },
  {
    label: 'Gia dụng',
    title: 'Nhà đẹp giá tốt',
    description: 'Deal bếp, dọn dẹp, tiện ích',
    href: '/category/gia-dung',
    image:
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=720&q=85',
  },
]

const quickDeals = [
  { icon: 'local_shipping', title: 'Miễn phí vận chuyển', note: 'Đơn từ 99K' },
  { icon: 'confirmation_number', title: 'Voucher toàn sàn', note: 'Lưu mã mỗi ngày' },
  { icon: 'verified', title: 'Shop uy tín', note: 'Duyệt bán bởi sàn' },
  { icon: 'payments', title: 'Hoàn xu', note: 'Cho đơn đủ điều kiện' },
]

function PromoCard({ banner }) {
  return (
    <Link className="group relative min-h-[184px] overflow-hidden rounded-xl bg-[#111] text-white shadow-[0_10px_28px_rgba(23,18,14,0.12)]" to={banner.href}>
      <img className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={banner.image} alt={banner.title} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase text-[#1d1712]">{banner.label}</span>
        <h3 className="mt-3 text-[24px] font-bold leading-7">{banner.title}</h3>
        <p className="mt-1 text-[13px] font-semibold text-white/85">{banner.description}</p>
      </div>
    </Link>
  )
}

export default function HeroSection() {
  const [mainBanner, ...sideBanners] = heroBanners

  return (
    <section className="mx-auto mb-8 max-w-container-max px-margin-mobile md:px-margin-desktop">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
        <Link className="group relative min-h-[430px] overflow-hidden rounded-xl bg-[#21150f] text-white shadow-[0_14px_40px_rgba(23,18,14,0.16)]" to={mainBanner.href}>
          <img className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={mainBanner.image} alt={mainBanner.title} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/42 to-black/5" />
          <div className="relative z-10 flex h-full max-w-[560px] flex-col justify-center px-6 py-8 sm:px-10 lg:px-12">
            <span className="w-fit rounded-full bg-[#ff5722] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              {mainBanner.label}
            </span>
            <h1 className="mt-4 text-[34px] font-bold leading-[1.08] sm:text-[44px]">
              {mainBanner.title}
            </h1>
            <p className="mt-4 max-w-md text-[15px] font-medium leading-6 text-white/88">
              {mainBanner.description}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="rounded-lg bg-[#ff5722] px-5 py-3 text-[14px] font-bold text-white shadow-[0_10px_22px_rgba(255,87,34,0.28)] transition-transform group-hover:-translate-y-0.5">
                {mainBanner.cta}
              </span>
              <span className="rounded-lg bg-white/14 px-4 py-3 text-[13px] font-semibold text-white backdrop-blur">
                Mã HOT: SHOPBEE50
              </span>
            </div>
          </div>
        </Link>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {sideBanners.map((banner) => (
            <PromoCard key={banner.title} banner={banner} />
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickDeals.map((item) => (
          <div key={item.title} className="flex items-center gap-3 rounded-xl border border-[#eaded2] bg-white px-4 py-3 shadow-[0_8px_22px_rgba(60,42,22,0.05)]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fff2df] text-[#c57900]">
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-[#15110d]">{item.title}</span>
              <span className="block truncate text-[12px] text-[#7b6556]">{item.note}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
