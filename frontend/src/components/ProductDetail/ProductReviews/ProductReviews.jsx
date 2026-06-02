import { formatCompact } from '../../../lib/format'

function ReviewStars({ value = 0 }) {
  const rating = Number(value || 0)

  return (
    <span className="text-yellow-500 text-sm flex">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`material-symbols-outlined text-[14px] ${rating >= index + 1 ? 'opacity-100' : 'opacity-30'}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
    </span>
  )
}

function formatDate(value) {
  if (!value) return ''

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function ProductReviews({ product }) {
  const reviews = product?.reviews || []

  return (
    <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
      <h2 className="font-title-lg text-title-lg mb-6 border-l-4 border-primary pl-4 uppercase tracking-wider">
        Đánh giá sản phẩm
      </h2>
      {reviews.length ? (
        <div className="space-y-8">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-4 border-b border-outline-variant pb-6 last:border-b-0">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-on-secondary-container flex-shrink-0">
                {(review.userName || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-title-md font-bold">{review.userName || 'Khách hàng'}</span>
                  <ReviewStars value={review.rating} />
                </div>
                <p className="text-on-surface-variant font-body-md">
                  {review.comment || 'Khách hàng không để lại bình luận.'}
                </p>
                <p className="text-on-surface-variant/60 text-[12px]">
                  {formatDate(review.createdAt)}
                </p>
              </div>
            </div>
          ))}

          <button
            className="w-full py-3 text-primary font-title-md hover:bg-primary/5 rounded-lg transition-all"
            type="button"
          >
            Xem tất cả {formatCompact(product.ratingCount)} đánh giá
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-surface-container-low px-4 py-4 text-on-surface-variant">
          Sản phẩm chưa có đánh giá.
        </div>
      )}
    </div>
  )
}
