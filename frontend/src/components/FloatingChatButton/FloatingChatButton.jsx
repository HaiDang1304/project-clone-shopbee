import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiAssetUrl, apiPost } from '../../lib/api'
import { formatCurrency, productPath } from '../../lib/format'

const welcomeMessage = {
  role: 'assistant',
  content: 'Chào bạn, mình là trợ lý mua sắm của ShopBee. Bạn đang tìm món gì, tầm giá bao nhiêu, hoặc thích phong cách nào?',
  products: [],
}

const chatboxAvatar = '/logo-chatbox.png'
const quickPrompts = ['Áo đi chơi dưới 300k', 'Gợi ý sản phẩm bán chạy', 'Tìm đồ làm quà tặng']

function ChatProductCard({ product, onNavigate }) {
  const imageSrc = apiAssetUrl(product.thumbnailUrl || product.imageUrl) || '/logo_shop.png'

  return (
    <Link
      className="flex min-w-0 gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 transition-colors hover:border-primary/50 hover:bg-surface-container-low"
      to={productPath(product)}
      onClick={onNavigate}
    >
      <img className="h-[72px] w-[72px] shrink-0 rounded-md object-cover" src={imageSrc} alt={product.name} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-body-sm font-bold leading-5 text-on-surface">{product.name}</p>
        <p className="mt-1 text-title-sm font-title-sm text-primary">{formatCurrency(product.price)}</p>
        <p className="mt-1 truncate text-label-md text-on-surface-variant">
          {product.shop?.name || product.category?.name || 'ShopBee'}
        </p>
        {Number.isFinite(Number(product.stock)) ? (
          <p className="mt-1 text-label-md text-on-surface-variant">Còn {product.stock} sản phẩm</p>
        ) : null}
      </div>
      <span className="material-symbols-outlined self-center text-[18px] text-primary">chevron_right</span>
    </Link>
  )
}

function ChatBubble({ message, onNavigate }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isUser ? 'max-w-[84%] items-end' : 'max-w-[94%] items-start'} flex flex-col gap-2`}>
        <div
          className={`whitespace-pre-line rounded-lg px-4 py-3 text-body-sm leading-6 ${
            isUser
              ? 'bg-primary text-white'
              : 'border border-outline-variant bg-surface-container-lowest text-on-surface shadow-sm'
          }`}
        >
          {message.content}
        </div>
        {!isUser && message.products?.length ? (
          <div className="grid w-full gap-2">
            <p className="px-1 text-label-md font-label-md text-on-surface-variant">Sản phẩm phù hợp</p>
            {message.products.slice(0, 3).map((product) => (
              <ChatProductCard key={product.id || product.slug} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function FloatingChatButton() {
  const timeoutRef = useRef(null)
  const messagesEndRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [bouncing, setBouncing] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([welcomeMessage])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const history = useMemo(
    () =>
      messages
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .map((message) => ({ role: message.role, content: message.content })),
    [messages],
  )

  const handleMouseEnter = () => {
    setBouncing(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setBouncing(false), 1000)
  }

  const scrollToBottom = () => {
    window.setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50)
  }

  const sendMessage = async (text = input) => {
    const message = String(text || '').trim()
    if (!message || loading) return

    const userMessage = { role: 'user', content: message }
    setInput('')
    setError('')
    setMessages((current) => [...current, userMessage])
    setLoading(true)
    scrollToBottom()

    try {
      const response = await apiPost('/api/chatbox/message', {
        message,
        history,
      })
      const data = response.data || {}
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.reply || 'Mình chưa có câu trả lời phù hợp. Bạn thử mô tả rõ hơn nhé.',
          products: data.products || [],
        },
      ])
    } catch (err) {
      setError(err.message || 'Không gửi được tin nhắn')
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'Mình đang gặp lỗi khi tư vấn. Bạn thử lại sau một chút nhé.',
          products: [],
        },
      ])
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  if (!open) {
    return (
      <button
        className={`group fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full shadow-xl transition-all hover:scale-110 active:scale-95 ${bouncing ? 'animate-bounce' : ''}`}
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={handleMouseEnter}
        aria-label="Mở AI Chat"
      >
        <div className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 group-hover:translate-y-0" />
        <img className="relative z-10 h-12 w-12 rounded-full object-cover" src={chatboxAvatar} alt="" aria-hidden="true" />
        <div className="absolute -right-2 -top-2 rounded-full border-2 border-white bg-error px-1.5 py-0.5 text-[8px] font-bold">
          AI
        </div>
      </button>
    )
  }

  return (
    <section className="fixed bottom-5 right-4 z-50 flex h-[min(680px,calc(100vh-40px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg border border-surface-container bg-surface-container-lowest shadow-2xl">
      <header className="flex items-center gap-3 border-b border-surface-container bg-primary px-4 py-3 text-white">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
          <img className="h-10 w-10 rounded-full object-cover" src={chatboxAvatar} alt="" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-title-md font-semibold">Bee AI</h2>
         
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/15"
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Đóng chat"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto bg-surface-container-low px-4 py-4">
        {messages.map((message, index) => (
          <ChatBubble key={`${message.role}-${index}`} message={message} onNavigate={() => setOpen(false)} />
        ))}

        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-lg border border-surface-container bg-surface-container-lowest px-4 py-3 text-body-sm text-on-surface-variant">
              Đang tìm sản phẩm phù hợp...
            </div>
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-surface-container bg-surface-container-lowest px-4 py-3">
        {error ? <p className="mb-2 text-label-md text-error">{error}</p> : null}
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              className="shrink-0 rounded-full border border-outline-variant px-3 py-1.5 text-label-md text-on-surface-variant hover:border-primary hover:text-primary"
              type="button"
              onClick={() => sendMessage(prompt)}
              disabled={loading}
            >
              {prompt}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            sendMessage()
          }}
        >
          <textarea
            className="max-h-28 min-h-11 flex-1 resize-none rounded-lg border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm focus:border-primary focus:ring-primary"
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Mô tả sản phẩm bạn cần..."
            disabled={loading}
          />
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Gửi tin nhắn"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
      </div>
    </section>
  )
}
