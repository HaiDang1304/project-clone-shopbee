function ReviewStars() {
  return (
    <span className="text-yellow-500 text-sm flex">
      <span
        className="material-symbols-outlined text-[14px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
      <span
        className="material-symbols-outlined text-[14px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
      <span
        className="material-symbols-outlined text-[14px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
      <span
        className="material-symbols-outlined text-[14px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
      <span
        className="material-symbols-outlined text-[14px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
    </span>
  )
}

export default function ProductReviews() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
      <h2 className="font-title-lg text-title-lg mb-6 border-l-4 border-primary pl-4 uppercase tracking-wider">
        Đánh giá sản phẩm
      </h2>
      <div className="space-y-8">
        <div className="flex gap-4 border-b border-outline-variant pb-6">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-on-secondary-container flex-shrink-0">
            H
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-title-md font-bold">Hoàng Nam</span>
              <ReviewStars />
            </div>
            <p className="text-on-surface-variant font-body-md">
              Sản phẩm rất tuyệt vời, giao hàng nhanh chóng. Đóng gói rất kỹ,
              máy dùng cực kỳ mượt, camera chụp đêm đỉnh cao luôn.
            </p>
            <div className="flex gap-2 mt-2">
              <img
                alt="Review Image"
                className="w-16 h-16 rounded-lg object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHKHMLCtoubZX0HWsqMXs5L03d-LJPTBPvStPiTLAwGcSJwT8vLm6qtyN3iBJ7dsRPcytrjkwsh0A9sR3M12R7pOYlF4Jqp-255W30j3HLycd6RrMaYyIxOp3FSUXxGuDmiY-Hc6by951QOnfTpRKnwzMIBfl1I15hHh7sb_J-5SXC1niXmThFkqAtk4K9YYJtojHwwfqrSSGF5M6DxjK0n6nw8YeA3eLjFUJ-dTtYjQg5AX5QI4axbTavG8Cfr4cDwx5Hgq2nSPEa"
              />
            </div>
            <p className="text-on-surface-variant/60 text-[12px]">
              2024-02-28 14:30 | Phân loại hàng: Titanium Đen, 512GB
            </p>
          </div>
        </div>

        <button
          className="w-full py-3 text-primary font-title-md hover:bg-primary/5 rounded-lg transition-all"
          type="button"
        >
          Xem tất cả 1.2k đánh giá
        </button>
      </div>
    </div>
  )
}
