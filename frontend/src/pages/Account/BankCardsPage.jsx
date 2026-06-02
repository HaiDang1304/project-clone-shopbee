import { useEffect, useState } from 'react'

import AccountLayout from './AccountLayout'
import { getAccountPaymentMethods } from '../../lib/account'

function EmptyPaymentState({ icon, title, message }) {
  return (
    <div className="rounded-lg border border-dashed border-outline-variant px-6 py-10 text-center">
      <span className="material-symbols-outlined text-[36px] text-primary">{icon}</span>
      <p className="mt-3 text-title-sm font-title-sm text-on-surface">{title}</p>
      <p className="mt-1 text-body-sm text-on-surface-variant">{message}</p>
    </div>
  )
}

export default function BankCardsPage() {
  const [data, setData] = useState({ bankAccounts: [], cards: [], message: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadPaymentMethods() {
      try {
        const nextData = await getAccountPaymentMethods()
        if (active) {
          setData({
            bankAccounts: nextData.bankAccounts || [],
            cards: nextData.cards || [],
            message: nextData.message || '',
          })
          setError('')
        }
      } catch (err) {
        if (active) setError(err.message || 'Không tải được ngân hàng/thẻ')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPaymentMethods()

    return () => {
      active = false
    }
  }, [])

  return (
    <AccountLayout>
      <div className="space-y-5">
        <section className="rounded-lg bg-surface-container-lowest px-6 py-6 shadow-sm md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-4">
            <div>
              <h1 className="text-title-md font-title-md text-on-surface">Ngân hàng/Thẻ</h1>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Quản lý tài khoản ngân hàng và thẻ thanh toán
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-5 rounded-lg bg-surface-container px-4 py-4 text-body-sm text-on-surface-variant">
              Đang tải ngân hàng/thẻ...
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-lg bg-error-container px-4 py-4 text-body-sm text-on-error-container">
              {error}
            </div>
          ) : null}

          {!loading && !error && data.message ? (
            <div className="mt-5 rounded-lg bg-surface-container px-4 py-3 text-body-sm text-on-surface-variant">
              {data.message}
            </div>
          ) : null}
        </section>

        <section className="rounded-lg bg-surface-container-lowest px-6 py-6 shadow-sm md:px-8">
          <div className="border-b border-outline-variant pb-4">
            <h2 className="text-title-md font-title-md text-on-surface">Tài khoản ngân hàng</h2>
          </div>

          <div className="mt-5">
            {!loading && !data.bankAccounts.length ? (
              <EmptyPaymentState
                icon="account_balance"
                title="Chưa có tài khoản ngân hàng"
                message="Cập nhật tài khoản ngân hàng để hoàn thành hồ sơ thanh toán."
              />
            ) : null}
          </div>
        </section>

        <section className="rounded-lg bg-surface-container-lowest px-6 py-6 shadow-sm md:px-8">
          <div className="border-b border-outline-variant pb-4">
            <h2 className="text-title-md font-title-md text-on-surface">Thẻ thanh toán</h2>
          </div>

          <div className="mt-5">
            {!loading && !data.cards.length ? (
              <EmptyPaymentState
                icon="credit_card"
                title="Chưa có thẻ thanh toán"
                message="Thêm thẻ thanh toán để thanh toán nhanh hơn."
              />
            ) : null}
          </div>
        </section>
      </div>
    </AccountLayout>
  )
}
