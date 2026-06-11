export default function HeroSection() {
  return (
    <section className="max-w-container-max mx-auto px-margin-desktop mb-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[400px]">
        <div className="md:col-span-8 relative overflow-hidden rounded-xl group">
          <img
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt="Banner khuyến mãi công nghệ"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCm3AMy6RfbR2D7bzXWfVT58UVuZnNkdJeuM32K4nKgwYVxTScvJtoSzESkzi2jEFtpZpK5VsX2-Y7-zdBSMqNnrt5a-tf86c8iKMyWu54Cl1-LjJ4Ilc6rtAEEVya_gLAK85q_JcGwOT8cDdfQl_uYTGS4k2IADD8uEhEe3oG2RIVZbhLlkhOQiYI_2W6f5PxRfj22uCUISg_nggF9mxyqujM_wIoImltjNaMwHcBSKNaYescrMJepv0PEtTo4ZQfgqIJ9KI3Z7XHC"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center p-12 text-white">
            <span className="bg-primary px-3 py-1 rounded-full text-label-md font-label-md w-fit mb-4">
              AI RECOMENDATION
            </span>
            <h2 className="font-display-lg text-display-lg mb-4 max-w-md">
              Siêu Hội Công Nghệ Bùng Nổ
            </h2>
            <p className="font-body-lg text-body-lg mb-8 max-w-sm opacity-90">
              Giảm đến 50% cho các thiết bị thông minh thế hệ mới nhất. Chỉ có tại
              AI Market.
            </p>
            <button
              className="bg-primary-container text-white px-8 py-3 rounded-lg font-title-md text-title-md w-fit hover:brightness-110 transition-all active:scale-95"
              type="button"
            >
              Mua Ngay
            </button>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="flex-1 relative rounded-xl overflow-hidden group">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt="Xu hướng thời trang"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBd2EkOu6S5NZq-AxKR7J-QRaaRQshl3WRnwavPcZ1e-GGRWp5VZ4wH6dKNznmxDu1XQ1DP-I-T6nz8LP_6rg0mAIXVMhK1ZRbft5E8fevyr5CWu_ycHH8mAMHbjv94pfdSDCrVA4QGQTTEUSe2NYjzR9pC9dhtwMJlvuKPyrWxHjQe3T1OoJF6NDZ28bFledsAMdx48LvFd8RnirK_VuPZb8pdGJUDVUxtLI2aSZU6ncydDgLznmIlx6X01vC5PRkkLzd7SVV2RKb1"
            />
            <div className="absolute inset-0 bg-black/20 p-6 flex flex-col justify-end text-white">
              <h3 className="font-headline-md text-headline-md">Xu Hướng 2026</h3>
              <p className="text-body-md font-body-md opacity-90">
                Bộ sưu tập thời trang thu đông
              </p>
            </div>
          </div>

          <div className="flex-1 relative rounded-xl overflow-hidden group">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt="Gia dụng thông minh"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAADNO75E3E_d-h5WXgKIJP0MfkLUp9uoqZS3oHXGdAw6U7eS6ZJvm97NNymp32cAnCQTZLTmIohlYqJ3uZnhGD2hJ-qnSt4XwVCasNInb-NU7Ls53KjDMmfMJD4BArmosgHeyGi0dRTXwJXNqCjwE75R-CQtZFo5eltBqDyg0g2smetcPpViUAm62-T55FC2_n7yZosRvRFwEhBSGlIXLXw8WWtZ4TMh8foM3zVltDFYw3EK4uDcguaKs2qSjdR2KKuZVbbDYfHVAt"
            />
            <div className="absolute inset-0 bg-black/20 p-6 flex flex-col justify-end text-white">
              <h3 className="font-headline-md text-headline-md">
                Gia Dụng Thông Minh
              </h3>
              <p className="text-body-md font-body-md opacity-90">
                Ưu đãi đến 30% hôm nay
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
