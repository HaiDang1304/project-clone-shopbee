import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useCart } from '../../../context/useCart'
import { getAuthUser } from '../../../lib/auth'
import { formatCompact, formatCurrency } from '../../../lib/format'

const CHECKOUT_STORAGE_KEY = 'shopbee_checkout'

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

function normalizeOptionValues(values) {
  const source = Array.isArray(values) ? values : [values]
  const seen = new Set()
  const result = []

  source
    .flatMap((value) => String(value || '').split(/[,;\n]+/))
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      result.push(value)
    })

  return result
}

function normalizeProductOptions(options) {
  if (!Array.isArray(options)) return []

  return options
    .map((option) => ({
      name: String(option?.name || '').trim(),
      values: normalizeOptionValues(option?.values),
    }))
    .filter((option) => option.name && option.values.length)
}

function normalizeSelectedOptions(options) {
  if (!options || typeof options !== 'object') return {}

  return Object.entries(options)
    .map(([name, value]) => [String(name || '').trim(), String(value || '').trim()])
    .filter(([name, value]) => name && value)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((result, [name, value]) => {
      result[name] = value
      return result
    }, {})
}

function valuesMatch(left, right) {
  return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase()
}

function findVariantByOptions(variants, selectedOptions) {
  const selectedValues = Object.values(normalizeSelectedOptions(selectedOptions))
  if (!selectedValues.length) return null

  return variants.find((variant) => {
    const attrs = Object.values(parseAttributes(variant.attributes)).map((value) => String(value || '').trim())
    return selectedValues.every((selectedValue) => attrs.some((attrValue) => valuesMatch(attrValue, selectedValue)))
  }) || null
}

function firstProductImage(product, selectedVariant) {
  return (
    selectedVariant?.imageUrl ||
    product?.images?.[0]?.imageUrl ||
    product?.thumbnailUrl ||
    product?.imageUrl ||
    ''
  )
}

