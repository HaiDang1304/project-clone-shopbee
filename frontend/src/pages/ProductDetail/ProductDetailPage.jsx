import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import Headers from '../../components/Header/Header'
import Breadcrumbs from '../../components/ProductDetail/Breadcrumbs/Breadcrumbs'
import ProductGallery from '../../components/ProductDetail/ProductGallery/ProductGallery'
import ProductPurchaseCard from '../../components/ProductDetail/ProductPurchaseCard/ProductPurchaseCard'
import ShopInfoCard from '../../components/ProductDetail/ShopInfoCard/ShopInfoCard'
import ProductDescription from '../../components/ProductDetail/ProductDescription/ProductDescription'
import ProductReviews from '../../components/ProductDetail/ProductReviews/ProductReviews'
import ProductShellFooter from '../../components/ProductDetail/ProductShellFooter/ProductShellFooter'
import { apiGet } from '../../lib/api'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadProduct() {
      setLoading(true)
      setError('')

      try {
        let idOrSlug = slug

        if (!idOrSlug) {
          const productsData = await apiGet('/api/products?limit=1')
          const firstProduct = productsData.data?.[0]
          idOrSlug = firstProduct?.slug || firstProduct?.id
        }

        if (!idOrSlug) {
          if (!ignore) setProduct(null)
          return
        }

        const detailData = await apiGet(`/api/products/${encodeURIComponent(idOrSlug)}`)
        if (!ignore) {
          setProduct(detailData.data || null)
          document.title = `${detailData.data?.name || 'Chi tiết sản phẩm'} | ShopBee`
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được sản phẩm')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadProduct()

    return () => {
      ignore = true
    }
  }, [slug])

  return (
    <>
      < Headers/>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            <div className="lg:col-span-5 h-[520px] rounded-xl bg-surface-container animate-pulse" />
            <div className="lg:col-span-7 h-[520px] rounded-xl bg-surface-container animate-pulse" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-error/30 bg-error-container/40 px-6 py-5 text-on-error-container">
            {error}
          </div>
        ) : product ? (
          <>
            <Breadcrumbs product={product} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
              <div className="lg:col-span-5">
                <ProductGallery product={product} />
              </div>
              <div className="lg:col-span-7 space-y-6">
                <ProductPurchaseCard product={product} />
                <ShopInfoCard shop={product.shop} />
                <ProductDescription product={product} />
                <ProductReviews product={product} />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-surface-container bg-surface-container-lowest px-6 py-5 text-on-surface-variant">
            Chưa có sản phẩm.
          </div>
        )}
      </main>
      <ProductShellFooter />
    </>
  )
}
