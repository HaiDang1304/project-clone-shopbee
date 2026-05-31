import { useEffect } from 'react'
import ProductShellHeader from '../../components/ProductDetail/ProductShellHeader/ProductShellHeader'
import Breadcrumbs from '../../components/ProductDetail/Breadcrumbs/Breadcrumbs'
import ProductGallery from '../../components/ProductDetail/ProductGallery/ProductGallery'
import ProductPurchaseCard from '../../components/ProductDetail/ProductPurchaseCard/ProductPurchaseCard'
import ShopInfoCard from '../../components/ProductDetail/ShopInfoCard/ShopInfoCard'
import ProductDescription from '../../components/ProductDetail/ProductDescription/ProductDescription'
import ProductReviews from '../../components/ProductDetail/ProductReviews/ProductReviews'
import AIConsultationWidget from '../../components/ProductDetail/AIConsultationWidget/AIConsultationWidget'
import ProductShellFooter from '../../components/ProductDetail/ProductShellFooter/ProductShellFooter'

export default function ProductDetailPage() {
  useEffect(() => {
    document.title = 'Chi tiết sản phẩm | ShopBee'
  }, [])

  return (
    <>
      <ProductShellHeader />
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
        <Breadcrumbs />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-5">
            <ProductGallery />
          </div>
          <div className="lg:col-span-7 space-y-6">
            <ProductPurchaseCard />
            <ShopInfoCard />
            <ProductDescription />
            <ProductReviews />
          </div>
        </div>
      </main>
      <AIConsultationWidget />
      <ProductShellFooter />
    </>
  )
}
