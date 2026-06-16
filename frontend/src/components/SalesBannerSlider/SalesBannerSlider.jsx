import { Link } from 'react-router-dom'
import { A11y, Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import 'swiper/css'
import 'swiper/css/pagination'

const salesBanners = [
  {
    src: '/banner_sales/banner1.png',
    alt: 'Banner khuyen mai 1',
    href: '/vouchers',
  },
  {
    src: '/banner_sales/banner2.png',
    alt: 'Banner khuyen mai 2',
    href: '/vouchers',
  },
  {
    src: '/banner_sales/banner3.png',
    alt: 'Banner khuyen mai 3',
    href: '/vouchers',
  },
  {
    src: '/banner_sales/banner4.png',
    alt: 'Banner khuyen mai 4',
    href: '/vouchers',
  },
]

export default function SalesBannerSlider() {
  return (
    <section className="mx-auto mb-8 max-w-container-max px-margin-mobile md:px-margin-desktop">
      <Swiper
        className="overflow-hidden rounded-xl shadow-[0_14px_34px_rgba(60,42,22,0.12)]"
        modules={[A11y, Autoplay, Pagination]}
        slidesPerView={1}
        spaceBetween={16}
        loop
        speed={850}
        pagination={{ clickable: true }}
        autoplay={{
          delay: 2800,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        style={{
          '--swiper-pagination-color': '#ff5722',
          '--swiper-pagination-bullet-inactive-color': '#ffffff',
          '--swiper-pagination-bullet-inactive-opacity': '0.72',
        }}
      >
        {salesBanners.map((banner) => (
          <SwiperSlide key={banner.src}>
            <Link
              className="block aspect-[1916/821] overflow-hidden bg-white"
              to={banner.href}
            >
              <img
                className="h-full w-full object-contain"
                src={banner.src}
                alt={banner.alt}
                loading="lazy"
              />
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
