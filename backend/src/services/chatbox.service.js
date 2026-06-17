const chatboxConfig = require('../config/chatbox.config')
const { query } = require('../config/db')

const CHATBOX_SCOPE_REPLY =
  'Mình chỉ hỗ trợ tìm kiếm và gợi ý các sản phẩm đang có trên sàn ShopBee. Bạn hãy mô tả sản phẩm, nhu cầu sử dụng hoặc mức giá mong muốn nhé.'
const CHATBOX_CLARIFY_REPLY =
  'Mình đây. Bạn đang muốn tìm sản phẩm gì trên ShopBee? Bạn có thể nói loại sản phẩm, nhu cầu sử dụng, mức giá hoặc phong cách mong muốn nhé.'

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function toComparableText(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'd')
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return []

  return messages
    .slice(-8)
    .map((message) => ({
      role: message?.role === 'assistant' ? 'assistant' : 'user',
      content: normalizeWhitespace(message?.content).slice(0, 1000),
    }))
    .filter((message) => message.content)
}

function extractSearchTerms(message) {
  const normalized = toComparableText(message)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  const stopWords = new Set([
    'toi',
    'tôi',
    'minh',
    'mình',
    'ban',
    'bạn',
    'can',
    'cần',
    'muon',
    'muốn',
    'tim',
    'tìm',
    'goi',
    'gợi',
    'y',
    'ý',
    'san',
    'sản',
    'pham',
    'phẩm',
    'cho',
    'voi',
    'với',
    'la',
    'là',
    'co',
    'có',
    'khong',
    'không',
    'gia',
    'giá',
    'duoi',
    'dưới',
    'tren',
    'trên',
    'tam',
    'mua',
    'di',
    'choi',
  ])

  const terms = normalized
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2 && !stopWords.has(term))

  return [...new Set(terms)].slice(0, 8)
}

function mapProduct(row) {
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    price: Number(row.price || 0),
    originalPrice: row.original_price == null ? null : Number(row.original_price),
    stock: Number(row.stock || 0),
    thumbnailUrl: row.thumbnail_url || row.image_url || '',
    imageUrl: row.image_url || row.thumbnail_url || '',
    ratingAvg: Number(row.rating_avg || 0),
    ratingCount: Number(row.rating_count || 0),
    soldCount: Number(row.sold_count || 0),
    url: `/product/${row.slug || row.id}`,
    category: row.category_id
      ? {
          id: Number(row.category_id),
          name: row.category_name || '',
          slug: row.category_slug || '',
        }
      : null,
    shop: row.shop_id
      ? {
          id: Number(row.shop_id),
          name: row.shop_name || '',
          slug: row.shop_slug || '',
        }
      : null,
  }
}

function getProductLimit() {
  const configuredLimit = Number.parseInt(chatboxConfig.productLimit, 10)
  const safeLimit = Number.isSafeInteger(configuredLimit) ? configuredLimit : 6
  return Math.max(1, Math.min(safeLimit, 10))
}

async function loadFallbackProducts(limit) {
  const rows = await query(
    `SELECT
       p.id, p.slug, p.name, p.description, p.price, p.original_price, p.stock,
       p.thumbnail_url, p.rating_avg, p.rating_count, p.sold_count,
       c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
       s.id AS shop_id, s.name AS shop_name, s.slug AS shop_slug,
       (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     JOIN shops s ON s.id = p.shop_id
     JOIN users u ON u.id = s.owner_id
     WHERE p.is_active = 1 AND s.is_active = 1 AND u.role = 'seller' AND u.is_active = 1
     ORDER BY p.rating_avg DESC, p.sold_count DESC, p.created_at DESC
     LIMIT ?`,
    [limit],
  )

  return rows.map(mapProduct)
}

