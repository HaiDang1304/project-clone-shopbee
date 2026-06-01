import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiGet } from '../../lib/api'
import { formatCompact, formatCurrency, productPath } from '../../lib/format'

const fallbackImage = '/logo_shop.png'

function Rating({ value }) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="material-symbols-outlined text-[12px] text-yellow-500"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
      <span className="text-label-md font-label-md">{Number(value || 0).toFixed(1)}</span>
    </div>
  )
}

function RecommendationCard({ product }) {
  const imageSrc = product.thumbnailUrl || product.imageUrl || fallbackImage
  const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price)
  const discount = hasDiscount
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0

  return (
    <Link
      className="bg-surface-container-lowest rounded-xl p-4 shadow-none hover:shadow-[0px_8px_30px_rgba(0,0,0,0.1)] transition-all group flex flex-col h-full border border-surface-container"
      to={productPath(product)}
      aria-label={product.name}
    >
      <div className="aspect-square rounded-lg overflow-hidden bg-surface-container mb-4 relative">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          alt={product.name}
          src={imageSrc}
        />
        {hasDiscount ? (
          <span className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded bg-error">
            -{discount}%
          </span>
        ) : null}
      </div>
      <h3 className="font-body-md text-body-md line-clamp-2 mb-3 h-10">{product.name}</h3>
      <div className="mt-auto space-y-2">
        <div className="text-primary font-bold font-title-lg text-title-lg">
          {formatCurrency(product.price)}
        </div>
        <div className="flex items-center justify-between">
          <Rating value={product.ratingAvg} />
          <span className="text-secondary text-label-md">Da ban {formatCompact(product.soldCount)}</span>
        </div>
        <div className="text-secondary text-label-md overflow-hidden text-ellipsis whitespace-nowrap">
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
        if (!ignore) setError(err.message || 'Khong tai duoc san pham')
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
    <section className="max-w-container-max mx-auto px-margin-desktop">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <h2 className="font-headline-md text-headline-md">Goi y hom nay</h2>
        </div>
        <div className="hidden sm:flex gap-2">
          <button
            className="bg-primary px-4 py-2 text-white rounded-lg font-title-md text-title-md"
            type="button"
          >
            Cho ban
          </button>
          <button
            className="bg-surface-container-high px-4 py-2 text-on-surface rounded-lg font-title-md text-title-md hover:bg-surface-container-highest transition-colors"
            type="button"
          >
            Ban chay
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-gutter">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[292px] rounded-xl bg-surface-container-lowest border border-surface-container animate-pulse"
              />
            ))
          : products.map((product) => (
              <RecommendationCard key={product.id || product.slug} product={product} />
            ))}
      </div>

      {!loading && !products.length ? (
        <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-8 text-center text-on-surface-variant">
          Chua co san pham trong co so du lieu.
        </div>
      ) : null}
    </section>
  )
}
