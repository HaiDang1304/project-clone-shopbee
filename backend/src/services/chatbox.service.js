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
  const normalized = normalizeWhitespace(message)
    .toLowerCase()
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
    'mua',
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

async function searchProductsForChat(message) {
  const limit = Math.max(1, Math.min(Number(chatboxConfig.productLimit || 6), 10))
  const terms = extractSearchTerms(message)

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
    're',
    'san',
    'shop',
    'tim',
    'tu',
    'van',
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

  if (/ban chay|sale|khuyen mai|flash|gia re|duoi\s+\d|tren\s+\d|tam\s+\d/i.test(text)) return true
  if (!meaningfulTerms.length) return false
  return hasShoppingIntent(message) || meaningfulTerms.some((term) => term.length >= 3)
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

async function askGroq({ message, history, products }) {
  if (!chatboxConfig.groqApiKey) {
    return fallbackReply(message, products)
  }

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
          content:
            'Ban la tro ly tu van mua sam cua ShopBee. Pham vi duy nhat: tro chuyen de lam ro nhu cau mua sam, tim kiem va goi y san pham dang co tren san ShopBee dua tren PRODUCT_CONTEXT. Khong tra loi bat ky van de nao khac nhu code, tho, tin tuc, thoi tiet, y te, phap luat, tai chinh, bai tap, email hay kien thuc chung. Neu nguoi dung hoi ngoai pham vi, chi tra loi: "Minh chi ho tro tim kiem va goi y cac san pham dang co tren san ShopBee. Ban hay mo ta san pham, nhu cau su dung hoac muc gia mong muon nhe." Neu nhu cau mua sam con mo ho, hay hoi them 1-2 cau ngan gon ve loai san pham, ngan sach hoac muc dich su dung thay vi goi y ngay. Khi goi y san pham, phai nhac dung ten va link san pham trong PRODUCT_CONTEXT. Khong duoc bia san pham, gia, link hoac thong tin khong co trong PRODUCT_CONTEXT.',
        },
        {
          role: 'system',
          content: `PRODUCT_CONTEXT:\n${buildProductContext(products)}`,
        },
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

  if (isConversationOnly(cleanMessage)) {
    return {
      reply: CHATBOX_CLARIFY_REPLY,
      products: [],
    }
  }

  if (isOffTopicRequest(cleanMessage)) {
    return {
      reply: CHATBOX_SCOPE_REPLY,
      products: [],
    }
  }

  if (!shouldSuggestProducts(cleanMessage)) {
    return {
      reply: CHATBOX_CLARIFY_REPLY,
      products: [],
    }
  }

  const products = await searchProductsForChat(cleanMessage)
  if (!isWithinChatboxScope(cleanMessage, products)) {
    return {
      reply: CHATBOX_SCOPE_REPLY,
      products: [],
    }
  }

  const reply = await askGroq({
    message: cleanMessage,
    history,
    products,
  })

  return {
    reply,
    products,
  }
}

module.exports = {
  createChatboxReply,
  searchProductsForChat,
}
