import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiAssetUrl, apiGet } from '../../lib/api'
import { formatCompact, formatCurrency, productPath } from '../../lib/format'

const fallbackImage = '/logo_shop.png'

function Rating({ value }) {
  return (
    <div className="flex items-center gap-1 text-[#f59e0b]">
      <span
        className="material-symbols-outlined text-[13px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
      <span className="text-[12px] font-bold text-[#6b4d3e]">{Number(value || 0).toFixed(1)}</span>
    </div>
  )
}

function RecommendationCard({ product }) {
  const imageSrc = apiAssetUrl(product.thumbnailUrl || product.imageUrl) || fallbackImage
  const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price)
  const discount = hasDiscount
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0

  return (
    <Link
      className="group flex h-full flex-col rounded-xl border border-[#eaded2] bg-white p-3 shadow-[0_8px_22px_rgba(60,42,22,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#c98225] hover:shadow-[0_14px_30px_rgba(60,42,22,0.12)]"
      to={productPath(product)}
      aria-label={product.name}
    >
      <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-[#f6f1ec]">
        <img
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          alt={product.name}
          src={imageSrc}
        />
        {hasDiscount ? (
          <span className="absolute left-2 top-2 rounded-md bg-[#ff5722] px-2 py-1 text-[10px] font-bold text-white">
            -{discount}%
          </span>
        ) : null}
        <span className="absolute bottom-2 left-2 rounded-md bg-white/92 px-2 py-1 text-[10px] font-bold text-[#7b4600]">
          Mall
        </span>
      </div>
      <h3 className="mb-3 line-clamp-2 min-h-10 text-[13px] font-semibold leading-5 text-[#1d1712]">{product.name}</h3>
      <div className="mt-auto space-y-2">
        <div>
          <div className="text-[18px] font-bold leading-6 text-[#c21d0b]">
            {formatCurrency(product.price)}
          </div>
          {hasDiscount ? (
            <div className="text-[11px] text-[#8a7567] line-through">
              {formatCurrency(product.originalPrice)}
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Rating value={product.ratingAvg} />
          <span className="text-[12px] font-medium text-[#7b6556]">Đã bán {formatCompact(product.soldCount)}</span>
        </div>
        <div className="truncate border-t border-[#f0e7df] pt-2 text-[11px] font-medium text-[#7b6556]">
          {product.shop?.name || product.category?.name || 'ShopBee'}
        </div>
      </div>
    </Link>
  )
}

export default function RecommendationGrid() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadProducts() {
      try {
        const data = await apiGet('/api/products?limit=12')
        if (!ignore) setProducts(data.data || [])
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được sản phẩm')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadProducts()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <section id="recommendations" className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase text-[#c57900]">Dành riêng cho bạn</p>
          <h2 className="mt-1 text-[24px] font-bold leading-8 text-[#15110d]">Gợi ý hôm nay</h2>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg bg-[#995900] px-4 py-2 text-[12px] font-bold text-white"
            type="button"
          >
            Cho bạn
          </button>
          <button
            className="rounded-lg border border-[#dfc8b5] bg-white px-4 py-2 text-[12px] font-bold text-[#4b3527] hover:border-[#9a5700]"
            type="button"
          >
            Bán chạy
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {loading
          ? Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="h-[304px] animate-pulse rounded-xl border border-[#eaded2] bg-white"
              />
            ))
          : products.map((product) => (
              <RecommendationCard key={product.id || product.slug} product={product} />
            ))}
      </div>

      {!loading && !products.length ? (
        <div className="rounded-xl border border-[#eaded2] bg-white p-8 text-center text-[13px] text-[#7b6556]">
          Chưa có sản phẩm.
        </div>
      ) : null}
    </section>
  )
}
