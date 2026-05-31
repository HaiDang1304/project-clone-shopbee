import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function pad2(value) {
  return String(value).padStart(2, '0')
}

function Countdown({ initialSeconds = 2 * 3600 + 45 * 60 + 12 }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const { h, m, s } = useMemo(() => {
    const hVal = Math.floor(secondsLeft / 3600)
    const mVal = Math.floor((secondsLeft % 3600) / 60)
    const sVal = secondsLeft % 60
    return { h: hVal, m: mVal, s: sVal }
  }, [secondsLeft])

  return (
    <div className="flex gap-1" aria-label="Đếm ngược flash sale">
      <span className="bg-black/20 px-2 py-1 rounded font-bold">{pad2(h)}</span>
      <span>:</span>
      <span className="bg-black/20 px-2 py-1 rounded font-bold">{pad2(m)}</span>
      <span>:</span>
      <span className="bg-black/20 px-2 py-1 rounded font-bold">{pad2(s)}</span>
    </div>
  )
}

function FlashSaleProductCard({
  imageSrc,
  discount,
  title,
  price,
  originalPrice,
  progress,
  progressLabel,
}) {
  return (
    <Link className="w-48 group cursor-pointer" to="/product" aria-label={title}>
      <div className="relative aspect-square rounded-lg overflow-hidden bg-surface-container mb-3">
        <img
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          alt={title}
          src={imageSrc}
        />
        <div className="absolute top-0 right-0 bg-error text-white font-bold text-label-md px-2 py-1 rounded-bl-lg">
          {discount}
        </div>
      </div>
      <h4 className="font-body-md text-body-md line-clamp-2 mb-2 text-on-surface">
        {title}
      </h4>
      <div className="flex items-baseline gap-2">
        <span className="text-primary font-bold font-title-lg text-title-lg">
          {price}
        </span>
        <span className="text-secondary text-label-md line-through">
          {originalPrice}
        </span>
      </div>
      <div className="mt-2 h-3 bg-surface-container-high rounded-full relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          style={{ width: `${progress}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-on-primary">
          {progressLabel}
        </span>
      </div>
    </Link>
  )
}

export default function FlashSaleSection() {
  const products = [
    {
      imageSrc:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAxbD1F1ojazGZyyWX3XpPLOZQ9vGWLzEfcZHGeU3AfO2x1SP-yS6AD834aRCbg8V5E3Pw78-177cSrDYTRqFinZZE3Qhv-dzo4ROW1HKj_lC0AMw2l60aj9e_c7BRO20OJkQ5gE4f-lH5ZbvPYXpHPIVNhgNKG5nRZq2f5nLjJ6-w3fjal98IrHCrZaM2bdHl5O9MYE8KprquxlcAVITC-pM-pxlXcT1q-44NzlJtb49cCZGWbALw2QL8Lp8fSQR8j1NPaWl8ZSZn7',
      discount: '-45%',
      title: 'Đồng hồ thông minh AI Vision Series 4',
      price: '1.250.000₫',
      originalPrice: '2.400.000₫',
      progress: 75,
      progressLabel: 'ĐÃ BÁN 75',
    },
    {
      imageSrc:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCim-qM0dobpwi3qlwZV2n3NnW6kzPuexZgCDF5VZENfxd-SGVbxTO8vEh-wzBxKsWHR7iFLTcjVtinQhRBpDwWEFAMojmx8k4L4BdyuvTx6QWmsM4RBHVPnVZW1KsngfSFM5iaVg1LxXx8jlKpKLPR4tvvANl6GdWoJJt54OnMf5EWWT5Qi2FfdFG8hy3uJo8fbKFrduwGQJU62GmRdK0IUr-8hv1cpWYCMOav0dFNEaqmYR9aBofD1M1gd35xPx-tU1aDTRXBDCLg',
      discount: '-30%',
      title: 'Tai nghe chống ồn AI Acoustics Pro',
      price: '3.490.000₫',
      originalPrice: '4.990.000₫',
      progress: 40,
      progressLabel: 'ĐÃ BÁN 12',
    },
    {
      imageSrc:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuANsz8PjIfNZvm5GstP8LV-RMsgymOMxZYqsG4dky2nAkL89LgxyXPaCsH3TXUNjc042QKvTEQXQOVq7cZR28oUcpxAzZN_ey9Hg8itKKBu3hP0CNIK4DdTpEpfUmb5c4mlLvpQspgeIR5Au7jDId1jWuwAPHU2UusDYRTQRW5adnjIJsutYL08wDZCAvxgtE3ieS7uMfo324CP-K5WklCDIHBo5sfK2EG7o5UxPV8rPcWDmkY70qhPYDm9n-rdCF-QoXwH6tdOnMMU',
      discount: '-20%',
      title: 'Giày chạy bộ AI Dynamic Runner X1',
      price: '890.000₫',
      originalPrice: '1.100.000₫',
      progress: 90,
      progressLabel: 'SẮP HẾT HÀNG',
    },
    {
      imageSrc:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCR-O7z0_qwR-2KRC-cFtXC1uS6z4F9c4XYhmwptUSZAxGCIxjFjVTd27E1TjU9TNbbjEUtzyInpzSGO3k4wgDI-H4z53JhMfJgOQRtlleLfOMbyS_vSKKTmR5aElg-DiihAegzK8MHsdx7EifvCeZCQyU-W9fvM0gKV68wiWwmMq1Ztap0-VQfoXHawtyqqDI80QmzgZXsQZC6RFu9bvztKau6Tb01Qo3Ex7Q6CT9kVdND9zbpauEYTJvII1xdNWiVoGJ7EYot_QSa',
      discount: '-15%',
      title: 'Máy ảnh Mirrorless AI Capture Z',
      price: '15.900.000₫',
      originalPrice: '18.500.000₫',
      progress: 25,
      progressLabel: 'ĐÃ BÁN 5',
    },
    {
      imageSrc:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCBrsNqCaSXt3nFKig8VEfOC9RICn4C5ivyVbN-LWAw1YjlstQtPFZT7lC6HRjZeIDQ8bEhId1HhypqhZriFf2RSLFKnclTlTsZzFgw-sxSX0zp3ALyRxBvVukZqQUbUFI9o88i2pvhkgXF1mWecHobrMvUsYXuNKmKreH1jjKwIQTc1FwMAGlIxRJ3alN_-RA1kzUEkTUARF-h3j-sqh8rfAIyEOv-eBteYn4ai9UKpk88PM8SD-ATPSzdfpz5m2qpC77m1REXAwID',
      discount: '-50%',
      title: 'Loa thông minh AI Home Assistant',
      price: '645.000₫',
      originalPrice: '1.290.000₫',
      progress: 55,
      progressLabel: 'ĐÃ BÁN 42',
    },
  ]

  return (
    <section className="max-w-container-max mx-auto px-margin-desktop mb-12">
      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flash-sale-gradient p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bolt
              </span>
              <h2 className="font-headline-md text-headline-md italic uppercase">
                Flash Sale
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-body-md opacity-80">Kết thúc sau:</span>
              <Countdown />
            </div>
          </div>
          <a className="text-white hover:underline font-label-md text-label-md" href="#">
            Xem tất cả
          </a>
        </div>

        <div className="p-6 overflow-x-auto custom-scrollbar">
          <div className="flex gap-gutter min-w-max">
            {products.map((p) => (
              <FlashSaleProductCard
                key={p.title}
                imageSrc={p.imageSrc}
                discount={p.discount}
                title={p.title}
                price={p.price}
                originalPrice={p.originalPrice}
                progress={p.progress}
                progressLabel={p.progressLabel}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
