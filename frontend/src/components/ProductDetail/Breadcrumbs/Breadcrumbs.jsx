import { Link } from 'react-router-dom'

export default function Breadcrumbs({ product }) {
  return (
    <nav className="flex items-center gap-2 mb-6 text-on-surface-variant font-label-md text-label-md">
      <Link className="hover:text-primary" to="/">
        Trang chủ
      </Link>
      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      {product?.category ? (
        <>
          <a className="hover:text-primary" href={`#category-${product.category.slug}`}>
            {product.category.name}
          </a>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </>
      ) : null}
      <span className="text-on-surface truncate max-w-[200px] md:max-w-none">
        {product?.name || 'Sản phẩm'}
      </span>
    </nav>
  )
}
