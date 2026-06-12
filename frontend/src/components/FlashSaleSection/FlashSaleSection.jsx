import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiAssetUrl, apiGet } from '../../lib/api'
import { formatCurrency, productPath } from '../../lib/format'

const fallbackImage = '/logo_shop.png'

function pad2(value) {
  return String(value).padStart(2, '0')
}

function Countdown({ products }) {
  const [fallbackEndAt] = useState(() => Date.now() + 2 * 3600 * 1000)
  const [now, setNow] = useState(() => Date.now())
  const endAt = useMemo(() => {
    const dates = products
      .map((product) => product.flashSale?.endAt)
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter(Number.isFinite)

    return dates.length ? Math.min(...dates) : fallbackEndAt
  }, [fallbackEndAt, products])

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const secondsLeft = useMemo(() => Math.max(0, Math.floor((endAt - now) / 1000)), [endAt, now])

  const { h, m, s } = useMemo(() => {
    const hVal = Math.floor(secondsLeft / 3600)
    const mVal = Math.floor((secondsLeft % 3600) / 60)
    const sVal = secondsLeft % 60
    return { h: hVal, m: mVal, s: sVal }
  }, [secondsLeft])

  return (
    <div className="flex items-center gap-1" aria-label="Đếm ngược flash sale">
      {[h, m, s].map((value, index) => (
        <span key={index} className="rounded-md bg-white px-2 py-1 text-[13px] font-bold text-[#b42318]">
          {pad2(value)}
        </span>
      ))}
    </div>
  )
}

function FlashSaleProductCard({ product }) {
  const imageSrc = apiAssetUrl(product.thumbnailUrl || product.imageUrl) || fallbackImage
  const flashSale = product.flashSale || {}
  const discount = Number(flashSale.discountPercent || 0)
  const eventStock = Number(flashSale.eventStock || 0)
  const soldInEvent = Number(flashSale.soldInEvent || 0)
  const progress = eventStock > 0 ? Math.min(100, Math.round((soldInEvent / eventStock) * 100)) : 0

  return (
    <Link className="group w-[184px] shrink-0 rounded-xl border border-[#f0e0d4] bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(60,42,22,0.12)]" to={productPath(product)} aria-label={product.name}>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f6f1ec]">
        <img
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          alt={product.name}
          src={imageSrc}
        />
        {discount ? (
          <div className="absolute right-2 top-2 rounded-md bg-[#ff5722] px-2 py-1 text-[11px] font-bold text-white">
            -{discount}%
          </div>
        ) : null}
      </div>
      <h4 className="mt-3 line-clamp-2 min-h-10 text-[13px] font-semibold leading-5 text-[#1d1712]">
        {product.name}
      </h4>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[18px] font-bold text-[#c21d0b]">
          {formatCurrency(product.price)}
        </span>
      </div>
      {product.originalPrice ? (
        <span className="mt-0.5 block text-[11px] text-[#8a7567] line-through">
          {formatCurrency(product.originalPrice)}
        </span>
      ) : null}
      <div className="mt-3 h-4 overflow-hidden rounded-full bg-[#ffe4da]">
        <div className="flex h-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff5722] to-[#c21d0b] text-[9px] font-bold text-white" style={{ width: `${Math.max(18, progress)}%` }}>
          Đã bán {soldInEvent}
        </div>
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
    <section className="mx-auto mb-10 max-w-container-max px-margin-mobile md:px-margin-desktop">
      <div className="overflow-hidden rounded-xl border border-[#ffd0c2] bg-white shadow-[0_12px_30px_rgba(178,47,0,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#c21d0b] via-[#ff5722] to-[#ff8a00] px-4 py-3 text-white">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                bolt
              </span>
              <h2 className="text-[24px] font-black uppercase italic leading-7">Flash Sale</h2>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-black/18 px-3 py-2">
              <span className="text-[12px] font-semibold">Kết thúc sau</span>
              <Countdown products={products} />
            </div>
          </div>
          <a className="rounded-lg bg-white px-4 py-2 text-[12px] font-bold text-[#b42318] hover:bg-[#fff4ef]" href="#flash-sale">
            Xem tất cả
          </a>
        </div>

        {error ? (
          <div className="m-4 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-body-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        <div id="flash-sale" className="overflow-x-auto p-4 custom-scrollbar">
          <div className="flex min-w-max gap-3">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[300px] w-[184px] shrink-0 animate-pulse rounded-xl border border-[#f0e0d4] bg-white" />
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
