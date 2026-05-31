function Rating({ value }) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="material-symbols-outlined text-[12px] text-yellow-500"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
      <span className="text-label-md font-label-md">{value}</span>
    </div>
  )
}

function RecommendationCard({ imageSrc, badge, badgeTone, title, price, rating, sold, location }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-none hover:shadow-[0px_8px_30px_rgba(0,0,0,0.1)] transition-all group flex flex-col h-full border border-surface-container">
      <div className="aspect-square rounded-lg overflow-hidden bg-surface-container mb-4 relative">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          alt={title}
          src={imageSrc}
        />
        {badge ? (
          <span
            className={`absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded ${badgeTone}`}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <h3 className="font-body-md text-body-md line-clamp-2 mb-3 h-10">{title}</h3>
      <div className="mt-auto space-y-2">
        <div className="text-primary font-bold font-title-lg text-title-lg">{price}</div>
        <div className="flex items-center justify-between">
          <Rating value={rating} />
          <span className="text-secondary text-label-md">{sold}</span>
        </div>
        <div className="text-secondary text-label-md overflow-hidden text-ellipsis whitespace-nowrap">
          {location}
        </div>
      </div>
    </div>
  )
}

export default function RecommendationGrid() {
  const items = [
    {
      imageSrc:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC5hGwngfXqMn1f-0T6FDqzC5bViqaGTksCSUGsCawG5cCLiV9Q1E4zKbVfEqTuSCC_FgQkm0QwjxU_vUJtbT3lanjOlb9aWfkzicHJyd_43CgatJNrBBPk4S3f7O5Qhcq7RqylOVTTnP3TTANVnMhnjJyOaaoRI2ILNIbyQk6BqmrkE6mhb5yGxhGhQTXRzf7oK5ZCFyIuS-tIgpYaPKiqgHWa2eSTcoCWTcZ-ju1-BSEEV1s39r9t6RjofmFrT7xvIanJ67cIalA0',
      badge: 'MALL',
      badgeTone: 'bg-error',
      title: 'Máy tính bảng AI Tab Pro Max 12.9 inch',
      price: '12.490.000₫',
      rating: '4.9',
      sold: 'Đã bán 1.2k',
      location: 'TP. Hồ Chí Minh',
    },
    {
      imageSrc:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCOuOvVQxx1iD0gNVCwSWgU0ov3p6LlbFWw40X6Lgw6gJEVf_ipETGty8NV0Fi9jZMzoAnpr4YPIN9m28PqiihMO3a-j1WYu_BuaDGUxKWJ28SsNkIclX5FFNPPVTayFH521g9moql9xNtxVvW9u3O0TCEN-t1fOyVWslfbzjt9CwkYSLzorOdqy5d4DgbRr9gF5YmtrfzVF9-RQSIO0-HKAtRKSLfs-OiUfFNeoIIQZ7-AqMr1ARUgLwWPBc1VfY28T9XhhAPfxam0',
      badge: null,
      badgeTone: '',
      title: 'Kính mát AI Vision Shield Polarized',
      price: '450.000₫',
      rating: '4.7',
      sold: 'Đã bán 500+',
      location: 'Hà Nội',
    },
    {
      imageSrc:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAoE8Mnk07a7q7DzUBrAFZCdDiPWBQZnjuok-UMGPjHPJqSwylouGkEaWOF-WuefWH8k2wSo09XSjl-r07vTI1X8K4iJxuCl-hL-S01sw9BPP7Hg_K3iw4v9-9JVidSPX9n-dYOIKE94qDlaBx_gKi5bPu3QZiUE_wPFKtV4gquugwKhgh4v94PEjBHJcjgbO3n29Z7zlchgdGmlAXvLvWU0WTEZXnnxZC5hSA9KG0Ig-t2VPmj_03GoYG2kewXN5Po2arGzsFtDGhQ',
      badge: null,
      badgeTone: '',
      title: 'Tai nghe Gaming AI Surround Sound RGB',
      price: '1.890.000₫',
      rating: '5.0',
      sold: 'Đã bán 89',
      location: 'TP. Hồ Chí Minh',
    },
    {
      imageSrc:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDC5Q1vi0mvUdxSb-Kcpif94M04Ql7pmsTIurrMIcLERBGUZUt7pANNTcUI1RN36vxD5wKEy-dnQdRmNLTyTvLrN6X3KTPWElF0PV9vxfksj1jrGnTeLIJWp9cR8xCX18kePPr2iljQwAMZRX4yrZ836yXrlaqeSlz3_6YB7Tdgp49NhEcKigDCQ2j3_X0lZvyth55rcTjPAZ9kfT4o8KXiNIilmJd0mVoiEUJt5SENmvQBcMeDSN4h93WRYbYpvXDlZ4K4Q4Fsiy4m',
      badge: 'Bestseller',
      badgeTone: 'bg-primary',
      title: 'Serum dưỡng da AI Glow Essence 50ml',
      price: '750.000₫',
      rating: '4.8',
      sold: 'Đã bán 3.4k',
      location: 'Đà Nẵng',
    },
    {
      imageSrc:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDnwiYTjzKJcw5WtGSiD-ph-SCLxoKuFTasJtPzhATCDq05EwwBRd_musvAtzCEbhhi7_80ct4VUj71UwOdPKZQw18C7y8lPC8q1HZGe-Y62964lOTql_fsL-6yghRs33wVgSFe6-aDH_7ZAyxHjrZhYvion6NDNsNMTtoxIl7fyVIofghmMDR3kdVHfnGEnUbbCg-lQIrSO-ZrTC5_rm-hkFClra5x5_0aIKYFPSKAH3ZJgcC5kA2KpvRtZjofnXyJVc940OpvTDYn',
      badge: null,
      badgeTone: '',
      title: 'Bàn phím cơ AI Custom Mechanical K100',
      price: '2.150.000₫',
      rating: '4.9',
      sold: 'Đã bán 210',
      location: 'TP. Hồ Chí Minh',
    },
    {
      imageSrc:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCFtWFQ-wJjQAOvOLQLTdClkZ3exlwUcndm3A2N34Xbep8hNB2asWVHmRXgWLhB8l0fr6Kx6DURmX2tm7JEb6Mu8Ch25uSOr8eBqm8z_xc7bdIVQI_dJlFMjYFt9JvKKqCKwpx-MdSpUbvz9EJpATDdjYcAMvKU2shYFTnRWt1rDajnHXx6TsuWeAhQDscEEXkjEAXLk0qEmR0kKQIhqwYD1qbFBZSrRlO5-ay5-ar1ljUcCpNTAz7XU-N27Sjdl4_V9660bIEXWZld',
      badge: null,
      badgeTone: '',
      title: 'Laptop AI MasterBook Air 13',
      price: '24.990.000₫',
      rating: '4.9',
      sold: 'Đã bán 45',
      location: 'Hà Nội',
    },
  ]

  return (
    <section className="max-w-container-max mx-auto px-margin-desktop">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <h2 className="font-headline-md text-headline-md">Gợi Ý Hôm Nay</h2>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-primary px-4 py-2 text-white rounded-lg font-title-md text-title-md"
            type="button"
          >
            Cho bạn
          </button>
          <button
            className="bg-surface-container-high px-4 py-2 text-on-surface rounded-lg font-title-md text-title-md hover:bg-surface-container-highest transition-colors"
            type="button"
          >
            Bán chạy
          </button>
          <button
            className="bg-surface-container-high px-4 py-2 text-on-surface rounded-lg font-title-md text-title-md hover:bg-surface-container-highest transition-colors"
            type="button"
          >
            Hàng mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-gutter">
        {items.map((item) => (
          <RecommendationCard key={item.title} {...item} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <button
          className="bg-surface-container-lowest border-2 border-primary text-primary px-12 py-3 rounded-lg font-title-md text-title-md hover:bg-primary hover:text-white transition-all"
          type="button"
        >
          Xem thêm sản phẩm
        </button>
      </div>
    </section>
  )
}
