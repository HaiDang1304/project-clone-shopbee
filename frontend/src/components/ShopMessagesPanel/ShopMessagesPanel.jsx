import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { apiAssetUrl, apiGet, apiPost } from '../../lib/api'
import { getAuthUser } from '../../lib/auth'
import { getChatSocket } from '../../lib/chatSocket'

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

function getConversationSubtitle(conversation, mode) {
  if (conversation.productName) return conversation.productName
  return mode === 'seller' ? conversation.shopName || 'Gian hàng của bạn' : 'Cuộc trò chuyện với shop'
}

function getConversationAvatar(conversation, mode) {
  if (mode === 'seller') return apiAssetUrl(conversation.customerAvatarUrl) || fallbackAvatar
  return apiAssetUrl(conversation.shopAvatarUrl) || fallbackAvatar
}

function getMessageAvatar(message, conversation, mode) {
  if (message.mine) return ''
  return getConversationAvatar(conversation, mode)
}

function modeCopy(mode) {
  if (mode === 'seller') {
    return {
      title: 'Hộp thư bán hàng',
      description: 'Quản lý nhiều khách nhắn đến shop của bạn.',
      empty: 'Chưa có khách hàng nào nhắn cho shop.',
      select: 'Chọn một khách hàng để trả lời',
      placeholder: 'Trả lời khách hàng...',
    }
  }

  return {
    title: 'Hộp thư mua hàng',
    description: 'Theo dõi tư vấn từ các shop bạn quan tâm.',
    empty: 'Bạn chưa có cuộc trò chuyện với shop nào.',
    select: 'Chọn một shop để nhắn tin',
    placeholder: 'Nhập tin nhắn cho shop...',
  }
}

