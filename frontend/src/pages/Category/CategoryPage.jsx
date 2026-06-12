import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import Footer from '../../components/Footer/Footer'
import Header from '../../components/Header/Header'
import { apiAssetUrl, apiGet } from '../../lib/api'
import { formatCompact, formatCurrency, productPath } from '../../lib/format'

const fallbackImage = '/logo_shop.png'

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'popular', label: 'Bán chạy' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
]

const categoryHeroImages = {
  'dien-tu': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1400&q=85',
  'thoi-trang': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85',
  'gia-dung': 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=85',
  'lam-dep': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1400&q=85',
  'the-thao': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=85',
  'suc-khoe': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1400&q=85',
}

function sortProducts(products, sortValue) {
  const nextProducts = [...products]
  if (sortValue === 'popular') return nextProducts.sort((a, b) => Number(b.soldCount || 0) - Number(a.soldCount || 0))
  if (sortValue === 'price_asc') return nextProducts.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
  if (sortValue === 'price_desc') return nextProducts.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
  return nextProducts
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
      </div>
      <h3 className="mt-3 line-clamp-2 min-h-10 text-[13px] font-semibold leading-5 text-[#1d1712]">{product.name}</h3>
      <div className="mt-auto pt-3">
        <p className="text-[18px] font-bold text-[#c21d0b]">{formatCurrency(product.price)}</p>
        {hasDiscount ? <p className="text-[11px] text-[#8a7567] line-through">{formatCurrency(product.originalPrice)}</p> : null}
        <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-[#7b6556]">
          <span>{product.shop?.name || 'ShopBee'}</span>
          <span>Đã bán {formatCompact(product.soldCount)}</span>
        </div>
      </div>
    </Link>
  )
}

export default function CategoryPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const activeSort = searchParams.get('sort') || 'newest'
  const activeCategory = categories.find((category) => category.slug === slug)
  const sortedProducts = useMemo(() => sortProducts(products, activeSort), [activeSort, products])

  useEffect(() => {
    let ignore = false

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [categoryResponse, productResponse] = await Promise.all([
          apiGet('/api/categories'),
          apiGet(`/api/products?category=${encodeURIComponent(slug || '')}&limit=48`),
        ])
        if (!ignore) {
          setCategories(categoryResponse.data || [])
          setProducts(productResponse.data || [])
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được danh mục')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [slug])

  function updateSort(value) {
    setSearchParams(value === 'newest' ? {} : { sort: value })
  }

  return (
    <>
      <Header />
      <main className="min-h-[640px] bg-[#f7f4f1] pb-14 pt-20">
        <section className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="relative overflow-hidden rounded-xl bg-[#21150f] px-5 py-8 text-white shadow-[0_14px_40px_rgba(23,18,14,0.16)] md:px-8">
            <img className="absolute inset-0 h-full w-full object-cover opacity-45" src={categoryHeroImages[slug] || categoryHeroImages['dien-tu']} alt={activeCategory?.name || 'Danh mục'} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
            <div className="relative z-10 max-w-2xl">
              <p className="text-[12px] font-bold uppercase text-[#ffcf9a]">Danh mục ShopBee</p>
              <h1 className="mt-2 text-[34px] font-bold leading-[1.1]">{activeCategory?.name || 'Danh mục sản phẩm'}</h1>
              <p className="mt-3 text-[15px] leading-6 text-white/85">
                Khám phá sản phẩm nổi bật, deal tốt và các shop uy tín trong danh mục này.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="rounded-xl border border-[#eaded2] bg-white p-4 shadow-[0_8px_22px_rgba(60,42,22,0.04)] lg:self-start">
              <h2 className="text-[15px] font-bold text-[#15110d]">Danh mục</h2>
              <div className="mt-3 space-y-1">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${category.slug === slug ? 'bg-[#fff2df] text-[#9a5700]' : 'text-[#5b4039] hover:bg-[#fbfaf9] hover:text-[#9a5700]'}`}
                    to={`/category/${category.slug}`}
                  >
                    {category.name}
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>
                ))}
              </div>
            </aside>

            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eaded2] bg-white px-4 py-3 shadow-[0_8px_22px_rgba(60,42,22,0.04)]">
                <p className="text-[13px] font-semibold text-[#6b4d3e]">
                  {loading ? 'Đang tải sản phẩm...' : `${sortedProducts.length} sản phẩm`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`h-9 rounded-lg px-3 text-[12px] font-bold ${activeSort === option.value ? 'bg-[#995900] text-white' : 'border border-[#dfc8b5] bg-white text-[#4b3527] hover:border-[#9a5700]'}`}
                      type="button"
                      onClick={() => updateSort(option.value)}
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
                  : sortedProducts.map((product) => <ProductCard key={product.id || product.slug} product={product} />)}
              </div>

              {!loading && !sortedProducts.length ? (
                <div className="rounded-xl border border-[#eaded2] bg-white p-8 text-center text-[13px] text-[#7b6556]">
                  Chưa có sản phẩm trong danh mục này.
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
