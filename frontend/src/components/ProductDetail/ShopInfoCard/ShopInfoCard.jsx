import { Link } from 'react-router-dom'

import { apiAssetUrl } from '../../../lib/api'
import { formatCompact } from '../../../lib/format'

const fallbackAvatar = '/logo_shop.png'

export default function ShopInfoCard({ shop, productId }) {
  if (!shop) return null
  const avatarSrc = apiAssetUrl(shop.avatarUrl) || fallbackAvatar

  return (
    <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-wrap md:flex-nowrap items-center gap-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-container p-0.5">
          <img
            alt={shop.name}
            className="w-full h-full object-cover rounded-full"
            src={avatarSrc}
          />
        </div>
        <div>
          <h3 className="font-title-md text-title-md">{shop.name}</h3>
          <p className="text-on-surface-variant font-label-md text-label-md flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-tertiary" /> Đang hoạt động
          </p>
          <div className="flex gap-2 mt-2">
            <Link
              className="px-3 py-1 border border-primary text-primary rounded font-label-md text-label-md hover:bg-primary/5"
              to={`/messages?shopId=${shop.id}${productId ? `&productId=${productId}` : ''}`}
            >
              Chat ngay
            </Link>
            <Link
              className="px-3 py-1 border border-outline-variant text-on-surface-variant rounded font-label-md text-label-md hover:bg-surface-container"
              to={`/shop/${shop.slug || shop.id}`}
            >
              Xem shop
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1 border-l border-outline-variant pl-6">
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant font-label-md">Đánh giá</span>
          <span className="text-primary font-bold">{Number(shop.ratingAvg || 0).toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant font-label-md">Lượt đánh giá</span>
          <span className="text-primary font-bold">{formatCompact(shop.ratingCount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant font-label-md">Theo dõi</span>
          <span className="text-primary font-bold">{formatCompact(shop.followerCount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant font-label-md">Mã shop</span>
          <span className="text-primary font-bold">#{shop.id}</span>
        </div>
      </div>
    </div>
  )
}
