import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { submitProductReview } from '../../lib/account'
import { apiAssetUrl } from '../../lib/api'

function normalizeProducts(products) {
  return (Array.isArray(products) ? products : [])
    .map((product) => ({
      productId: Number(product.productId || product.id),
      name: product.name || 'Sản phẩm',
      imageUrl: product.imageUrl || product.thumbnailUrl || '',
      shopName: product.shopName || product.shop?.name || '',
      quantity: Number(product.quantity || 0),
    }))
    .filter((product) => product.productId)
}

export default function ReviewModal({
  open,
  orderId,
  products = [],
  initialProductId = null,
  onClose,
  onSubmitted,
}) {
  const normalizedProducts = useMemo(() => normalizeProducts(products), [products])
  const initialSelectedProductId = useMemo(() => {
    if (initialProductId && normalizedProducts.some((product) => String(product.productId) === String(initialProductId))) {
      return String(initialProductId)
    }

    return normalizedProducts[0]?.productId ? String(normalizedProducts[0].productId) : ''
  }, [initialProductId, normalizedProducts])
  const [selectedProductId, setSelectedProductId] = useState(() => initialSelectedProductId)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  const selectedProduct = normalizedProducts.find((product) => String(product.productId) === String(selectedProductId))

  async function handleSubmit(event) {
    event.preventDefault()

    if (!orderId || !selectedProductId) {
      toast.error('Không tìm thấy sản phẩm cần đánh giá')
      return
    }

    setSubmitting(true)
    try {
      const review = await submitProductReview({
        orderId: Number(orderId),
        productId: Number(selectedProductId),
        rating,
        comment,
      })
      toast.success('Đã lưu đánh giá của bạn')
      onSubmitted?.(review)
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'Không gửi được đánh giá')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-6">
      <form
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-lg bg-surface-container-lowest shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-5 py-4">
          <div>
            <h2 className="text-title-md font-title-md text-on-surface">Đánh giá sản phẩm</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">Đơn hàng #{orderId}</p>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-container"
            type="button"
            onClick={onClose}
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="max-h-[calc(90vh-132px)] overflow-y-auto px-5 py-5">
          {normalizedProducts.length > 1 ? (
            <div className="mb-4 grid gap-2">
              {normalizedProducts.map((product) => (
                <button
                  key={product.productId}
                  className={`flex min-h-16 items-center gap-3 rounded-lg border px-3 py-3 text-left ${
                    String(selectedProductId) === String(product.productId)
                      ? 'border-primary bg-primary-fixed'
                      : 'border-outline-variant hover:border-primary'
                  }`}
                  type="button"
                  onClick={() => setSelectedProductId(String(product.productId))}
                >
                  {product.imageUrl ? (
                    <img className="h-11 w-11 shrink-0 rounded-md object-cover" src={apiAssetUrl(product.imageUrl)} alt={product.name} />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-surface-container text-primary">
                      <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="line-clamp-1 text-body-sm font-semibold text-on-surface">{product.name}</span>
                    {product.shopName ? (
                      <span className="mt-0.5 block text-body-sm text-on-surface-variant">{product.shopName}</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {selectedProduct ? (
            <div className="flex items-center gap-3 rounded-lg bg-surface-container-low px-3 py-3">
              {selectedProduct.imageUrl ? (
                <img className="h-14 w-14 shrink-0 rounded-md object-cover" src={apiAssetUrl(selectedProduct.imageUrl)} alt={selectedProduct.name} />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-surface-container text-primary">
                  <span className="material-symbols-outlined text-[26px]">inventory_2</span>
                </span>
              )}
              <div className="min-w-0">
                <p className="line-clamp-2 text-body-md font-semibold text-on-surface">{selectedProduct.name}</p>
                {selectedProduct.shopName ? (
                  <p className="mt-1 text-body-sm text-on-surface-variant">{selectedProduct.shopName}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              Không tìm thấy sản phẩm có thể đánh giá.
            </div>
          )}

          <div className="mt-5">
            <p className="text-body-sm font-semibold text-on-surface">Mức độ hài lòng</p>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1
                const active = rating >= value

                return (
                  <button
                    key={value}
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container"
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`${value} sao`}
                  >
                    <span
                      className={`material-symbols-outlined text-[30px] ${active ? 'text-yellow-500' : 'text-outline'}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <label className="mt-5 grid gap-2">
            <span className="text-body-sm font-semibold text-on-surface">Góp ý thêm</span>
            <textarea
              className="min-h-28 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-outline-variant px-5 py-4">
          <button
            className="h-10 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            className="h-10 rounded-lg bg-primary px-5 text-label-md font-label-md text-on-primary hover:bg-primary/90 disabled:opacity-60"
            type="submit"
            disabled={submitting || !selectedProduct}
          >
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      </form>
    </div>
  )
}