async function loadSearchableProducts(limit) {
  const rows = await query(
    `SELECT
       p.id, p.slug, p.name, p.description, p.price, p.original_price, p.stock,
       p.thumbnail_url, p.rating_avg, p.rating_count, p.sold_count,
       c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
       s.id AS shop_id, s.name AS shop_name, s.slug AS shop_slug,
       (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     JOIN shops s ON s.id = p.shop_id
     JOIN users u ON u.id = s.owner_id
     WHERE p.is_active = 1 AND s.is_active = 1 AND u.role = 'seller' AND u.is_active = 1
     ORDER BY p.rating_avg DESC, p.sold_count DESC, p.created_at DESC
     LIMIT ?`,
    [Math.max(limit * 5, 30)],
  )

  return rows.map(mapProduct)
}

function extractBudget(message) {
  const text = toComparableText(message)
  const match = text.match(/\b(duoi|toi da|max|tam|khoang)\s*(\d+(?:[.,]\d+)?)\s*(k|nghin|ngan|trieu|m)?\b/)
  if (!match) return null

  const amount = Number(String(match[2]).replace(',', '.'))
  if (!Number.isFinite(amount) || amount <= 0) return null

  const unit = match[3] || ''
  if (unit === 'trieu' || unit === 'm') return Math.round(amount * 1000000)
  if (unit === 'k' || unit === 'nghin' || unit === 'ngan') return Math.round(amount * 1000)
  return amount >= 10000 ? Math.round(amount) : Math.round(amount * 1000)
}

function detectCategoryIntent(message) {
  const text = toComparableText(message)
  if (/\b(ao|quan|vay|dam|thoi trang|mac|outfit)\b/i.test(text)) return 'thoi trang'
  if (/\b(dien thoai|tai nghe|quat|sac|pin|robot|dien tu)\b/i.test(text)) return 'dien tu'
  if (/\b(bep|nha|gia dung|do nha|hut bui|den ban)\b/i.test(text)) return 'gia dung'
  if (/\b(son|kem|my pham|lam dep|skincare)\b/i.test(text)) return 'lam dep'
  return ''
}

function scoreProductForMessage(product, message, terms, budget, categoryIntent) {
  const name = toComparableText(product.name)
  const description = toComparableText(product.description)
  const categoryName = toComparableText(product.category?.name || '')
  const haystack = `${name} ${description} ${categoryName}`
  let score = 0

  terms.forEach((term) => {
    if (name.includes(term)) score += 8
    if (categoryName.includes(term)) score += 6
    if (description.includes(term)) score += 2
  })

  if (categoryIntent && categoryName.includes(categoryIntent)) score += 18
  if (categoryIntent && !categoryName.includes(categoryIntent)) score -= 12

  if (budget) {
    if (product.price <= budget) score += 12
    else score -= 30
  }

  if (/(ban chay|hot|pho bien)/i.test(toComparableText(message))) score += Math.min(product.soldCount / 10, 8)
  score += Math.min(Number(product.ratingAvg || 0), 5)

  if (!terms.length && !categoryIntent && !budget) score += 1
  if (terms.length && !terms.some((term) => haystack.includes(term)) && !categoryIntent) score -= 10

  return score
}

