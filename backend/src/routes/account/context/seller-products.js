const { crypto, query, allowedProductStatuses, normalizeProductOptions, slugify } = require('./common')

function toSellerProduct(row) {
  if (!row) return null

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    price: Number(row.price || 0),
    originalPrice: row.original_price === null || row.original_price === undefined ? '' : Number(row.original_price),
    stock: Number(row.stock || 0),
    weightGrams: row.weight_grams == null ? '' : Number(row.weight_grams),
    thumbnailUrl: row.thumbnail_url || '',
    images: row.images || [],
    status: row.status || (Number(row.is_active) === 1 ? 'active' : 'hidden'),
    productOptions: normalizeProductOptions(row.product_options),
    isActive: Boolean(row.is_active),
    ratingAvg: Number(row.rating_avg || 0),
    ratingCount: Number(row.rating_count || 0),
    soldCount: Number(row.sold_count || 0),
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name || '',
          slug: row.category_slug || '',
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeSellerProductPayload(body = {}) {
  const name = String(body.name || '').trim()
  const description = String(body.description || '').trim()
  const thumbnailUrl = String(body.thumbnailUrl || '').trim()
  const categoryId = body.categoryId === undefined || body.categoryId === null || body.categoryId === '' ? null : Number(body.categoryId)
  const price = Number(body.price)
  const originalPrice = body.originalPrice === undefined || body.originalPrice === null || body.originalPrice === '' ? null : Number(body.originalPrice)
  const stock = Number.parseInt(body.stock, 10)
  const weightGrams = Number.parseInt(body.weightGrams, 10)
  const status = allowedProductStatuses.has(String(body.status || '').trim())
    ? String(body.status || '').trim()
    : body.isActive === false
      ? 'hidden'
      : 'active'
  const images = Array.isArray(body.images)
    ? body.images.map((image) => String(image || '').trim()).filter(Boolean)
    : []
  const imageDataUrls = Array.isArray(body.imageDataUrls)
    ? body.imageDataUrls.map((image) => String(image || '').trim()).filter(Boolean)
    : []
  const productOptions = normalizeProductOptions(body.productOptions)

  if (!name) {
    const err = new Error('Tên sản phẩm tối thiểu 3 ký tự')
    err.status = 400
    throw err
  }

  if (!Number.isFinite(price) || price < 0) {
    const err = new Error('Giá bán không hợp lệ')
    err.status = 400
    throw err
  }

  if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < price)) {
    const err = new Error('Giá gốc phải lớn hơn hoặc bằng giá bán')
    err.status = 400
    throw err
  }

  if (!Number.isSafeInteger(stock) || stock < 0) {
    const err = new Error('Tồn kho không hợp lệ')
    err.status = 400
    throw err
  }

  if (!Number.isSafeInteger(weightGrams) || weightGrams <= 0) {
    const err = new Error('Vui lòng nhập khối lượng sản phẩm hợp lệ theo gram')
    err.status = 400
    throw err
  }

  if (categoryId !== null && (!Number.isSafeInteger(categoryId) || categoryId <= 0)) {
    const err = new Error('Danh mục không hợp lệ')
    err.status = 400
    throw err
  }

  if (status === 'active' && !categoryId) {
    const err = new Error('Vui lòng chọn danh mục khi đăng sản phẩm')
    err.status = 400
    throw err
  }

  if (thumbnailUrl.length > 500 || images.some((image) => image.length > 500)) {
    const err = new Error('URL ảnh sản phẩm quá dài')
    err.status = 400
    throw err
  }

  return {
    name,
    slug: slugify(name),
    description: description || null,
    thumbnailUrl: thumbnailUrl || null,
    categoryId,
    price,
    originalPrice,
    stock,
    weightGrams,
    status,
    isActive: status === 'active',
    images,
    imageDataUrls,
    productOptions,
  }
}

async function replaceProductImages(connection, productId, images) {
  await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productId])

  for (const [index, imageUrl] of images.entries()) {
    await connection.execute(
      `INSERT INTO product_images (product_id, image_url, sort_order)
       VALUES (?, ?, ?)`,
      [productId, imageUrl, index],
    )
  }
}

async function makeUniqueProductSlug(baseSlug) {
  const base = baseSlug || `product-${crypto.randomUUID().slice(0, 8)}`

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`
    const rows = await query('SELECT id FROM products WHERE slug = ? LIMIT 1', [slug])
    if (!rows.length) return slug
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`
}

async function readSellerProducts(userId) {
  const rows = await query(
     `SELECT p.id, p.slug, p.name, p.description, p.price, p.original_price, p.stock, p.weight_grams,
             p.thumbnail_url, p.status, p.product_options, p.is_active, p.rating_avg, p.rating_count, p.sold_count,
            p.created_at, p.updated_at,
            c.id AS category_id, c.name AS category_name, c.slug AS category_slug
     FROM products p
     JOIN shops s ON s.id = p.shop_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE s.owner_id = ?
     ORDER BY p.created_at DESC
     LIMIT 20`,
    [userId],
  )

  const products = rows.map(toSellerProduct)
  if (!products.length) return products

  const productIds = products.map((product) => product.id)
  const placeholders = productIds.map(() => '?').join(', ')
  const imageRows = await query(
    `SELECT product_id, image_url, sort_order
     FROM product_images
     WHERE product_id IN (${placeholders})
     ORDER BY product_id ASC, sort_order ASC, id ASC`,
    productIds,
  )
  const imagesByProduct = imageRows.reduce((result, row) => {
    const current = result.get(row.product_id) || []
    current.push(row.image_url)
    result.set(row.product_id, current)
    return result
  }, new Map())

  return products.map((product) => ({
    ...product,
    images: imagesByProduct.get(product.id) || (product.thumbnailUrl ? [product.thumbnailUrl] : []),
  }))
}

module.exports = {
  toSellerProduct,
  normalizeSellerProductPayload,
  replaceProductImages,
  makeUniqueProductSlug,
  readSellerProducts,
}
