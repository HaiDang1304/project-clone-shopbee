import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import ShopMessagesPanel from '../../components/ShopMessagesPanel/ShopMessagesPanel'
import { getAuthUser } from '../../lib/auth'
import AccountLayout from '../Account/AccountLayout'

export default function MessagesPage() {
  const [searchParams] = useSearchParams()
  const user = useMemo(() => getAuthUser(), [])
  const initialShopId = searchParams.get('shopId') || ''
  const initialProductId = searchParams.get('productId') || ''
  const canSell = user?.role === 'seller' || user?.role === 'admin'
  const [activeMode, setActiveMode] = useState(initialShopId ? 'customer' : canSell ? 'seller' : 'customer')

  return (
    <AccountLayout>
      <div className="space-y-4">
        <div className="rounded-xl border border-[#e5ddd5] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-[#201915]">Tin nhắn</h1>
              <p className="mt-1 text-[13px] text-[#766a61]">
                {canSell ? 'Tách riêng hội thoại mua hàng và bán hàng để không lẫn khách.' : 'Theo dõi các cuộc trò chuyện với shop.'}
              </p>
            </div>

            {canSell ? (
              <div className="grid grid-cols-2 rounded-lg bg-[#f3f1ed] p-1">
                {[
                  ['seller', 'Bán hàng'],
                  ['customer', 'Mua hàng'],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    className={`h-10 rounded-md px-4 text-[13px] font-bold transition ${
                      activeMode === mode ? 'bg-white text-[#d45b32] shadow-sm' : 'text-[#51463f] hover:text-[#d45b32]'
                    }`}
                    type="button"
                    onClick={() => setActiveMode(mode)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <ShopMessagesPanel
          key={`${activeMode}-${initialShopId}-${initialProductId}`}
          mode={activeMode}
          initialShopId={activeMode === 'customer' ? initialShopId : ''}
          initialProductId={activeMode === 'customer' ? initialProductId : ''}
        />
      </div>
    </AccountLayout>
  )
}
