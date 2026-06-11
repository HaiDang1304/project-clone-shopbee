import Header from '../../components/Header/Header'
import HeroSection from '../../components/HeroSection/HeroSection'
import FlashSaleSection from '../../components/FlashSaleSection/FlashSaleSection'
import CategoriesGrid from '../../components/CategoriesGrid/CategoriesGrid'
import RecommendationGrid from '../../components/RecommendationGrid/RecommendationGrid'
import Footer from '../../components/Footer/Footer'

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="pt-20 pb-12">
        <HeroSection />
        <FlashSaleSection />
        <CategoriesGrid />
        <RecommendationGrid />
      </main>
      <Footer />
    </>
  )
}
