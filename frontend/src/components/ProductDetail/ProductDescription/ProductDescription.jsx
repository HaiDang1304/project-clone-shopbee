export default function ProductDescription({ product }) {
  const tags = product?.tags || []

  return (
    <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
      <h2 className="font-title-lg text-title-lg mb-6 border-l-4 border-primary pl-4 uppercase tracking-wider">
        Mô tả sản phẩm
      </h2>
      <div className="space-y-4 text-on-surface-variant font-body-md leading-relaxed">
        {product?.description ? (
          product.description.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))
        ) : (
          <p>Sản phẩm chưa có mô tả.</p>
        )}

        {tags.length ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-3 py-1 text-label-md text-primary"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
