import { useSearchParams } from 'react-router-dom'

import ShopMessagesPanel from '../../components/ShopMessagesPanel/ShopMessagesPanel'
import AccountLayout from '../Account/AccountLayout'

export default function MessagesPage() {
  const [searchParams] = useSearchParams()

  return (
    <AccountLayout>
      <ShopMessagesPanel
        initialShopId={searchParams.get('shopId') || ''}
        initialProductId={searchParams.get('productId') || ''}
      />
    </AccountLayout>
  )
}