async function searchProductsForChat(message) {
  const limit = getProductLimit()
  const terms = extractSearchTerms(message)
  const budget = extractBudget(message)
  const categoryIntent = detectCategoryIntent(message)

  try {
    const products = await loadSearchableProducts(limit)
    const scoredProducts = products
      .map((product) => ({
        product,
        score: scoreProductForMessage(product, message, terms, budget, categoryIntent),
      }))
      .filter(({ product, score }) => {
        const categoryName = toComparableText(product.category?.name || '')
        return (
          score > 0 &&
          (!budget || product.price <= budget) &&
          (!categoryIntent || categoryName.includes(categoryIntent))
        )
      })
      .sort((left, right) => right.score - left.score || right.product.soldCount - left.product.soldCount)
      .slice(0, limit)
      .map(({ product }) => product)

    if (scoredProducts.length) return scoredProducts
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Chatbox JS product search failed:', err)
  }

  const where = ['p.is_active = 1', 's.is_active = 1', "u.role = 'seller'", 'u.is_active = 1']
  const whereParams = []
  const relevanceParams = []
  let relevanceSql = '0'

  if (terms.length) {
    const likeConditions = []
    const relevanceParts = []

    terms.forEach((term) => {
      const like = `%${term}%`
      likeConditions.push('(LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(c.name) LIKE ?)')
      whereParams.push(like, like, like)
      relevanceParts.push('(CASE WHEN LOWER(p.name) LIKE ? THEN 4 ELSE 0 END)')
      relevanceParts.push('(CASE WHEN LOWER(p.description) LIKE ? THEN 2 ELSE 0 END)')
      relevanceParts.push('(CASE WHEN LOWER(c.name) LIKE ? THEN 3 ELSE 0 END)')
      relevanceParams.push(like, like, like)
    })

    where.push(`(${likeConditions.join(' OR ')})`)
    relevanceSql = relevanceParts.join(' + ')
  }

  try {
    const rows = await query(
      `SELECT
         p.id, p.slug, p.name, p.description, p.price, p.original_price, p.stock,
         p.thumbnail_url, p.rating_avg, p.rating_count, p.sold_count,
         c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
         s.id AS shop_id, s.name AS shop_name, s.slug AS shop_slug,
         (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url,
         ${relevanceSql} AS relevance_score
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       JOIN shops s ON s.id = p.shop_id
       JOIN users u ON u.id = s.owner_id
       WHERE ${where.join(' AND ')}
       ORDER BY relevance_score DESC, p.rating_avg DESC, p.sold_count DESC, p.created_at DESC
       LIMIT ?`,
      [...relevanceParams, ...whereParams, limit],
    )

    return rows.map(mapProduct)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Chatbox product search failed:', err)
    return loadFallbackProducts(limit)
  }
}

function buildProductContext(products) {
  if (!products.length) return 'Khong tim thay san pham phu hop trong CSDL.'

  return products
    .map((product, index) => {
      const parts = [
        `${index + 1}. ${product.name}`,
        `Gia: ${product.price} VND`,
        product.originalPrice ? `Gia goc: ${product.originalPrice} VND` : '',
        `Ton kho: ${product.stock}`,
        product.category?.name ? `Danh muc: ${product.category.name}` : '',
        product.shop?.name ? `Shop: ${product.shop.name}` : '',
        `Danh gia: ${product.ratingAvg}/5 (${product.ratingCount} luot)`,
        `Da ban: ${product.soldCount}`,
        `Link: ${product.url}`,
        product.description ? `Mo ta: ${normalizeWhitespace(product.description).slice(0, 260)}` : '',
      ]

      return parts.filter(Boolean).join(' | ')
    })
    .join('\n')
}

function isOffTopicRequest(message) {
  const text = toComparableText(message)
  return /(viet|vi.t|lam tho|lam th.|bai tho|b.i th.|code|lap trinh|l.p tr.nh|dich|d.ch|tom tat|t.m t.t|thoi tiet|th.i ti.t|tin tuc|tin t.c|bong da|b.ng da|suc khoe|s.c khoe|benh|b.nh|phap luat|ph.p lu.t|dau tu|d.u tu|chung khoan|ch.ng kho.n|bai tap|b.i t.p|giai toan|gi.i to.n|email|cv|resume)/i.test(text)
}

function hasShoppingIntent(message) {
  const text = toComparableText(message)
  return /(mua|tim|kiem|goi y|tu van|san pham|hang|shop|gia|re|dat|sale|khuyen mai|phu hop|duoi|tren|tam|loai nao|nen chon|qua|do)/i.test(text)
}

function getMeaningfulSearchTerms(message) {
  const genericTerms = new Set([
    'ban',
    'chay',
    'do',
    'gia',
    'goi',
    'hang',
    'kiem',
    'mua',
    'pham',
    'gi',
    'giup',
    're',
    'san',
    'shop',
    'tim',
    'tu',
    'van',
    'the',
    'y',
  ])

  return extractSearchTerms(message).filter((term) => {
    const comparable = toComparableText(term)
    return comparable.length >= 2 && !genericTerms.has(comparable)
  })
}

