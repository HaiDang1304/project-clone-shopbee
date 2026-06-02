import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiGet } from '../../lib/api'
import { formatCurrency, productPath } from '../../lib/format'

const fallbackImage = '/logo_shop.png'

function pad2(value) {
  return String(value).padStart(2, '0')
}

function Countdown({ products }) {
  const endAt = useMemo(() => {
    const dates = products
      .map((product) => product.flashSale?.endAt)
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter(Number.isFinite)

    return dates.length ? Math.min(...dates) : Date.now() + 2 * 3600 * 1000
  }, [products])

  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.floor((endAt - Date.now()) / 1000)))

  useEffect(() => {
    setSecondsLeft(Math.max(0, Math.floor((endAt - Date.now()) / 1000)))
    const timer = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.floor((endAt - Date.now()) / 1000)))
    }, 1000)

    return () => clearInterval(timer)
  }, [endAt])

  const { h, m, s } = useMemo(() => {
    const hVal = Math.floor(secondsLeft / 3600)
    const mVal = Math.floor((secondsLeft % 3600) / 60)
    const sVal = secondsLeft % 60
    return { h: hVal, m: mVal, s: sVal }
  }, [secondsLeft])

  return (
    <div className="flex gap-1" aria-label="Đếm ngược flash sale">
      <span className="bg-black/20 px-2 py-1 rounded font-bold">{pad2(h)}</span>
      <span>:</span>
      <span className="bg-black/20 px-2 py-1 rounded font-bold">{pad2(m)}</span>
      <span>:</span>
      <span className="bg-black/20 px-2 py-1 rounded font-bold">{pad2(s)}</span>
    </div>
  )
}

function FlashSaleProductCard({ product }) {
  const imageSrc = product.thumbnailUrl || product.imageUrl || fallbackImage
  const flashSale = product.flashSale || {}
  const discount = Number(flashSale.discountPercent || 0)
  const eventStock = Number(flashSale.eventStock || 0)
  const soldInEvent = Number(flashSale.soldInEvent || 0)
  const progress = eventStock > 0 ? Math.min(100, Math.round((soldInEvent / eventStock) * 100)) : 0

  return (
    <Link className="w-48 group cursor-pointer" to={productPath(product)} aria-label={product.name}>
      <div className="relative aspect-square rounded-lg overflow-hidden bg-surface-container mb-3">
        <img
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          alt={product.name}
          src={imageSrc}
        />
        <div className="absolute top-0 right-0 bg-error text-white font-bold text-label-md px-2 py-1 rounded-bl-lg">
          -{discount}%
        </div>
      </div>
      <h4 className="font-body-md text-body-md line-clamp-2 mb-2 text-on-surface">
        {product.name}
      </h4>
      <div className="flex items-baseline gap-2">
        <span className="text-primary font-bold font-title-lg text-title-lg">
          {formatCurrency(product.price)}
        </span>
        {product.originalPrice ? (
          <span className="text-secondary text-label-md line-through">
            {formatCurrency(product.originalPrice)}
          </span>
        ) : null}
      </div>
      <div className="mt-2 h-3 bg-surface-container-high rounded-full relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          style={{ width: `${progress}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-on-primary">
          Đã bán {soldInEvent}
        </span>
      </div>
    </Link>
  )
}

export default function FlashSaleSection() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadFlashSale() {
      try {
        const data = await apiGet('/api/products?flashSale=true&limit=12')
        if (!ignore) setProducts(data.data || [])
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được flash sale')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadFlashSale()

    return () => {
      ignore = true
    }
  }, [])

  if (!loading && !products.length && !error) return null

  return (
    <section className="max-w-container-max mx-auto px-margin-desktop mb-12">
      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flash-sale-gradient p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bolt
              </span>
              <h2 className="font-headline-md text-headline-md italic uppercase">
                Flash Sale
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-body-md opacity-80">Kết thúc sau:</span>
              <Countdown products={products} />
            </div>
          </div>
          <a className="text-white hover:underline font-label-md text-label-md" href="#flash-sale">
            Xem tất cả
          </a>
        </div>

        {error ? (
          <div className="m-6 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-body-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        <div id="flash-sale" className="p-6 overflow-x-auto custom-scrollbar">
          <div className="flex gap-gutter min-w-max">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="w-48 h-[288px] rounded-lg bg-surface-container animate-pulse" />
                ))
              : products.map((product) => (
                  <FlashSaleProductCard key={product.id || product.slug} product={product} />
                ))}
          </div>
        </div>
      </div>
    </section>
  )
}
