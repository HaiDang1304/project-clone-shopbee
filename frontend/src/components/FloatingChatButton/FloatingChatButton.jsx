import { useRef, useState } from 'react'

export default function FloatingChatButton() {
  const timeoutRef = useRef(null)
  const [bouncing, setBouncing] = useState(false)

  const handleMouseEnter = () => {
    setBouncing(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setBouncing(false), 1000)
  }

  return (
    <button
      className={`fixed bottom-8 right-8 w-16 h-16 bg-primary-container text-white rounded-full shadow-xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all group overflow-hidden ${bouncing ? 'animate-bounce' : ''}`}
      type="button"
      onMouseEnter={handleMouseEnter}
      aria-label="AI Chat"
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      <span
        className="material-symbols-outlined text-3xl relative z-10"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        smart_toy
      </span>
      <div className="absolute -top-2 -right-2 bg-error text-[8px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
        NEW
      </div>
    </button>
  )
}
