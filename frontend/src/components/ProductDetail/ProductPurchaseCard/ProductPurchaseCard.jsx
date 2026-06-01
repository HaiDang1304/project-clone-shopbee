import { useEffect, useMemo, useState } from 'react'

import { apiPost } from '../../../lib/api'
import { formatCompact, formatCurrency } from '../../../lib/format'

function Stars({ value = 0 }) {
  const rating = Number(value || 0)

  return (
    <div className="flex text-yellow-500">
      {Array.from({ length: 5 }).map((_, index) => {
        const icon = rating >= index + 1 ? 'star' : rating >= index + 0.5 ? 'star_half' : 'star'
        const opacity = rating >= index + 0.5 ? 'opacity-100' : 'opacity-30'

        return (
          <span
            key={index}
            className={`material-symbols-outlined ${opacity}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        )
      })}
    </div>
  )
}

function parseAttributes(attributes) {
  if (!attributes) return {}
  if (typeof attributes === 'object') return attributes

  try {
    return JSON.parse(attributes)
  } catch {
    return {}
  }
}

function variantLabel(variant) {
  const attrs = parseAttributes(variant.attributes)
  const values = Object.values(attrs).filter(Boolean)
  return variant.name || values.join(' / ') || variant.sku || `Variant ${variant.id}`
}

export default function ProductPurchaseCard({ product }) {
  const variants = useMemo(() => product?.variants || [], [product])
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id || null)
  const [qty, setQty] = useState(1)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setSelectedVariantId(variants[0]?.id || null)
    setQty(1)
    setMessage('')
  }, [variants])

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId)
  const price = selectedVariant?.price ?? product?.price
  const originalPrice = selectedVariant?.originalPrice ?? product?.originalPrice
  const stock = selectedVariant?.stock ?? product?.stock ?? 0
  const hasDiscount = originalPrice && Number(originalPrice) > Number(price)
  const discount = hasDiscount ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100) : 0

  const updateQty = (delta) => {
    setQty((prev) => {
      const next = prev + delta
      if (next < 1) return 1
      if (stock && next > stock) return stock
      return next
    })
  }

  async function addToCart() {
    setMessage('')
    setSubmitting(true)

    try {
      await apiPost('/api/cart/items', {
        productId: product.id,
        variantId: selectedVariant?.id || null,
        quantity: qty,
      })
      setMessage('Da them vao gio hang')
    } catch (err) {
      setMessage(err.message || 'Khong them duoc vao gio hang')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
      <h1 className="font-headline-md text-headline-md text-on-surface mb-4">
        {product.name}
      </h1>

      <div className="flex flex-wrap items-center gap-6 mb-6">
        <div className="flex items-center gap-1">
          <span className="text-primary font-bold">{Number(product.ratingAvg || 0).toFixed(1)}</span>
          <Stars value={product.ratingAvg} />
        </div>
        <div className="h-4 w-px bg-outline-variant" />
        <span className="text-on-surface-variant font-label-md text-label-md">
          {formatCompact(product.ratingCount)} danh gia
        </span>
        <div className="h-4 w-px bg-outline-variant" />
        <span className="text-on-surface-variant font-label-md text-label-md">
          {formatCompact(product.soldCount)} da ban
        </span>
      </div>

      <div className="bg-surface-container-low p-6 rounded-lg mb-6">
        <div className="flex flex-wrap items-baseline gap-4">
          <span className="text-[32px] font-bold text-primary-container">
            {formatCurrency(price)}
          </span>
          {hasDiscount ? (
            <>
              <span className="text-on-surface-variant line-through text-body-md">
                {formatCurrency(originalPrice)}
              </span>
              <span className="bg-primary-container/20 text-primary px-2 py-0.5 rounded font-label-md text-label-md">
                GIAM {discount}%
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] items-center">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase">
            Van chuyen
          </span>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">
              local_shipping
            </span>
            <span className="text-body-md">
              Mien phi van chuyen cho don hang tren 500k
            </span>
          </div>
        </div>

        {variants.length ? (
          <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] items-start">
            <span className="text-on-surface-variant font-label-md text-label-md uppercase mt-2">
              Phien ban
            </span>
            <div className="flex flex-wrap gap-3">
              {variants.map((variant) => {
                const isSelected = variant.id === selectedVariantId
                return (
                  <button
                    key={variant.id}
                    className={
                      isSelected
                        ? 'px-4 py-2 border-2 border-primary rounded-lg font-body-md bg-primary/5'
                        : 'px-4 py-2 border border-outline-variant rounded-lg font-body-md hover:border-primary transition-all'
                    }
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                  >
                    {variantLabel(variant)}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] items-center">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase">
            So luong
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-surface-container transition-all"
                type="button"
                onClick={() => updateQty(-1)}
                aria-label="Giam so luong"
              >
                <span className="material-symbols-outlined text-[18px]">
                  remove
                </span>
              </button>
              <input
                className="w-12 h-10 border-none text-center font-body-md focus:ring-0"
                type="text"
                value={qty}
                readOnly
                aria-label="So luong"
              />
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-surface-container transition-all"
                type="button"
                onClick={() => updateQty(1)}
                aria-label="Tang so luong"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            <span className="text-on-surface-variant font-label-md text-label-md">
              {stock} san pham co san
            </span>
          </div>
        </div>

        {message ? (
          <div className="rounded-lg bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
            {message}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            className="flex-1 h-12 border-2 border-primary-container text-primary-container rounded-lg font-title-md flex items-center justify-center gap-2 hover:bg-primary-container/5 transition-all disabled:opacity-60"
            type="button"
            onClick={addToCart}
            disabled={submitting || !stock}
          >
            <span className="material-symbols-outlined">add_shopping_cart</span>
            {submitting ? 'Dang them...' : 'Them vao gio hang'}
          </button>
          <button
            className="flex-1 h-12 bg-primary-container text-white rounded-lg font-title-md flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
            type="button"
            disabled={!stock}
          >
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  )
}
