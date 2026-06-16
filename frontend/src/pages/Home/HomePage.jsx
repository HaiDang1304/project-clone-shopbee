import Header from '../../components/Header/Header'
import HeroSection from '../../components/HeroSection/HeroSection'
import SalesBannerSlider from '../../components/SalesBannerSlider/SalesBannerSlider'
import FlashSaleSection from '../../components/FlashSaleSection/FlashSaleSection'
import CategoriesGrid from '../../components/CategoriesGrid/CategoriesGrid'
import RecommendationGrid from '../../components/RecommendationGrid/RecommendationGrid'
import Footer from '../../components/Footer/Footer'

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="bg-[#f7f4f1] pb-12 pt-20">
        <HeroSection />
        <FlashSaleSection />
        <CategoriesGrid />
        <SalesBannerSlider />
        <RecommendationGrid />
      </main>
      <Footer />
    </>
  )
}
