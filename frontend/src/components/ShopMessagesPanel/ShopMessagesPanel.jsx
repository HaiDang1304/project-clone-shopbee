import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { apiAssetUrl, apiGet, apiPost } from '../../lib/api'
import { getAuthUser } from '../../lib/auth'

const fallbackAvatar = '/logo_shop.png'

function formatTime(value) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

function getConversationTitle(conversation, mode) {
  if (mode === 'seller') return conversation.customerName || 'Khách hàng'
  return conversation.shopName || 'Shop'
}

function getConversationAvatar(conversation, mode) {
  if (mode === 'seller') return apiAssetUrl(conversation.customerAvatarUrl) || fallbackAvatar
  return apiAssetUrl(conversation.shopAvatarUrl) || fallbackAvatar
}

export default function ShopMessagesPanel({ mode = 'customer', initialShopId = '', initialProductId = '', className = '' }) {
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const user = useMemo(() => getAuthUser(), [])
  const userId = user?.id || ''
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const activeFromList = useMemo(
    () => conversations.find((item) => Number(item.id) === Number(activeConversationId)) || null,
    [activeConversationId, conversations],
  )

  useEffect(() => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true })
    }
  }, [navigate, user])

  useEffect(() => {
    if (!userId) return undefined
    let ignore = false

    async function loadConversations() {
      setLoading(true)
      setError('')
      try {
        let createdConversation = null
        if (mode === 'customer' && initialShopId) {
          const response = await apiPost(`/api/shop-chats/shops/${initialShopId}/conversations`, {
            productId: initialProductId || undefined,
          })
          createdConversation = response.data?.conversation || null
        }

        const response = await apiGet('/api/shop-chats/conversations')
        if (ignore) return
        const nextConversations = response.data || []
        setConversations(nextConversations)
        setActiveConversationId((current) => {
          const nextActiveId = createdConversation?.id || current || nextConversations[0]?.id || ''
          return nextActiveId ? String(nextActiveId) : ''
        })
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được tin nhắn')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadConversations()

    return () => {
      ignore = true
    }
  }, [initialProductId, initialShopId, mode, userId])

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      setActiveConversation(null)
      return undefined
    }

    let ignore = false

    async function loadMessages({ quiet = false } = {}) {
      if (!quiet) setLoadingMessages(true)
      try {
        const response = await apiGet(`/api/shop-chats/conversations/${activeConversationId}/messages`)
        if (!ignore) {
          setActiveConversation(response.data?.conversation || activeFromList)
          setMessages(response.data?.messages || [])
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được nội dung trò chuyện')
      } finally {
        if (!ignore && !quiet) setLoadingMessages(false)
      }
    }

    loadMessages()
    const timer = window.setInterval(() => loadMessages({ quiet: true }), 6000)

    return () => {
      ignore = true
      window.clearInterval(timer)
    }
  }, [activeConversationId, activeFromList])

  useEffect(() => {
    window.setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 40)
  }, [messages.length, activeConversationId])

  async function sendMessage(event) {
    event.preventDefault()
    const message = input.trim()
    if (!message || !activeConversationId || sending) return

    setInput('')
    setSending(true)
    setError('')

    try {
      const response = await apiPost(`/api/shop-chats/conversations/${activeConversationId}/messages`, { message })
      const sentMessage = response.data
      setMessages((current) => [...current, sentMessage])
      setConversations((current) =>
        current.map((conversation) =>
          Number(conversation.id) === Number(activeConversationId)
            ? { ...conversation, lastMessage: sentMessage.message, lastMessageAt: sentMessage.createdAt }
            : conversation,
        ),
      )
    } catch (err) {
      setInput(message)
      setError(err.message || 'Không gửi được tin nhắn')
    } finally {
      setSending(false)
    }
  }

  if (!user) return null

  const currentConversation = activeConversation || activeFromList
  const currentTitle = currentConversation ? getConversationTitle(currentConversation, mode) : 'Tin nhắn'
  const currentAvatar = currentConversation ? getConversationAvatar(currentConversation, mode) : fallbackAvatar

  return (
    <section className={`overflow-hidden rounded-lg border border-[#eaded2] bg-white shadow-sm ${className}`}>
      <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="border-b border-[#eaded2] bg-[#fbfaf9] lg:border-b-0 lg:border-r">
          <div className="border-b border-[#eaded2] px-4 py-4">
            <h2 className="text-[18px] font-bold text-[#1d1712]">{mode === 'seller' ? 'Tin nhắn khách hàng' : 'Tin nhắn với shop'}</h2>
            <p className="mt-1 text-[12px] text-[#7b6556]">
              {mode === 'seller' ? 'Trao đổi đơn hàng, size và tồn kho với người mua.' : 'Theo dõi tư vấn từ các shop bạn quan tâm.'}
            </p>
          </div>

          <div className="max-h-[260px] overflow-y-auto p-2 lg:max-h-[620px]">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => <div key={index} className="mb-2 h-16 animate-pulse rounded-lg bg-white" />)
            ) : conversations.length ? (
              conversations.map((conversation) => {
                const active = Number(conversation.id) === Number(activeConversationId)
                return (
                  <button
                    key={conversation.id}
                    className={`mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                      active ? 'bg-[#fff2df] text-[#7a430f]' : 'bg-white text-[#24170f] hover:bg-[#f6efe8]'
                    }`}
                    type="button"
                    onClick={() => setActiveConversationId(String(conversation.id))}
                  >
                    <img className="h-11 w-11 shrink-0 rounded-full object-cover" src={getConversationAvatar(conversation, mode)} alt="" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold">{getConversationTitle(conversation, mode)}</span>
                      <span className="mt-1 block truncate text-[12px] text-[#7b6556]">
                        {conversation.lastMessage || conversation.productName || 'Chưa có tin nhắn'}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] text-[#9a8576]">{formatTime(conversation.lastMessageAt)}</span>
                  </button>
                )
              })
            ) : (
              <div className="rounded-lg border border-[#eaded2] bg-white px-4 py-6 text-center text-[13px] text-[#7b6556]">
                Chưa có cuộc trò chuyện nào.
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-h-[620px] flex-col">
          {currentConversation ? (
            <>
              <header className="flex min-h-16 items-center gap-3 border-b border-[#eaded2] px-4 py-3">
                <img className="h-11 w-11 rounded-full object-cover" src={currentAvatar} alt={currentTitle} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[15px] font-bold text-[#1d1712]">{currentTitle}</h3>
                  <p className="truncate text-[12px] text-[#7b6556]">
                    {currentConversation.productName ? `Đang trao đổi về ${currentConversation.productName}` : 'Cuộc trò chuyện ShopBee'}
                  </p>
                </div>
                {currentConversation.productSlug ? (
                  <Link className="rounded-lg border border-[#dfc8b5] px-3 py-2 text-[12px] font-bold text-[#7a430f] hover:border-[#9a5700]" to={`/product/${currentConversation.productSlug}`}>
                    Xem sản phẩm
                  </Link>
                ) : null}
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f4f1] px-4 py-4">
                {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div> : null}
                {loadingMessages ? <div className="h-20 animate-pulse rounded-lg bg-white" /> : null}
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] rounded-lg px-4 py-2 text-[13px] leading-6 ${message.mine ? 'bg-[#8a4b12] text-white' : 'border border-[#eaded2] bg-white text-[#24170f]'}`}>
                      <p className="whitespace-pre-line">{message.message}</p>
                      <p className={`mt-1 text-[10px] ${message.mine ? 'text-white/70' : 'text-[#9a8576]'}`}>
                        {message.senderName} · {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {!loadingMessages && !messages.length ? (
                  <div className="rounded-lg border border-[#eaded2] bg-white px-4 py-6 text-center text-[13px] text-[#7b6556]">
                    Bắt đầu cuộc trò chuyện bằng một lời nhắn ngắn gọn.
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>

              <form className="flex items-end gap-2 border-t border-[#eaded2] bg-white p-3" onSubmit={sendMessage}>
                <textarea
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border-[#dfc8b5] bg-[#fbfaf9] px-3 py-2 text-[13px] focus:border-[#9a5700] focus:ring-0"
                  rows={1}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      sendMessage(event)
                    }
                  }}
                  placeholder={mode === 'seller' ? 'Trả lời khách hàng...' : 'Nhập tin nhắn cho shop...'}
                  disabled={sending}
                />
                <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#8a4b12] text-white hover:bg-[#6f3b0e] disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!input.trim() || sending} aria-label="Gửi tin nhắn">
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-5 py-12 text-center">
              <div>
                <span className="material-symbols-outlined text-[44px] text-[#b98a4d]">forum</span>
                <h3 className="mt-3 text-[18px] font-bold text-[#1d1712]">Chọn một cuộc trò chuyện</h3>
                <p className="mt-2 max-w-sm text-[13px] leading-6 text-[#7b6556]">
                  {mode === 'seller' ? 'Khi khách nhắn cho shop, cuộc trò chuyện sẽ xuất hiện ở đây.' : 'Bấm Chat với shop ở trang sản phẩm hoặc shop để bắt đầu.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