export default function ProductPurchaseCard({ product }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { addToCart } = useCart()
  const variants = useMemo(() => product?.variants || [], [product])
  const productOptions = useMemo(() => normalizeProductOptions(product?.productOptions), [product])
  const [selectedVariantId, setSelectedVariantId] = useState(null)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [qty, setQty] = useState(1)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)

  const explicitVariant = variants.find((variant) => variant.id === selectedVariantId) || null
  const optionMatchedVariant = productOptions.length ? findVariantByOptions(variants, selectedOptions) : null
  const selectedVariant = explicitVariant || optionMatchedVariant
  const price = selectedVariant?.price ?? product?.price
  const originalPrice = selectedVariant?.originalPrice ?? product?.originalPrice
  const stock = Number(selectedVariant?.stock ?? product?.stock ?? 0)
  const hasDiscount = originalPrice && Number(originalPrice) > Number(price)
  const discount = hasDiscount ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100) : 0

  const updateQty = (delta) => {
    setMessage('')
    setQty((prev) => {
      const next = Number(prev || 1) + delta
      if (next < 1) return 1
      if (stock && next > stock) {
        setMessage('Số lượng vượt quá tồn kho')
        return stock
      }
      return next
    })
  }

  function handleQtyChange(value) {
    setMessage('')
    const next = Number.parseInt(value, 10)
    if (!Number.isSafeInteger(next) || next < 1) {
      setQty(1)
      return
    }

    if (stock && next > stock) {
      setQty(stock)
      setMessage('Số lượng vượt quá tồn kho')
      return
    }

    setQty(next)
  }

  function selectOption(groupName, value) {
    setMessage('')
    setSelectedOptions((current) => ({ ...current, [groupName]: value }))
  }

  function requireLogin() {
    if (getAuthUser()) return false

    toast.info('Vui lòng đăng nhập để tiếp tục')
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    navigate(`/login?redirect=${redirect}`)
    return true
  }

  function validatePurchase() {
    if (!product?.id) return 'Sản phẩm không tồn tại'

    const missingProductOptions = productOptions.some((option) => !selectedOptions[option.name])
    const missingVariant = variants.length > 0 && productOptions.length === 0 && !selectedVariant
    if (missingProductOptions || missingVariant) return 'Vui lòng chọn đầy đủ phân loại sản phẩm'

    if (variants.length > 0 && productOptions.length > 0 && !selectedVariant) {
      return 'Phân loại đã chọn hiện chưa có hàng'
    }

    if (!Number.isSafeInteger(Number(qty)) || Number(qty) < 1) return 'Số lượng không hợp lệ'
    if (Number(qty) > stock) return 'Số lượng vượt quá tồn kho'
    if (stock <= 0) return 'Sản phẩm đã hết hàng'

    return ''
  }

  function selectedOptionsPayload() {
    if (productOptions.length) return normalizeSelectedOptions(selectedOptions)
    if (selectedVariant) return normalizeSelectedOptions(parseAttributes(selectedVariant.attributes))
    return {}
  }

  function makeCheckoutItem() {
    return {
      productId: product.id,
      variantId: selectedVariant?.id || null,
      name: product.name,
      slug: product.slug,
      imageUrl: firstProductImage(product, selectedVariant),
      unitPrice: Number(price || 0),
      quantity: Number(qty),
      selectedOptions: selectedOptionsPayload(),
      stock,
      shop: product.shop || null,
      category: product.category || null,
    }
  }

  async function handleAddToCart() {
    setMessage('')
    if (requireLogin()) return

    const validationMessage = validatePurchase()
    if (validationMessage) {
      setMessage(validationMessage)
      toast.error(validationMessage)
      return
    }

    setSubmitting(true)

    try {
      await addToCart({
        productId: product.id,
        variantId: selectedVariant?.id || null,
        quantity: Number(qty),
        selectedOptions: selectedOptionsPayload(),
      })
      setMessage('Đã thêm sản phẩm vào giỏ hàng')
      toast.success('Đã thêm sản phẩm vào giỏ hàng')
    } catch (err) {
      const errorMessage = err.message || 'Không thêm được vào giỏ hàng'
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  function handleBuyNow() {
    setMessage('')
    if (requireLogin()) return

    const validationMessage = validatePurchase()
    if (validationMessage) {
      setMessage(validationMessage)
      toast.error(validationMessage)
      return
    }

    setBuyingNow(true)
    sessionStorage.setItem(
      CHECKOUT_STORAGE_KEY,
      JSON.stringify({
        source: 'buyNow',
        items: [makeCheckoutItem()],
        createdAt: Date.now(),
      }),
    )
    navigate('/checkout')
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
          {formatCompact(product.ratingCount)} đánh giá
        </span>
        <div className="h-4 w-px bg-outline-variant" />
        <span className="text-on-surface-variant font-label-md text-label-md">
          {formatCompact(product.soldCount)} đã bán
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
                GIẢM {discount}%
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] items-center">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase">
            Vận chuyển
          </span>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">
              local_shipping
            </span>
            <span className="text-body-md">
              Miễn phí vận chuyển cho đơn hàng trên 500k
            </span>
          </div>
        </div>

        {product.category ? (
          <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] items-center">
            <span className="text-on-surface-variant font-label-md text-label-md uppercase">
              Danh mục
            </span>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-surface-container-low px-3 py-2 text-body-md text-on-surface">
                {product.category.name}
              </span>
            </div>
          </div>
        ) : null}

        {productOptions.length ? (
          <div className="space-y-4">
            {productOptions.map((option) => (
              <div key={option.name} className="grid grid-cols-1 md:grid-cols-[100px_1fr] items-start">
                <span className="mt-2 text-on-surface-variant font-label-md text-label-md uppercase">
                  {option.name}
                </span>
                <div className="flex flex-wrap gap-3">
                  {option.values.map((value) => {
                    const selected = selectedOptions[option.name] === value
                    return (
                      <button
                        key={`${option.name}-${value}`}
                        className={
                          selected
                            ? 'px-4 py-2 border-2 border-primary rounded-lg font-body-md bg-primary/5'
                            : 'px-4 py-2 border border-outline-variant rounded-lg font-body-md hover:border-primary transition-all'
                        }
                        type="button"
                        onClick={() => selectOption(option.name, value)}
                      >
                        {value}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {variants.length && !productOptions.length ? (
          <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] items-start">
            <span className="text-on-surface-variant font-label-md text-label-md uppercase mt-2">
              Phiên bản
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
                    onClick={() => {
                      setMessage('')
                      setSelectedVariantId(variant.id)
                    }}
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
            Số lượng
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-surface-container transition-all disabled:opacity-50"
                type="button"
                onClick={() => updateQty(-1)}
                disabled={qty <= 1 || submitting || buyingNow}
                aria-label="Giảm số lượng"
              >
                <span className="material-symbols-outlined text-[18px]">
                  remove
                </span>
              </button>
              <input
                className="w-14 h-10 border-none text-center font-body-md focus:ring-0"
                type="number"
                min="1"
                max={stock || undefined}
                value={qty}
                onChange={(event) => handleQtyChange(event.target.value)}
                aria-label="Số lượng"
              />
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-surface-container transition-all disabled:opacity-50"
                type="button"
                onClick={() => updateQty(1)}
                disabled={stock <= 0 || qty >= stock || submitting || buyingNow}
                aria-label="Tăng số lượng"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            <span className="text-on-surface-variant font-label-md text-label-md">
              {stock} sản phẩm có sẵn
            </span>
          </div>
        </div>

        {message ? (
          <div className="rounded-lg bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
            {message}
          </div>
        ) : null}

        <div className="flex flex-row gap-3 pt-4 sm:gap-4">
          <button
            className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-primary-container px-3 py-3 text-label-md font-title-md text-primary-container transition-all hover:bg-primary-container/5 disabled:opacity-60 sm:gap-2 sm:px-4 sm:text-title-sm"
            type="button"
            onClick={handleAddToCart}
            disabled={submitting || buyingNow || !stock}
          >
            <span className="material-symbols-outlined shrink-0 text-[22px] sm:text-[24px]">add_shopping_cart</span>
            {submitting ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
          </button>
          <button
            className="flex min-w-0 flex-1 items-center justify-center rounded-lg bg-primary-container px-3 py-3 text-label-md font-title-md text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60 sm:px-4 sm:text-title-sm"
            type="button"
            onClick={handleBuyNow}
            disabled={submitting || buyingNow || !stock}
          >
            {buyingNow ? 'Đang xử lý...' : 'Mua ngay'}
          </button>
        </div>
      </div>
    </div>
  )
}
