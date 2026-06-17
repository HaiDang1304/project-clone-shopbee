import { Link } from 'react-router-dom'

const heroBanners = [
  {
    href: '/vouchers',
    image: '/banner-hero/ee3e373d-513b-40e1-9f86-8ad7e24849d6.png',
    alt: 'Banner khuyen mai chinh',
  },
  {
    href: '/category/thoi-trang',
    image: '/banner-hero/4943b7f1-c522-4e4c-b82d-88339a591eac.png',
    alt: 'Banner thoi trang',
  },
  {
    href: '/category/gia-dung',
    image: '/banner-hero/5a73f3f0-a079-4798-a330-07cddb6b72ef.png',
    alt: 'Banner gia dung',
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
    <Link className="group relative block aspect-[1916/821] overflow-hidden rounded-xl bg-white text-white shadow-[0_10px_28px_rgba(23,18,14,0.12)] lg:h-full lg:aspect-auto" to={banner.href}>
      <img className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.02]" src={banner.image} alt={banner.alt} />
    </Link>
  )
}

export default function HeroSection() {
  const [mainBanner, ...sideBanners] = heroBanners

  return (
    <section className="mx-auto mb-8 max-w-container-max px-margin-mobile md:px-margin-desktop">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
        <Link className="group relative block aspect-[1916/821] overflow-hidden rounded-xl bg-white text-white shadow-[0_14px_40px_rgba(23,18,14,0.16)]" to={mainBanner.href}>
          <img className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.02]" src={mainBanner.image} alt={mainBanner.alt} />
        </Link>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {sideBanners.map((banner) => (
            <PromoCard key={banner.image} banner={banner} />
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
