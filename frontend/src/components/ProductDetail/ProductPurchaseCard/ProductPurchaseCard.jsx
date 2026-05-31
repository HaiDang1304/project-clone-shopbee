import { useMemo, useState } from 'react'

function Stars() {
  return (
    <div className="flex text-yellow-500">
      <span
        className="material-symbols-outlined"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
      <span
        className="material-symbols-outlined"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
      <span
        className="material-symbols-outlined"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
      <span
        className="material-symbols-outlined"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
      <span
        className="material-symbols-outlined"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star_half
      </span>
    </div>
  )
}

export default function ProductPurchaseCard() {
  const colors = useMemo(
    () => ['Titanium Đen', 'Titanium Tự Nhiên', 'Trắng Ngọc Trai'],
    [],
  )
  const storages = useMemo(() => ['256GB', '512GB', '1TB'], [])

  const [selectedColor, setSelectedColor] = useState(colors[0])
  const [selectedStorage, setSelectedStorage] = useState(storages[1])
  const [qty, setQty] = useState(1)

  const updateQty = (delta) => {
    setQty((prev) => {
      const next = prev + delta
      return next < 1 ? 1 : next
    })
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
      <h1 className="font-headline-md text-headline-md text-on-surface mb-4">
        Smartphone AI Thế Hệ Mới - Pro Max Edition (2024) - Bản Quốc Tế
      </h1>

      <div className="flex flex-wrap items-center gap-6 mb-6">
        <div className="flex items-center gap-1">
          <span className="text-primary font-bold">4.9</span>
          <Stars />
        </div>
        <div className="h-4 w-px bg-outline-variant" />
        <span className="text-on-surface-variant font-label-md text-label-md">
          1.2k Đánh giá
        </span>
        <div className="h-4 w-px bg-outline-variant" />
        <span className="text-on-surface-variant font-label-md text-label-md">
          5.4k Đã bán
        </span>
      </div>

      <div className="bg-surface-container-low p-6 rounded-lg mb-6">
        <div className="flex items-baseline gap-4">
          <span className="text-[32px] font-bold text-primary-container">
            28.490.000₫
          </span>
          <span className="text-on-surface-variant line-through text-body-md">
            33.500.000₫
          </span>
          <span className="bg-primary-container/20 text-primary px-2 py-0.5 rounded font-label-md text-label-md">
            GIẢM 15%
          </span>
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

        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] items-start">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase mt-2">
            Màu sắc
          </span>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => {
              const isSelected = c === selectedColor
              return (
                <button
                  key={c}
                  className={
                    isSelected
                      ? 'px-4 py-2 border-2 border-primary rounded-lg font-body-md bg-primary/5'
                      : 'px-4 py-2 border border-outline-variant rounded-lg font-body-md hover:border-primary transition-all'
                  }
                  type="button"
                  onClick={() => setSelectedColor(c)}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] items-start">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase mt-2">
            Dung lượng
          </span>
          <div className="flex flex-wrap gap-3">
            {storages.map((s) => {
              const isSelected = s === selectedStorage
              return (
                <button
                  key={s}
                  className={
                    isSelected
                      ? 'px-4 py-2 border-2 border-primary rounded-lg font-body-md bg-primary/5'
                      : 'px-4 py-2 border border-outline-variant rounded-lg font-body-md hover:border-primary transition-all'
                  }
                  type="button"
                  onClick={() => setSelectedStorage(s)}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] items-center">
          <span className="text-on-surface-variant font-label-md text-label-md uppercase">
            Số lượng
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-surface-container transition-all"
                type="button"
                onClick={() => updateQty(-1)}
                aria-label="Giảm số lượng"
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
                aria-label="Số lượng"
              />
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-surface-container transition-all"
                type="button"
                onClick={() => updateQty(1)}
                aria-label="Tăng số lượng"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            <span className="text-on-surface-variant font-label-md text-label-md">
              98 sản phẩm có sẵn
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            className="flex-1 h-12 border-2 border-primary-container text-primary-container rounded-lg font-title-md flex items-center justify-center gap-2 hover:bg-primary-container/5 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined">add_shopping_cart</span>
            Thêm vào giỏ hàng
          </button>
          <button
            className="flex-1 h-12 bg-primary-container text-white rounded-lg font-title-md flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            type="button"
          >
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  )
}
