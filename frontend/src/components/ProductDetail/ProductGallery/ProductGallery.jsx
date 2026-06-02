import { useEffect, useMemo, useState } from 'react'

const fallbackImage = '/logo_shop.png'

export default function ProductGallery({ product }) {
  const images = useMemo(() => {
    const productImages = product?.images?.map((image) => ({
      src: image.imageUrl,
      alt: image.altText || product.name,
    }))

    if (productImages?.length) return productImages

    return [
      {
        src: product?.thumbnailUrl || product?.imageUrl || fallbackImage,
        alt: product?.name || 'Product',
      },
    ]
  }, [product])

  const [activeSrc, setActiveSrc] = useState(images[0]?.src || fallbackImage)

  useEffect(() => {
    setActiveSrc(images[0]?.src || fallbackImage)
  }, [images])

  const discount = product?.originalPrice && Number(product.originalPrice) > Number(product.price)
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.05)] aspect-square group relative">
        <img
          alt={product?.name || 'Product'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={activeSrc}
        />
        {discount > 0 ? (
          <div className="absolute top-4 left-4 bg-error text-white px-3 py-1 rounded-full font-label-md text-label-md font-bold">
            -{discount}%
          </div>
        ) : null}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {images.map((img, index) => {
          const isActive = activeSrc === img.src
          return (
            <button
              key={`${img.src}-${index}`}
              className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                isActive ? 'border-2 border-primary' : 'border border-outline-variant hover:border-primary'
              }`}
              type="button"
              onClick={() => setActiveSrc(img.src)}
              aria-label={`Ảnh sản phẩm ${index + 1}`}
            >
              <img alt={img.alt} className="w-full h-full object-cover" src={img.src} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
