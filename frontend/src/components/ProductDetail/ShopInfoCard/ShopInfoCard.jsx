import { Link } from 'react-router-dom'

import { apiAssetUrl } from '../../../lib/api'
import { formatCompact } from '../../../lib/format'

const fallbackAvatar = '/logo_shop.png'

export default function ShopInfoCard({ shop, productId }) {
  if (!shop) return null
  const avatarSrc = apiAssetUrl(shop.avatarUrl) || fallbackAvatar

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] sm:p-6 md:flex-row md:items-center md:gap-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-primary-container p-0.5 sm:h-16 sm:w-16">
          <img
            alt={shop.name}
            className="h-full w-full rounded-full object-cover"
            src={avatarSrc}
          />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-title-md text-title-md">{shop.name}</h3>
          <p className="flex items-center gap-1 text-label-md font-label-md text-on-surface-variant">
            <span className="h-2 w-2 shrink-0 rounded-full bg-tertiary" /> Đang hoạt động
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              className="rounded border border-primary px-3 py-1 text-label-md font-label-md text-primary hover:bg-primary/5"
              to={`/messages?shopId=${shop.id}${productId ? `&productId=${productId}` : ''}`}
            >
              Chat ngay
            </Link>
            <Link
              className="rounded border border-outline-variant px-3 py-1 text-label-md font-label-md text-on-surface-variant hover:bg-surface-container"
              to={`/shop/${shop.slug || shop.id}`}
            >
              Xem shop
            </Link>
          </div>
        </div>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-2 border-t border-outline-variant pt-4 sm:grid-cols-2 sm:gap-x-6 md:flex-1 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span className="truncate font-label-md text-on-surface-variant">Đánh giá</span>
          <span className="shrink-0 font-bold text-primary">{Number(shop.ratingAvg || 0).toFixed(1)}</span>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span className="truncate font-label-md text-on-surface-variant">Lượt đánh giá</span>
          <span className="shrink-0 font-bold text-primary">{formatCompact(shop.ratingCount)}</span>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span className="truncate font-label-md text-on-surface-variant">Theo dõi</span>
          <span className="shrink-0 font-bold text-primary">{formatCompact(shop.followerCount)}</span>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span className="truncate font-label-md text-on-surface-variant">Mã shop</span>
          <span className="shrink-0 font-bold text-primary">#{shop.id}</span>
        </div>
      </div>
    </div>
  )
}
