function CategoryCard({ icon, label }) {
  return (
    <a
      className="bg-surface-container-lowest p-6 rounded-xl text-center group hover:shadow-lg transition-all border border-transparent hover:border-primary"
      href="#"
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
  const categories = [
    { icon: 'devices', label: 'Điện tử' },
    { icon: 'styler', label: 'Thời trang' },
    { icon: 'home_iot_device', label: 'Gia dụng' },
    { icon: 'face_6', label: 'Làm đẹp' },
    { icon: 'fitness_center', label: 'Thể thao' },
    { icon: 'health_and_safety', label: 'Sức khỏe' },
  ]

  return (
    <section className="max-w-container-max mx-auto px-margin-desktop mb-12">
      <h2 className="font-headline-md text-headline-md mb-6">Danh Mục Nổi Bật</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((c) => (
          <CategoryCard key={c.label} icon={c.icon} label={c.label} />
        ))}
      </div>
    </section>
  )
}
