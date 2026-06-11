export default function ProductShellFooter() {
  return (
    <footer className="bg-surface-container-highest dark:bg-surface-variant mt-12 border-t border-outline-variant/10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop py-12 max-w-container-max mx-auto">
        <div className="space-y-4">
          <span className="font-headline-md text-on-surface">ShopBee</span>
          <p className="text-on-surface-variant font-body-md">
            © 2026 ShopBee. Nền tảng thương mại điện tử hàng đầu tích hợp AI
            thông minh.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-title-md uppercase text-on-surface">Về chúng tôi</h4>
          <div className="flex flex-col gap-2">
            <a
              className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
              href="#"
            >
              Về chúng tôi
            </a>
            <a
              className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
              href="#"
            >
              Chính sách bảo mật
            </a>
            <a
              className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
              href="#"
            >
              Điều khoản sử dụng
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-title-md uppercase text-on-surface">Hỗ trợ khách hàng</h4>
          <div className="flex flex-col gap-2">
            <a
              className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
              href="#"
            >
              Trung tâm trợ giúp
            </a>
            <a
              className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
              href="#"
            >
              Liên hệ
            </a>
            <a
              className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
              href="#"
            >
              Phương thức thanh toán
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-title-md uppercase text-on-surface">Theo dõi chúng tôi</h4>
          <div className="flex gap-4">
            <a
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary hover:text-white transition-all"
              href="#"
              aria-label="Website"
            >
              <span className="material-symbols-outlined">public</span>
            </a>
            <a
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary hover:text-white transition-all"
              href="#"
              aria-label="Chia sẻ"
            >
              <span className="material-symbols-outlined">share</span>
            </a>
          </div>

          <div className="pt-4">
            <p className="text-on-surface-variant font-label-md">
              Đăng ký nhận tin khuyến mãi
            </p>
            <div className="mt-2 flex">
              <input
                className="bg-surface-container-low border-none rounded-l-lg h-10 px-4 w-full text-body-md"
                placeholder="Email của bạn"
                type="email"
              />
              <button className="bg-primary text-white px-4 rounded-r-lg" type="button">
                Gửi
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
