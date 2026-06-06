import { useMemo, useState } from 'react'
import { A11y, FreeMode, Navigation, Thumbs } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'

import { apiAssetUrl } from '../../../lib/api'

const fallbackImage = '/logo_shop.png'

export default function ProductGallery({ product }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null)
  const images = useMemo(() => {
    const productImages = (product?.images || [])
      .map((image) => ({
        src: apiAssetUrl(typeof image === 'string' ? image : image.imageUrl),
        alt: image.altText || product.name,
      }))
      .filter((image) => image.src)

    if (productImages.length) return productImages

    return [
      {
        src: apiAssetUrl(product?.thumbnailUrl || product?.imageUrl) || fallbackImage,
        alt: product?.name || 'Product',
      },
    ]
  }, [product])

  const discount = product?.originalPrice && Number(product.originalPrice) > Number(product.price)
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div
        className="relative overflow-hidden rounded-xl bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.05)]"
        style={{ '--swiper-navigation-color': '#ff4f24' }}
      >
        <Swiper
          className="aspect-square"
          modules={[Navigation, Thumbs, A11y]}
          navigation={images.length > 1}
          spaceBetween={12}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        >
          {images.map((image, index) => (
            <SwiperSlide key={`${image.src}-${index}`} className="bg-white">
              <img
                alt={image.alt}
                className="h-full w-full object-cover"
                src={image.src}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {discount > 0 ? (
          <div className="absolute left-4 top-4 z-10 rounded-full bg-error px-3 py-1 text-label-md font-bold text-white">
            -{discount}%
          </div>
        ) : null}
      </div>

      {images.length > 1 ? (
        <Swiper
          className="pb-2"
          freeMode
          modules={[FreeMode, Thumbs, A11y]}
          onSwiper={setThumbsSwiper}
          slidesPerView="auto"
          spaceBetween={16}
          watchSlidesProgress
        >
          {images.map((image, index) => (
            <SwiperSlide
              key={`${image.src}-thumb-${index}`}
              className="!h-20 !w-20 cursor-pointer overflow-hidden rounded-lg border border-outline-variant transition-all [&.swiper-slide-thumb-active]:border-2 [&.swiper-slide-thumb-active]:border-primary"
              aria-label={`Ảnh sản phẩm ${index + 1}`}
            >
              <img alt={image.alt} className="h-full w-full object-cover" src={image.src} />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : null}
    </div>
  )
}