export default function ShopMessagesPanel({ mode = 'customer', initialShopId = '', initialProductId = '', className = '' }) {
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const joinedConversationRef = useRef('')
  const user = useMemo(() => getAuthUser(), [])
  const userId = user?.id || ''
  const copy = modeCopy(mode)
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const socket = useMemo(() => (user ? getChatSocket() : null), [user])

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

        const response = await apiGet(`/api/shop-chats/conversations?role=${encodeURIComponent(mode)}`)
        if (ignore) return

        const nextConversations = response.data || []
        setConversations(nextConversations)
        setActiveConversationId((current) => {
          const stillExists = nextConversations.some((item) => Number(item.id) === Number(current))
          const nextActiveId = createdConversation?.id || (stillExists ? current : '') || nextConversations[0]?.id || ''
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
    let ignore = false

    if (!activeConversationId) {
      Promise.resolve().then(() => {
        if (!ignore) {
          setMessages([])
          setActiveConversation(null)
        }
      })
      return () => {
        ignore = true
      }
    }

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

    return () => {
      ignore = true
    }
  }, [activeConversationId, activeFromList])

  useEffect(() => {
    if (!socket || !activeConversationId) return undefined

    const previousConversationId = joinedConversationRef.current
    if (previousConversationId && previousConversationId !== String(activeConversationId)) {
      socket.emit('shop-chat:leave', { conversationId: previousConversationId })
    }

    joinedConversationRef.current = String(activeConversationId)
    socket.emit('shop-chat:join', { conversationId: activeConversationId }, (response) => {
      if (!response?.ok) setError(response?.message || 'Không thể kết nối cuộc trò chuyện')
    })

    return () => {
      socket.emit('shop-chat:leave', { conversationId: activeConversationId })
    }
  }, [activeConversationId, socket])

  useEffect(() => {
    if (!socket) return undefined

    function updateConversationList(conversation, message) {
      if (!conversation) return
      setConversations((current) => {
        const exists = current.some((item) => Number(item.id) === Number(conversation.id))
        const nextConversation = {
          ...conversation,
          lastMessage: message?.message || conversation.lastMessage,
          lastMessageAt: message?.createdAt || conversation.lastMessageAt,
        }
        const next = exists
          ? current.map((item) => (Number(item.id) === Number(conversation.id) ? { ...item, ...nextConversation } : item))
          : [nextConversation, ...current]

        return next.sort((left, right) => new Date(right.lastMessageAt || 0) - new Date(left.lastMessageAt || 0))
      })
    }

    function handleMessage(payload = {}) {
      const nextMessage = payload.message
      const conversation = payload.conversation
      updateConversationList(conversation, nextMessage)

      if (Number(payload.conversationId) !== Number(activeConversationId) || !nextMessage) return
      if (conversation) setActiveConversation(conversation)
      setMessages((current) => {
        if (current.some((item) => Number(item.id) === Number(nextMessage.id))) return current
        return [...current, nextMessage]
      })
    }

    function handleConversationUpdated(payload = {}) {
      updateConversationList(payload.conversation, payload.message)
    }

    function handleConnectError(err) {
      setError(err?.message || 'Không kết nối được realtime chat')
    }

    socket.on('shop-chat:message', handleMessage)
    socket.on('shop-chat:conversation-updated', handleConversationUpdated)
    socket.on('connect_error', handleConnectError)

    return () => {
      socket.off('shop-chat:message', handleMessage)
      socket.off('shop-chat:conversation-updated', handleConversationUpdated)
      socket.off('connect_error', handleConnectError)
    }
  }, [activeConversationId, socket])

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

    const activeSocket = socket || getChatSocket()
    if (!activeSocket.connected) activeSocket.connect()

    activeSocket.emit('shop-chat:send', { conversationId: activeConversationId, message }, (response) => {
      setSending(false)
      if (response?.ok) return
      setInput(message)
      setError(response?.message || 'Kh?ng g?i ???c tin nh?n')
    })
  }

  if (!user) return null

  const currentConversation = activeConversation || activeFromList
  const currentTitle = currentConversation ? getConversationTitle(currentConversation, mode) : 'Tin nhắn'
  const currentAvatar = currentConversation ? getConversationAvatar(currentConversation, mode) : fallbackAvatar

  return (
    <section className={`overflow-hidden rounded-xl border border-[#e5ddd5] bg-white shadow-sm ${className}`}>
      <div className="grid min-h-[calc(100vh-210px)] grid-cols-1 lg:min-h-[700px] lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-b border-[#e5ddd5] bg-[#fbfaf7] lg:border-b-0 lg:border-r">
          <div className="border-b border-[#e5ddd5] px-4 py-4">
            <h2 className="text-[18px] font-bold text-[#201915]">{copy.title}</h2>
            <p className="mt-1 text-[12px] leading-5 text-[#766a61]">{copy.description}</p>
          </div>

          <div className="max-h-[320px] overflow-y-auto p-2 lg:max-h-[640px]">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => <div key={index} className="mb-2 h-[76px] animate-pulse rounded-xl bg-white" />)
            ) : conversations.length ? (
              conversations.map((conversation) => {
                const active = Number(conversation.id) === Number(activeConversationId)
                return (
                  <button
                    key={conversation.id}
                    className={`mb-2 flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? 'border-[#d45b32] bg-[#fff4ef] text-[#301b13]'
                        : 'border-transparent bg-white text-[#241f1b] hover:border-[#e5ddd5] hover:bg-[#f7f3ef]'
                    }`}
                    type="button"
                    onClick={() => setActiveConversationId(String(conversation.id))}
                  >
                    <img className="h-12 w-12 shrink-0 rounded-full object-cover" src={getConversationAvatar(conversation, mode)} alt="" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[14px] font-bold">{getConversationTitle(conversation, mode)}</span>
                        <span className="shrink-0 text-[10px] font-medium text-[#9b8d84]">{formatTime(conversation.lastMessageAt)}</span>
                      </span>
                      <span className="mt-1 block truncate text-[12px] font-medium text-[#6a5d55]">
                        {getConversationSubtitle(conversation, mode)}
                      </span>
                      <span className="mt-1 block truncate text-[12px] text-[#8a7c73]">
                        {conversation.lastMessage || 'Chưa có tin nhắn'}
                      </span>
                    </span>
                  </button>
                )
              })
            ) : (
              <div className="rounded-xl border border-[#e5ddd5] bg-white px-4 py-6 text-center text-[13px] leading-6 text-[#766a61]">
                {copy.empty}
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-h-[560px] flex-col lg:min-h-[700px]">
          {currentConversation ? (
            <>
              <header className="flex min-h-16 items-center gap-3 border-b border-[#e5ddd5] px-4 py-3">
                <img className="h-11 w-11 rounded-full object-cover" src={currentAvatar} alt={currentTitle} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[15px] font-bold text-[#201915]">{currentTitle}</h3>
                  <p className="truncate text-[12px] text-[#766a61]">
                    {getConversationSubtitle(currentConversation, mode)}
                  </p>
                </div>
                {currentConversation.productSlug ? (
                  <Link
                    className="hidden rounded-lg border border-[#ddd4cc] px-3 py-2 text-[12px] font-bold text-[#3f352f] hover:border-[#d45b32] hover:text-[#d45b32] sm:inline-flex"
                    to={`/product/${currentConversation.productSlug}`}
                  >
                    Xem sản phẩm
                  </Link>
                ) : null}
              </header>

              <div className="flex-1 overflow-y-auto bg-[#f5f6f1] px-3 py-4 sm:px-4">
                <div className="mx-auto flex w-full max-w-[780px] flex-col gap-3">
                  {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div> : null}
                  {loadingMessages ? <div className="h-20 animate-pulse rounded-lg bg-white" /> : null}
                  {messages.map((message) => {
                    const avatar = getMessageAvatar(message, currentConversation, mode)
                    return (
                      <div key={message.id} className={`flex items-end gap-2 ${message.mine ? 'justify-end' : 'justify-start'}`}>
                        {!message.mine ? <img className="h-8 w-8 shrink-0 rounded-full object-cover" src={avatar} alt="" /> : null}
                        <div className={`flex max-w-[min(560px,82%)] flex-col ${message.mine ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-2xl px-4 py-2 text-[13px] leading-6 shadow-sm ${
                              message.mine
                                ? 'rounded-br-md bg-[#d45b32] text-white'
                                : 'rounded-bl-md border border-[#e5ddd5] bg-white text-[#241f1b]'
                            }`}
                          >
                            <p className="whitespace-pre-line break-words">{message.message}</p>
                          </div>
                          <p className={`mt-1 px-1 text-[10px] ${message.mine ? 'text-[#b6654c]' : 'text-[#9b8d84]'}`}>
                            {message.senderName} · {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {!loadingMessages && !messages.length ? (
                    <div className="rounded-xl border border-[#e5ddd5] bg-white px-4 py-6 text-center text-[13px] text-[#766a61]">
                      Bắt đầu cuộc trò chuyện bằng một lời nhắn ngắn gọn.
                    </div>
                  ) : null}
                </div>
                <div ref={messagesEndRef} />
              </div>

              <form className="flex items-end gap-2 border-t border-[#e5ddd5] bg-white p-3" onSubmit={sendMessage}>
                <textarea
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border-[#ddd4cc] bg-[#fbfaf7] px-3 py-2 text-[13px] focus:border-[#d45b32] focus:ring-0"
                  rows={1}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      sendMessage(event)
                    }
                  }}
                  placeholder={copy.placeholder}
                  disabled={sending}
                />
                <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#d45b32] text-white hover:bg-[#bd4926] disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!input.trim() || sending} aria-label="Gửi tin nhắn">
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-5 py-12 text-center">
              <div>
                <span className="material-symbols-outlined text-[44px] text-[#d45b32]">forum</span>
                <h3 className="mt-3 text-[18px] font-bold text-[#201915]">{copy.select}</h3>
                <p className="mt-2 max-w-sm text-[13px] leading-6 text-[#766a61]">{copy.empty}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
