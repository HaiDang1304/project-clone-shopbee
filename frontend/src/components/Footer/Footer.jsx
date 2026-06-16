export default function Footer() {
  return (
    <footer className="bg-surface-container-highest">
      <div className="max-w-container-max mx-auto grid grid-cols-1 gap-6 px-margin-mobile py-10 md:grid-cols-4 md:gap-gutter md:px-margin-desktop md:py-12">
        <div>
          <img
            src="/logo_shop_remote.png"
            alt="ShopBee"
            className="h-30 w-auto"
          />
          <div className="flex gap-4">
            <a
              className="w-8 h-8 bg-surface-container flex items-center justify-center rounded-full text-on-surface hover:text-primary"
              href="#"
              aria-label="Website"
            >
              <span className="material-symbols-outlined text-sm">public</span>
            </a>
            <a
              className="w-8 h-8 bg-surface-container flex items-center justify-center rounded-full text-on-surface hover:text-primary"
              href="#"
              aria-label="Chia sẻ"
            >
              <span className="material-symbols-outlined text-sm">share</span>
            </a>
            <a
              className="w-8 h-8 bg-surface-container flex items-center justify-center rounded-full text-on-surface hover:text-primary"
              href="#"
              aria-label="Email"
            >
              <span className="material-symbols-outlined text-sm">
                alternate_email
              </span>
            </a>
          </div>
        </div>

        <div>
          <h5 className="font-title-md text-on-surface mb-6">Về chúng tôi</h5>
          <ul className="space-y-3 font-body-md text-on-surface-variant">
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Câu chuyện thương hiệu
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Tuyển dụng
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Chính sách bảo mật
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Điều khoản sử dụng
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="font-title-md text-on-surface mb-6">
            Trung tâm hỗ trợ
          </h5>
          <ul className="space-y-3 font-body-md text-on-surface-variant">
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Trung tâm trợ giúp
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Hướng dẫn mua hàng
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Vận chuyển &amp; Giao nhận
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Liên hệ chúng tôi
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="font-title-md text-on-surface mb-6">Thanh toán</h5>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-10 bg-white rounded flex items-center justify-center p-1 border border-surface-container">
              <img
                alt="Visa"
                className="h-6"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCo1Hsp_x5rV_ZFpki_ftLox90VyJifKQnia-pJEF4jRBEhO7aC0TMWWeW7RFcu6TOP3QawqplK6kD56O4vW8b5uxdGuhphxV4JZX2-Npwt_D3UkIMmMxvXlRK4jDow23wm_o_4oPr8Bdmk1Tl5HbZKoZtHOIgcBuPfXjHMfHUlNtcroSYJPN0JROVMnDzZM8_sgNUjQ_9l36U-gu-2R97DvpAlWXjyGc9-xvVWEQKeuwaed-tzfFJbtvYuwYDegP_TZgKciXudTMd0"
              />
            </div>
            <div className="h-10 bg-white rounded flex items-center justify-center p-1 border border-surface-container">
              <img
                alt="Mastercard"
                className="h-6"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOiYMVQVg6hphe0U80W9mXXitc3cLVB0x9yX3kSMTLDb0J_6C6lSuayH9byMGFD6e51Cwb9Hp0whAWDbqoXFV5nXQBSFHVEScs5LooNLelYNKl1cjvmDbr05BSk5wamGkobTZfR8Ydw5M4pkOi1RSC-jwekwZhl0I6kGJrirsV1aeyIOErjtLEDDaTbjf8Aaw4CV2iCC35fNCRoUYytPirwvNW_elf-S8OaqeviVSw5zRKFJ7qWPQ8O0v1zNm3y2dtx0WjmuvlEEgj"
              />
            </div>
            <div className="h-10 bg-white rounded flex items-center justify-center p-1 border border-surface-container">
              <img
                alt="JCB"
                className="h-6"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuACacQFgZHVvoDlhhrfzcRcE_eqpfn9bdnKgHviU6X0y2eLPK62mxaFep__esf7g9bm2bxe4rZ1jOxmz2LbzX7rXHN-AuDra5LmHcp9-LGUnO3AAvENpVCWnw6-GfRXEoFDeeAzBa-l8O9KINp62PYGMyw8Bm2F2SaOMb784VYPDs1wOSvQKvkaGKlQ4kIV7Nh4Tee898fZNrJHGHUM8PeCPDf0oOEck3dBif9dWNYAmItUnMKDNM-ML8HpVFvIPbIH0QThT87BSgav"
              />
            </div>
          </div>

          <h5 className="font-title-md text-on-surface mt-6 mb-4">
            Tải ứng dụng
          </h5>
          <div className="flex flex-col gap-2">
            <div className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-2xl">shop</span>
              <div className="flex flex-col">
                <span className="text-[8px]">GET IT ON</span>
                <span className="text-xs font-bold leading-none">
                  Google Play
                </span>
              </div>
            </div>
            <div className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-2xl">
                laptop_mac
              </span>
              <div className="flex flex-col">
                <span className="text-[8px]">DOWNLOAD ON THE</span>
                <span className="text-xs font-bold leading-none">
                  App Store
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-surface-container py-6 text-center text-label-md text-on-surface-variant">
        <p>© 2026 ShopBee. Nền tảng thương mại điện tử hàng đầu.</p>
      </div>
    </footer>
  )
}
