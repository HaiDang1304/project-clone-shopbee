import { useEffect, useState } from 'react'

import { apiGet } from '../../lib/api'

const categoryIcons = {
  'dien-tu': 'devices',
  'thoi-trang': 'styler',
  'gia-dung': 'home_iot_device',
  'lam-dep': 'face_6',
  'the-thao': 'fitness_center',
  'suc-khoe': 'health_and_safety',
}

function CategoryCard({ icon, label, slug }) {
  return (
    <a
      className="bg-surface-container-lowest p-6 rounded-xl text-center group hover:shadow-lg transition-all border border-transparent hover:border-primary"
      href={`#category-${slug || ''}`}
    >
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-primary text-3xl">
          {icon}
        </span>
      </div>
      <span className="font-title-md text-title-md">{label}</span>
    </a>
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
        if (!ignore) setError(err.message || 'Khong tai duoc danh muc')
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
    <section className="max-w-container-max mx-auto px-margin-desktop mb-12">
      <h2 className="font-headline-md text-headline-md mb-6">Danh muc noi bat</h2>

      {error ? (
        <div className="mb-4 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[148px] rounded-xl bg-surface-container-lowest border border-surface-container animate-pulse"
              />
            ))
          : categories.map((c) => (
              <CategoryCard
                key={c.id || c.slug}
                icon={categoryIcons[c.slug] || 'category'}
                label={c.name}
                slug={c.slug}
              />
            ))}
      </div>
    </section>
  )
}
