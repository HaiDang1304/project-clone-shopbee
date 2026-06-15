import { useEffect, useRef, useState } from 'react'

import { apiAssetUrl, apiGet, apiPost } from '../../lib/api'
import { getAuthUser } from '../../lib/auth'

const fallbackAvatar = '/logo_shop.png'

export default function ShopChatModal({ open, shop, product, onClose }) {
  const messagesEndRef = useRef(null)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !shop?.id) return

    if (!getAuthUser()) {
      const redirect = `${window.location.pathname}${window.location.search}`
      window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`
      return
    }

    let ignore = false

    async function openConversation() {
      setLoading(true)
      setError('')
      try {
        const response = await apiPost(`/api/shop-chats/shops/${shop.id}/conversations`, {
          productId: product?.id,
        })
        if (!ignore) {
          setConversation(response.data?.conversation || null)
          setMessages(response.data?.messages || [])
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Không mở được cuộc trò chuyện')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    openConversation()

    return () => {
      ignore = true
    }
  }, [open, product?.id, shop?.id])

  useEffect(() => {
    if (!open || !conversation?.id) return

    const timer = window.setInterval(async () => {
      try {
        const response = await apiGet(`/api/shop-chats/conversations/${conversation.id}/messages`)
        setMessages(response.data?.messages || [])
      } catch {
        // Polling is best-effort; manual sending still reports errors.
      }
    }, 6000)

    return () => window.clearInterval(timer)
  }, [conversation?.id, open])

  useEffect(() => {
    window.setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 30)
  }, [messages.length, open])

  async function sendMessage(event) {
    event?.preventDefault()
    const message = input.trim()
    if (!message || !conversation?.id || sending) return

    setSending(true)
    setError('')
    setInput('')

    try {
      const response = await apiPost(`/api/shop-chats/conversations/${conversation.id}/messages`, { message })
      setMessages((current) => [...current, response.data])
    } catch (err) {
      setError(err.message || 'Không gửi được tin nhắn')
      setInput(message)
    } finally {
      setSending(false)
    }
  }

  if (!open || !shop) return null

  const avatarSrc = apiAssetUrl(shop.avatarUrl) || fallbackAvatar

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 md:items-center">
      <section className="flex h-[min(680px,calc(100vh-32px))] w-full max-w-[460px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-center gap-3 border-b border-[#eaded2] bg-[#8a4b12] px-4 py-3 text-white">
          <img className="h-12 w-12 rounded-full border border-white/40 object-cover" src={avatarSrc} alt={shop.name} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[16px] font-bold">{shop.name}</h2>
            <p className="truncate text-[12px] text-white/80">
              {product?.name ? `Đang hỏi về ${product.name}` : 'Chat với shop'}
            </p>
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15" type="button" onClick={onClose} aria-label="Đóng chat">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f4f1] px-4 py-4">
          {loading ? <div className="h-20 animate-pulse rounded-lg bg-white" /> : null}
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div> : null}

          {!loading && !messages.length ? (
            <div className="rounded-lg border border-[#eaded2] bg-white px-4 py-4 text-center text-[13px] text-[#7b6556]">
              Gửi lời nhắn đầu tiên để shop tư vấn size, tồn kho hoặc ưu đãi.
            </div>
          ) : null}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-lg px-4 py-2 text-[13px] leading-6 ${message.mine ? 'bg-[#8a4b12] text-white' : 'border border-[#eaded2] bg-white text-[#24170f]'}`}>
                <p className="whitespace-pre-line">{message.message}</p>
                <p className={`mt-1 text-[10px] ${message.mine ? 'text-white/70' : 'text-[#9a8576]'}`}>
                  {message.senderName}
                </p>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        <form className="flex items-end gap-2 border-t border-[#eaded2] bg-white p-3" onSubmit={sendMessage}>
          <textarea
            className="max-h-28 min-h-11 flex-1 resize-none rounded-lg border-[#dfc8b5] bg-[#fbfaf9] px-3 py-2 text-[13px] focus:border-[#9a5700] focus:ring-0"
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Nhập tin nhắn cho shop..."
            disabled={sending || loading}
          />
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#8a4b12] text-white hover:bg-[#6f3b0e] disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={!input.trim() || sending || loading}
            aria-label="Gửi tin nhắn"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
      </section>
    </div>
  )
}
