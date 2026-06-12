import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import Footer from '../../components/Footer/Footer'
import Header from '../../components/Header/Header'
import { apiAssetUrl, apiGet } from '../../lib/api'
import { formatCompact, formatCurrency, productPath } from '../../lib/format'

const fallbackImage = '/logo_shop.png'

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'sold', label: 'Bán chạy' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
]

const ratingOptions = [
  { value: '4.5', label: 'Từ 4.5 sao' },
  { value: '4', label: 'Từ 4 sao' },
  { value: '3', label: 'Từ 3 sao' },
]

function getParam(searchParams, key, fallback = '') {
  return searchParams.get(key) || fallback
}

function setOrDelete(nextParams, key, value) {
  if (value === undefined || value === null || value === '') nextParams.delete(key)
  else nextParams.set(key, String(value))
}

function Rating({ value }) {
  return (
    <span className="flex items-center gap-1 text-[12px] font-bold text-[#6b4d3e]">
      <span className="material-symbols-outlined text-[14px] text-[#f59e0b]" style={{ fontVariationSettings: "'FILL' 1" }}>
        star
      </span>
      {Number(value || 0).toFixed(1)}
    </span>
  )
}

function ProductCard({ product }) {
  const imageSrc = apiAssetUrl(product.thumbnailUrl || product.imageUrl) || fallbackImage
  const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price)
  const discount = hasDiscount
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0

  return (
    <Link className="group flex h-full flex-col rounded-xl border border-[#eaded2] bg-white p-3 shadow-[0_8px_22px_rgba(60,42,22,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#c98225] hover:shadow-[0_14px_30px_rgba(60,42,22,0.12)]" to={productPath(product)}>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f6f1ec]">
        <img className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" src={imageSrc} alt={product.name} />
        {discount ? <span className="absolute left-2 top-2 rounded-md bg-[#ff5722] px-2 py-1 text-[10px] font-bold text-white">-{discount}%</span> : null}
        {product.flashSale?.isActive ? <span className="absolute bottom-2 left-2 rounded-md bg-[#c21d0b] px-2 py-1 text-[10px] font-bold text-white">Flash Sale</span> : null}
      </div>
      <h3 className="mt-3 line-clamp-2 min-h-10 text-[13px] font-semibold leading-5 text-[#1d1712]">{product.name}</h3>
      <div className="mt-auto pt-3">
        <p className="text-[18px] font-bold text-[#c21d0b]">{formatCurrency(product.price)}</p>
        {hasDiscount ? <p className="text-[11px] text-[#8a7567] line-through">{formatCurrency(product.originalPrice)}</p> : null}
        <div className="mt-2 flex items-center justify-between gap-2">
          <Rating value={product.ratingAvg} />
          <span className="text-[12px] font-medium text-[#7b6556]">Đã bán {formatCompact(product.soldCount)}</span>
        </div>
        <p className="mt-2 truncate border-t border-[#f0e7df] pt-2 text-[11px] font-medium text-[#7b6556]">
          {product.shop?.name || 'ShopBee'}
        </p>
      </div>
    </Link>
  )
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [shops, setShops] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const keyword = getParam(searchParams, 'q')
  const sort = getParam(searchParams, 'sort', 'newest')
  const minRating = getParam(searchParams, 'rating')
  const shopId = getParam(searchParams, 'shopId')
  const minPrice = getParam(searchParams, 'minPrice')
  const maxPrice = getParam(searchParams, 'maxPrice')
  const promotion = getParam(searchParams, 'promotion')

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    setOrDelete(params, 'search', keyword)
    setOrDelete(params, 'sort', sort)
    setOrDelete(params, 'minRating', minRating)
    setOrDelete(params, 'shopId', shopId)
    setOrDelete(params, 'minPrice', minPrice)
    setOrDelete(params, 'maxPrice', maxPrice)
    setOrDelete(params, 'promotion', promotion)
    params.set('limit', '48')
    return params.toString()
  }, [keyword, maxPrice, minPrice, minRating, promotion, shopId, sort])

  useEffect(() => {
    let ignore = false

    async function loadProducts() {
      setLoading(true)
      setError('')
      try {
        const response = await apiGet(`/api/products?${queryString}`)
        if (!ignore) {
          setProducts(response.data || [])
          setShops(response.filters?.shops || [])
          setTotal(Number(response.pagination?.total || 0))
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được kết quả tìm kiếm')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadProducts()

    return () => {
      ignore = true
    }
  }, [queryString])

  function updateFilter(key, value) {
    const nextParams = new URLSearchParams(searchParams)
    setOrDelete(nextParams, key, value)
    setSearchParams(nextParams)
  }

  function applyPriceFilter(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextParams = new URLSearchParams(searchParams)
    setOrDelete(nextParams, 'minPrice', formData.get('minPrice'))
    setOrDelete(nextParams, 'maxPrice', formData.get('maxPrice'))
    setSearchParams(nextParams)
  }

  function clearFilters() {
    const nextParams = new URLSearchParams()
    setOrDelete(nextParams, 'q', keyword)
    setSearchParams(nextParams)
  }

  return (
    <>
      <Header />
      <main className="min-h-[640px] bg-[#f7f4f1] pb-14 pt-20">
        <section className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="rounded-xl bg-[#21150f] px-5 py-7 text-white shadow-[0_14px_40px_rgba(23,18,14,0.16)] md:px-8">
            <p className="text-[12px] font-bold uppercase text-[#ffcf9a]">Tìm kiếm sản phẩm</p>
            <h1 className="mt-2 text-[30px] font-bold leading-[1.15]">
              {keyword ? `Kết quả cho “${keyword}”` : 'Tất cả sản phẩm'}
            </h1>
            <p className="mt-2 text-[14px] text-white/80">Lọc nhanh theo đánh giá, bán chạy, shop, giá và khuyến mãi.</p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="space-y-4 rounded-xl border border-[#eaded2] bg-white p-4 shadow-[0_8px_22px_rgba(60,42,22,0.04)] lg:self-start">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-bold text-[#15110d]">Bộ lọc</h2>
                <button className="text-[12px] font-bold text-[#995900] hover:text-[#7b4600]" type="button" onClick={clearFilters}>
                  Xóa lọc
                </button>
              </div>

              <section>
                <h3 className="text-[13px] font-bold text-[#4b3527]">Đánh giá</h3>
                <div className="mt-2 space-y-2">
                  {ratingOptions.map((option) => (
                    <label key={option.value} className="flex cursor-pointer items-center gap-2 text-[13px] text-[#5b4039]">
                      <input className="rounded border-[#dfc8b5] text-[#c57900] focus:ring-[#c57900]" type="radio" name="rating" checked={minRating === option.value} onChange={() => updateFilter('rating', option.value)} />
                      {option.label}
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[13px] font-bold text-[#4b3527]">Thương hiệu / shop</h3>
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
                  {shops.map((shop) => (
                    <label key={shop.id} className="flex cursor-pointer items-center justify-between gap-2 text-[13px] text-[#5b4039]">
                      <span className="flex min-w-0 items-center gap-2">
                        <input className="rounded border-[#dfc8b5] text-[#c57900] focus:ring-[#c57900]" type="radio" name="shop" checked={shopId === String(shop.id)} onChange={() => updateFilter('shopId', shop.id)} />
                        <span className="truncate">{shop.name}</span>
                      </span>
                      <span className="text-[11px] text-[#8a7567]">{shop.productCount}</span>
                    </label>
                  ))}
                  {!shops.length ? <p className="text-[12px] text-[#8a7567]">Chưa có shop phù hợp.</p> : null}
                </div>
              </section>

              <section>
                <h3 className="text-[13px] font-bold text-[#4b3527]">Khoảng giá</h3>
                <form className="mt-2 grid gap-2" onSubmit={applyPriceFilter}>
                  <input className="h-9 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] focus:border-[#c98225] focus:ring-0" name="minPrice" type="number" min="0" placeholder="Từ" defaultValue={minPrice} />
                  <input className="h-9 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] focus:border-[#c98225] focus:ring-0" name="maxPrice" type="number" min="0" placeholder="Đến" defaultValue={maxPrice} />
                  <button className="h-9 rounded-lg bg-[#995900] text-[12px] font-bold text-white hover:bg-[#7b4600]" type="submit">
                    Áp dụng giá
                  </button>
                </form>
              </section>

              <section>
                <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#5b4039]">
                  <input className="rounded border-[#dfc8b5] text-[#c57900] focus:ring-[#c57900]" type="checkbox" checked={promotion === 'true'} onChange={(event) => updateFilter('promotion', event.target.checked ? 'true' : '')} />
                  Đang khuyến mãi
                </label>
              </section>
            </aside>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eaded2] bg-white px-4 py-3 shadow-[0_8px_22px_rgba(60,42,22,0.04)]">
                <p className="text-[13px] font-semibold text-[#6b4d3e]">
                  {loading ? 'Đang tìm kiếm...' : `${total} sản phẩm phù hợp`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`h-9 rounded-lg px-3 text-[12px] font-bold ${sort === option.value ? 'bg-[#995900] text-white' : 'border border-[#dfc8b5] bg-white text-[#4b3527] hover:border-[#9a5700]'}`}
                      type="button"
                      onClick={() => updateFilter('sort', option.value === 'newest' ? '' : option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-body-sm text-on-error-container">
                  {error}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="h-[304px] animate-pulse rounded-xl border border-[#eaded2] bg-white" />
                    ))
                  : products.map((product) => <ProductCard key={product.id || product.slug} product={product} />)}
              </div>

              {!loading && !products.length ? (
                <div className="rounded-xl border border-[#eaded2] bg-white p-8 text-center text-[13px] text-[#7b6556]">
                  Không tìm thấy sản phẩm phù hợp.
                </div>
              ) : null}
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
