import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

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

function setOrDelete(params, key, value) {
  if (value === undefined || value === null || value === '') params.delete(key)
  else params.set(key, String(value))
}

function ProductCard({ product }) {
  const imageSrc = apiAssetUrl(product.thumbnailUrl || product.imageUrl) || fallbackImage
  const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price)
  const discount = hasDiscount
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0

  return (
    <Link
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#e7ddd5] bg-white transition hover:border-[#d45b32] hover:shadow-[0_12px_28px_rgba(37,31,27,0.1)]"
      to={productPath(product)}
    >
      <div className="relative aspect-square bg-[#f2efea]">
        <img className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" src={imageSrc} alt={product.name} />
        {discount ? (
          <span className="absolute left-2 top-2 rounded bg-[#d43f24] px-2 py-1 text-[10px] font-bold text-white">
            -{discount}%
          </span>
        ) : null}
        {product.flashSale?.isActive ? (
          <span className="absolute bottom-2 left-2 rounded bg-[#1f6f58] px-2 py-1 text-[10px] font-bold text-white">
            Flash Sale
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-10 text-[13px] font-semibold leading-5 text-[#201915]">
          {product.name}
        </h3>
        <div className="mt-auto pt-3">
          <p className="text-[17px] font-bold text-[#c83d23]">{formatCurrency(product.price)}</p>
          {hasDiscount ? (
            <p className="text-[11px] text-[#8a7a70] line-through">{formatCurrency(product.originalPrice)}</p>
          ) : null}
          <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-[#6f625a]">
            <span>{Number(product.ratingAvg || 0).toFixed(1)} sao</span>
            <span>Đã bán {formatCompact(product.soldCount)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function ShopPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const sort = searchParams.get('sort') || 'newest'
  const search = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const promotion = searchParams.get('promotion') || ''

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    setOrDelete(params, 'sort', sort === 'newest' ? '' : sort)
    setOrDelete(params, 'search', search)
    setOrDelete(params, 'category', category)
    setOrDelete(params, 'minPrice', minPrice)
    setOrDelete(params, 'maxPrice', maxPrice)
    setOrDelete(params, 'promotion', promotion)
    params.set('limit', '48')
    return params.toString()
  }, [category, maxPrice, minPrice, promotion, search, sort])

  useEffect(() => {
    let ignore = false

    async function loadShop() {
      setLoading(true)
      setError('')
      try {
        const response = await apiGet(`/api/shops/${encodeURIComponent(slug || '')}?${queryString}`)
        const data = response.data || {}
        if (!ignore) {
          setShop(data.shop || null)
          setProducts(data.products || [])
          setCategories(data.filters?.categories || [])
          setTotal(Number(data.pagination?.total || 0))
          document.title = `${data.shop?.name || 'Shop'} | ShopBee`
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được shop')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadShop()

    return () => {
      ignore = true
    }
  }, [queryString, slug])

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

  function submitSearch(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    updateFilter('q', formData.get('q'))
  }

  const avatarSrc = apiAssetUrl(shop?.avatarUrl) || fallbackImage
  const coverSrc = apiAssetUrl(shop?.coverUrl) || ''
  const shopPlace = [shop?.province, formatCompact(shop?.productCount) ? `${formatCompact(shop?.productCount)} sản phẩm` : '']
    .filter(Boolean)
    .join(' · ')
  const stats = [
    ['Sản phẩm', formatCompact(shop?.productCount)],
    ['Đã bán', formatCompact(shop?.soldCount)],
    ['Đánh giá', Number(shop?.ratingAvg || 0).toFixed(1)],
    ['Theo dõi', formatCompact(shop?.followerCount)],
  ]

  return (
    <>
      <Header />
      <main className="relative z-0 min-h-[640px] bg-[#f5f6f1] pb-14 pt-20">
        <section className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          ) : null}

          <section className="relative isolate z-0 overflow-hidden rounded-xl border border-[#e2dbd3] bg-white shadow-[0_10px_28px_rgba(44,37,31,0.08)]">
            <div className="relative z-0 h-36 overflow-hidden bg-[#e9ece3] sm:h-44 lg:h-56">
              {coverSrc ? (
                <>
                  <img className="absolute inset-0 z-0 h-full w-full object-cover opacity-100 scale-[1.01]" src={coverSrc} alt="" aria-hidden="true" />
                  <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/10 via-black/25 to-black/55" />
                
                </>
              ) : (
                <div className="relative z-10 flex h-full items-end justify-between bg-[#e4eadf] px-5 py-4 text-[#526052]">
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em]">ShopBee Storefront</span>
                  <span className="hidden text-[12px] font-semibold sm:block">Sản phẩm chọn lọc từ gian hàng</span>
                </div>
              )}
            </div>

            <div className="relative z-30 px-4 pb-5 sm:px-6 lg:px-8 lg:pb-7">
              <div className="-mt-10 flex flex-col gap-4 lg:-mt-12 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
                  <img
                    className="relative z-40 h-24 w-24 shrink-0 rounded-2xl border-4 border-white bg-white object-cover shadow-[0_8px_22px_rgba(35,28,22,0.18)]"
                    src={avatarSrc}
                    alt={shop?.name || 'Shop'}
                  />
                  <div className="min-w-0 pb-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#d45b32]">Gian hàng ShopBee</p>
                    <h1 className="mt-1 line-clamp-2 text-[28px] font-bold leading-tight text-[#1f1915] sm:text-[34px]">
                      {shop?.name || (loading ? 'Đang tải shop...' : 'Shop')}
                    </h1>
                    <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#665b53]">
                      {shop?.description || shopPlace || 'Không gian mua sắm của shop trên ShopBee.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                  <Link
                    className={`flex h-11 items-center justify-center rounded-lg bg-[#d45b32] px-5 text-[13px] font-bold text-white hover:bg-[#bd4926] ${!shop ? 'pointer-events-none opacity-60' : ''}`}
                    to={shop ? `/messages?shopId=${shop.id}` : '/messages'}
                  >
                    Chat với shop
                  </Link>
                  <button
                    className="h-11 rounded-lg border border-[#d7cfc8] px-5 text-[13px] font-bold text-[#3f352f] hover:border-[#d45b32] hover:text-[#d45b32]"
                    type="button"
                  >
                    Theo dõi
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {stats.map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#ebe4dc] bg-[#fbfaf7] px-3 py-3">
                    <p className="text-[12px] font-medium text-[#766a61]">{label}</p>
                    <p className="mt-1 text-[20px] font-bold leading-none text-[#201915]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:self-start">
              <div className="rounded-xl border border-[#e2dbd3] bg-white p-4 shadow-[0_8px_20px_rgba(44,37,31,0.05)]">
                <form onSubmit={submitSearch}>
                  <label className="text-[13px] font-bold text-[#302722]" htmlFor="shop-search">
                    Tìm trong shop
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="shop-search"
                      className="h-10 min-w-0 flex-1 rounded-lg border-[#ddd4cc] bg-[#fbfaf7] text-[13px] focus:border-[#d45b32] focus:ring-0"
                      name="q"
                      defaultValue={search}
                      placeholder="Tên sản phẩm"
                    />
                    <button className="h-10 rounded-lg bg-[#302722] px-4 text-[12px] font-bold text-white" type="submit">
                      Tìm
                    </button>
                  </div>
                </form>
              </div>

              <div className="rounded-xl border border-[#e2dbd3] bg-white p-4 shadow-[0_8px_20px_rgba(44,37,31,0.05)]">
                <h2 className="text-[13px] font-bold text-[#302722]">Danh mục</h2>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                  <button
                    className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold lg:flex lg:w-full lg:items-center lg:justify-between lg:rounded-lg ${
                      !category ? 'bg-[#1f6f58] text-white' : 'bg-[#f3f1ed] text-[#51463f] hover:bg-[#ebe7df]'
                    }`}
                    type="button"
                    onClick={() => updateFilter('category', '')}
                  >
                    Tất cả
                  </button>
                  {categories.map((item) => (
                    <button
                      key={item.id}
                      className={`flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold lg:w-full lg:justify-between lg:rounded-lg ${
                        category === item.slug ? 'bg-[#1f6f58] text-white' : 'bg-[#f3f1ed] text-[#51463f] hover:bg-[#ebe7df]'
                      }`}
                      type="button"
                      onClick={() => updateFilter('category', item.slug)}
                    >
                      <span className="max-w-[160px] truncate">{item.name}</span>
                      <span className="text-[11px] opacity-75">{item.productCount}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 rounded-xl border border-[#e2dbd3] bg-white p-4 shadow-[0_8px_20px_rgba(44,37,31,0.05)] sm:grid-cols-[1fr_auto] lg:block">
                <section>
                  <h2 className="text-[13px] font-bold text-[#302722]">Khoảng giá</h2>
                  <form className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-1" onSubmit={applyPriceFilter}>
                    <input className="h-10 rounded-lg border-[#ddd4cc] bg-[#fbfaf7] text-[13px] focus:border-[#d45b32] focus:ring-0" name="minPrice" type="number" min="0" placeholder="Từ" defaultValue={minPrice} />
                    <input className="h-10 rounded-lg border-[#ddd4cc] bg-[#fbfaf7] text-[13px] focus:border-[#d45b32] focus:ring-0" name="maxPrice" type="number" min="0" placeholder="Đến" defaultValue={maxPrice} />
                    <button className="col-span-2 h-10 rounded-lg bg-[#302722] text-[12px] font-bold text-white lg:col-span-1" type="submit">
                      Áp dụng
                    </button>
                  </form>
                </section>

                <label className="flex cursor-pointer items-center gap-2 self-end text-[13px] font-semibold text-[#51463f] lg:mt-4">
                  <input
                    className="rounded border-[#ddd4cc] text-[#1f6f58] focus:ring-[#1f6f58]"
                    type="checkbox"
                    checked={promotion === 'true'}
                    onChange={(event) => updateFilter('promotion', event.target.checked ? 'true' : '')}
                  />
                  Đang khuyến mãi
                </label>
              </div>
            </aside>

            <section>
              <div className="mb-4 rounded-xl border border-[#e2dbd3] bg-white p-3 shadow-[0_8px_20px_rgba(44,37,31,0.05)] sm:flex sm:items-center sm:justify-between sm:gap-3">
                <p className="px-1 text-[13px] font-semibold text-[#665b53]">
                  {loading ? 'Đang tải sản phẩm...' : `${total} sản phẩm trong shop`}
                </p>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:mt-0 sm:flex-wrap sm:justify-end sm:overflow-visible sm:pb-0">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`h-9 shrink-0 rounded-full px-4 text-[12px] font-bold ${
                        sort === option.value ? 'bg-[#d45b32] text-white' : 'border border-[#ddd4cc] bg-white text-[#3f352f] hover:border-[#d45b32]'
                      }`}
                      type="button"
                      onClick={() => updateFilter('sort', option.value === 'newest' ? '' : option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="h-[304px] animate-pulse rounded-lg border border-[#e2dbd3] bg-white" />
                    ))
                  : products.map((product) => <ProductCard key={product.id || product.slug} product={product} />)}
              </div>

              {!loading && !products.length ? (
                <div className="rounded-xl border border-[#e2dbd3] bg-white p-8 text-center text-[13px] text-[#665b53]">
                  Không có sản phẩm phù hợp với bộ lọc hiện tại.
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
