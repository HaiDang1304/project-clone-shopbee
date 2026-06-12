import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiGet } from '../../lib/api'

const categoryIcons = {
  'dien-tu': 'devices',
  'thoi-trang': 'styler',
  'gia-dung': 'home_iot_device',
  'lam-dep': 'face_6',
  'the-thao': 'fitness_center',
  'suc-khoe': 'health_and_safety',
}

const categoryAccentClasses = [
  'bg-[#fff2df] text-[#c57900]',
  'bg-[#e8f0ff] text-[#2f6bf2]',
  'bg-[#e8fff5] text-[#047857]',
  'bg-[#f3e8ff] text-[#8c38d8]',
  'bg-[#fff0e7] text-[#d75b12]',
  'bg-[#eef5ee] text-[#4b7f52]',
]

function CategoryCard({ icon, label, slug, accentClass }) {
  return (
    <Link
      className="group rounded-xl border border-[#eaded2] bg-white p-4 text-center shadow-[0_8px_22px_rgba(60,42,22,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#c98225] hover:shadow-[0_14px_30px_rgba(60,42,22,0.1)]"
      to={`/category/${slug || ''}`}
    >
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${accentClass}`}>
        <span className="material-symbols-outlined text-[26px]">{icon}</span>
      </div>
      <span className="mt-3 block truncate text-[13px] font-bold text-[#15110d]">{label}</span>
      <span className="mt-1 block text-[11px] font-medium text-[#7b6556]">Xem ưu đãi</span>
    </Link>
  )
}

export default function CategoriesGrid() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadCategories() {
      try {
        const data = await apiGet('/api/categories')
        if (!ignore) setCategories(data.data || [])
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được danh mục')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadCategories()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <section className="mx-auto mb-10 max-w-container-max px-margin-mobile md:px-margin-desktop">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase text-[#c57900]">Mua sắm nhanh</p>
          <h2 className="mt-1 text-[24px] font-bold leading-8 text-[#15110d]">Danh mục nổi bật</h2>
        </div>
        <a className="text-[13px] font-bold text-[#995900] hover:text-[#7b4600]" href="#recommendations">
          Xem thêm sản phẩm
        </a>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[132px] animate-pulse rounded-xl border border-[#eaded2] bg-white"
              />
            ))
          : categories.map((category, index) => (
              <CategoryCard
                key={category.id || category.slug}
                icon={categoryIcons[category.slug] || 'category'}
                label={category.name}
                slug={category.slug}
                accentClass={categoryAccentClasses[index % categoryAccentClasses.length]}
              />
            ))}
      </div>
    </section>
  )
}