function isConversationOnly(message) {
  const text = toComparableText(message).replace(/[^\p{L}\p{N}\s?]/gu, ' ').replace(/\s+/g, ' ').trim()
  if (text.length <= 2) return true
  if (/\b(xin|hi|hello|alo|hey)\b/i.test(text) && /(chao|ch.o|cha.|ch.a)/i.test(text)) return true

  return /^(hi|hello|alo|chao|xin chao|hey|cam on|thanks|thank you|ok|oke|uk|uh|duoc|duoc roi|ban la ai|ban giup duoc gi|shopbee co gi|toi can tu van|tu van giup toi)$/i.test(
    text,
  )
}

function shouldSuggestProducts(message) {
  const text = toComparableText(message)
  const meaningfulTerms = getMeaningfulSearchTerms(message)
  const budget = extractBudget(message)
  const categoryIntent = detectCategoryIntent(message)

  if (budget || categoryIntent) return true
  if (/ban chay|sale|khuyen mai|flash|gia re|duoi\s+\d|tren\s+\d|tam\s+\d/i.test(text)) return true
  if (!meaningfulTerms.length) return false
  return hasShoppingIntent(message)
}

function isWithinChatboxScope(message, products) {
  if (isOffTopicRequest(message)) return false
  return hasShoppingIntent(message) || products.length > 0
}

