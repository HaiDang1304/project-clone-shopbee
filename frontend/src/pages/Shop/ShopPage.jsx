import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import Footer from '../../components/Footer/Footer'
import Header from '../../components/Header/Header'
import ShopChatModal from '../../components/ShopChatModal/ShopChatModal'
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
        <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-[#7b6556]">
          <span>{Number(product.ratingAvg || 0).toFixed(1)} sao</span>
          <span>Đã bán {formatCompact(product.soldCount)}</span>
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
  const [chatOpen, setChatOpen] = useState(false)

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

  return (
    <>
      <Header />
      <main className="min-h-[640px] bg-[#f7f4f1] pb-14 pt-20">
        <section className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div> : null}

          <div className="relative overflow-hidden rounded-xl bg-[#24170f] px-5 py-7 text-white shadow-[0_14px_40px_rgba(23,18,14,0.16)] md:px-8">
            {coverSrc ? <img className="absolute inset-0 h-full w-full object-cover opacity-35" src={coverSrc} alt="" aria-hidden="true" /> : null}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
            <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <img className="h-20 w-20 shrink-0 rounded-full border-2 border-white object-cover" src={avatarSrc} alt={shop?.name || 'Shop'} />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold uppercase text-[#ffcf9a]">Gian hàng ShopBee</p>
                  <h1 className="mt-1 truncate text-[30px] font-bold leading-[1.1]">{shop?.name || (loading ? 'Đang tải shop...' : 'Shop')}</h1>
                  <p className="mt-2 line-clamp-2 max-w-2xl text-[14px] text-white/80">
                    {shop?.description || `${shop?.province || 'Việt Nam'} · ${formatCompact(shop?.productCount)} sản phẩm trưng bày`}
                  </p>
                </div>
              </div>
              <button className="h-11 rounded-lg bg-white px-5 text-[13px] font-bold text-[#8a4b12] hover:bg-[#fff2df]" type="button" onClick={() => setChatOpen(true)} disabled={!shop}>
                Chat với shop
              </button>
            </div>
            <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-4">
              {[
                ['Sản phẩm', formatCompact(shop?.productCount)],
                ['Đã bán', formatCompact(shop?.soldCount)],
                ['Đánh giá', Number(shop?.ratingAvg || 0).toFixed(1)],
                ['Theo dõi', formatCompact(shop?.followerCount)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white/10 px-4 py-3">
                  <p className="text-[12px] text-white/70">{label}</p>
                  <p className="mt-1 text-[18px] font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="space-y-4 rounded-xl border border-[#eaded2] bg-white p-4 shadow-[0_8px_22px_rgba(60,42,22,0.04)] lg:self-start">
              <form onSubmit={submitSearch}>
                <label className="text-[13px] font-bold text-[#4b3527]" htmlFor="shop-search">Tìm trong shop</label>
                <div className="mt-2 flex gap-2">
                  <input id="shop-search" className="h-9 min-w-0 flex-1 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] focus:border-[#c98225] focus:ring-0" name="q" defaultValue={search} placeholder="Tên sản phẩm" />
                  <button className="h-9 rounded-lg bg-[#995900] px-3 text-[12px] font-bold text-white" type="submit">Tìm</button>
                </div>
              </form>

              <section>
                <h2 className="text-[13px] font-bold text-[#4b3527]">Danh mục</h2>
                <div className="mt-2 space-y-1">
                  <button className={`w-full rounded-lg px-3 py-2 text-left text-[13px] font-semibold ${!category ? 'bg-[#fff2df] text-[#9a5700]' : 'text-[#5b4039] hover:bg-[#fbfaf9]'}`} type="button" onClick={() => updateFilter('category', '')}>
                    Tất cả sản phẩm
                  </button>
                  {categories.map((item) => (
                    <button key={item.id} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-semibold ${category === item.slug ? 'bg-[#fff2df] text-[#9a5700]' : 'text-[#5b4039] hover:bg-[#fbfaf9]'}`} type="button" onClick={() => updateFilter('category', item.slug)}>
                      <span className="truncate">{item.name}</span>
                      <span className="text-[11px] text-[#8a7567]">{item.productCount}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-[13px] font-bold text-[#4b3527]">Khoảng giá</h2>
                <form className="mt-2 grid gap-2" onSubmit={applyPriceFilter}>
                  <input className="h-9 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] focus:border-[#c98225] focus:ring-0" name="minPrice" type="number" min="0" placeholder="Từ" defaultValue={minPrice} />
                  <input className="h-9 rounded-lg border-[#dfc8b5] bg-[#fbfaf9] text-[13px] focus:border-[#c98225] focus:ring-0" name="maxPrice" type="number" min="0" placeholder="Đến" defaultValue={maxPrice} />
                  <button className="h-9 rounded-lg bg-[#995900] text-[12px] font-bold text-white" type="submit">Áp dụng</button>
                </form>
              </section>

              <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#5b4039]">
                <input className="rounded border-[#dfc8b5] text-[#c57900] focus:ring-[#c57900]" type="checkbox" checked={promotion === 'true'} onChange={(event) => updateFilter('promotion', event.target.checked ? 'true' : '')} />
                Đang khuyến mãi
              </label>
            </aside>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eaded2] bg-white px-4 py-3 shadow-[0_8px_22px_rgba(60,42,22,0.04)]">
                <p className="text-[13px] font-semibold text-[#6b4d3e]">{loading ? 'Đang tải sản phẩm...' : `${total} sản phẩm trong shop`}</p>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <button key={option.value} className={`h-9 rounded-lg px-3 text-[12px] font-bold ${sort === option.value ? 'bg-[#995900] text-white' : 'border border-[#dfc8b5] bg-white text-[#4b3527] hover:border-[#9a5700]'}`} type="button" onClick={() => updateFilter('sort', option.value === 'newest' ? '' : option.value)}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[304px] animate-pulse rounded-xl border border-[#eaded2] bg-white" />)
                  : products.map((product) => <ProductCard key={product.id || product.slug} product={product} />)}
              </div>

              {!loading && !products.length ? (
                <div className="rounded-xl border border-[#eaded2] bg-white p-8 text-center text-[13px] text-[#7b6556]">
                  Không có sản phẩm phù hợp với bộ lọc hiện tại.
                </div>
              ) : null}
            </section>
          </div>
        </section>
      </main>
      <ShopChatModal open={chatOpen} shop={shop} onClose={() => setChatOpen(false)} />
      <Footer />
    </>
  )
}