function fallbackReply(message, products) {
  if (!products.length) {
    return 'Mình chưa tìm thấy sản phẩm thật sự khớp trong cửa hàng. Bạn mô tả thêm nhu cầu, mức giá hoặc loại sản phẩm nhé.'
  }

  const intro = /giá|gia|rẻ|re|dưới|duoi|tầm|tam/i.test(message)
    ? 'Mình tìm được vài sản phẩm có thể hợp với ngân sách của bạn:'
    : 'Mình gợi ý vài sản phẩm đang có trong cửa hàng:'

  const lines = products.slice(0, 3).map((product) => `- ${product.name}: ${Number(product.price).toLocaleString('vi-VN')}đ (${product.url})`)
  return `${intro}\n${lines.join('\n')}\nBạn bấm vào link sản phẩm để xem chi tiết nhé.`
}

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function createProductReply(message, products) {
  if (!products.length) {
    return 'Mình chưa thấy sản phẩm nào khớp thật sát với yêu cầu này. Bạn nói thêm giúp mình loại sản phẩm, ngân sách hoặc phong cách bạn thích nhé, mình lọc lại cho gọn hơn.'
  }

  const budget = extractBudget(message)
  const categoryIntent = detectCategoryIntent(message)
  const topProduct = products[0]
  const introParts = []

  if (categoryIntent) introParts.push('đúng nhóm bạn đang tìm')
  if (budget) introParts.push(`trong tầm dưới ${formatVnd(budget)}`)

  const intro = introParts.length
    ? `Mình lọc được vài lựa chọn ${introParts.join(', ')}.`
    : 'Mình tìm được vài lựa chọn khá hợp với nhu cầu của bạn.'

  const reason = topProduct
    ? `Mình ưu tiên "${topProduct.name}" vì giá ${formatVnd(topProduct.price)} và đang còn ${topProduct.stock} sản phẩm.`
    : ''

  return [
    intro,
    reason,
    'Bạn xem các thẻ sản phẩm bên dưới nhé. Nếu muốn, mình có thể lọc tiếp theo màu, shop, mức giá hoặc kiểu dáng bạn thích.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function createSmallTalkReply(message) {
  const text = toComparableText(message).replace(/[^\p{L}\p{N}\s?]/gu, ' ').replace(/\s+/g, ' ').trim()

  if (/^(hi|hello|alo|hey|chao|xin chao)$/i.test(text)) {
    return 'Chào bạn, mình đây. Bạn cứ nói món muốn mua, tầm giá hoặc phong cách bạn thích, mình sẽ lọc sản phẩm trên ShopBee cho thật gọn.'
  }

  if (/ban la ai|ban giup duoc gi|shopbee co gi/i.test(text)) {
    return 'Mình là trợ lý mua sắm của ShopBee. Mình có thể tìm sản phẩm theo nhu cầu, lọc theo giá, gợi ý món phù hợp và dẫn bạn tới đúng sản phẩm đang có trên sàn.'
  }

  if (/cam on|thanks|thank you/i.test(text)) {
    return 'Không có gì đâu, mình ở đây để phụ bạn chọn đồ cho đỡ mất thời gian. Cần lọc thêm theo giá, màu, shop hoặc loại sản phẩm thì nói mình nhé.'
  }

  if (/^(ok|oke|uk|uh|duoc|duoc roi)$/i.test(text)) {
    return 'Ổn rồi. Khi nào cần tìm thêm món nào khác, bạn cứ nhắn mình nhé.'
  }

  return CHATBOX_CLARIFY_REPLY
}

async function askGroq({ message, history, products = [] }) {
  if (!chatboxConfig.groqApiKey) {
    return products.length ? fallbackReply(message, products) : 'Mình đang sẵn sàng trò chuyện đây. Bạn muốn hỏi gì?'
  }

  const hasProducts = products.length > 0
  const systemPrompt = hasProducts
    ? 'Ban la tro ly mua sam ShopBee. Xung ho "minh" va "ban". Hay tra loi tu nhien, am ap, ngan gon toi da 3 cau. San pham goi y phai dua tren PRODUCT_CONTEXT, khong bia ten/gia/link/thong tin ngoai PRODUCT_CONTEXT. Khong viet danh sach danh so, khong bullet, khong nhac chu PRODUCT_CONTEXT, khong tu tinh lai ngan sach. Giao dien da hien thi the san pham rieng, nen chi can noi vi sao lua chon dau tien hop va hoi 1 cau de loc tiep neu can.'
    : 'Ban la tro ly chat cua ShopBee. Xung ho "minh" va "ban". Hay tro chuyen tu nhien, than thien va huu ich bang tieng Viet. Co the tra loi cac cau hoi thong thuong, gioi thieu ban than, huong dan nguoi dung, va neu cau hoi lien quan mua sam thi goi y nguoi dung noi ro san pham/gia/phong cach. Khong noi ban bi gioi han vao mot mau cau co dinh.'

  const response = await fetch(`${chatboxConfig.groqBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${chatboxConfig.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: chatboxConfig.groqModel,
      temperature: chatboxConfig.temperature,
      max_tokens: chatboxConfig.maxTokens,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...(hasProducts
          ? [
              {
                role: 'system',
                content: `PRODUCT_CONTEXT:\n${buildProductContext(products)}`,
              },
            ]
          : []),
        ...normalizeMessages(history),
        {
          role: 'user',
          content: message,
        },
      ],
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const err = new Error(data?.error?.message || 'Không gọi được Groq API')
    err.status = response.status
    throw err
  }

  return normalizeWhitespace(data?.choices?.[0]?.message?.content) || fallbackReply(message, products)
}

async function createChatboxReply({ message, history }) {
  const cleanMessage = normalizeWhitespace(message)
  if (!cleanMessage) {
    const err = new Error('Vui lòng nhập nội dung cần tư vấn')
    err.status = 400
    throw err
  }

  if (cleanMessage.length > 1200) {
    const err = new Error('Nội dung chat tối đa 1200 ký tự')
    err.status = 400
    throw err
  }

  if (!shouldSuggestProducts(cleanMessage)) {
    return {
      reply: await askGroq({
        message: cleanMessage,
        history,
        products: [],
      }),
      products: [],
    }
  }

  const products = await searchProductsForChat(cleanMessage)

  return {
    reply: await askGroq({
      message: cleanMessage,
      history,
      products,
    }),
    products,
  }
}

module.exports = {
  createChatboxReply,
  searchProductsForChat,
}
