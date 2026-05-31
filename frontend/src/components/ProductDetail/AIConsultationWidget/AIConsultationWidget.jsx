import { useState } from 'react'

export default function AIConsultationWidget() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-4">
      <div
        className={
          open
            ? 'glass-panel w-80 max-h-[450px] rounded-2xl shadow-2xl flex flex-col border-primary/20 overflow-hidden origin-bottom-right transition-all duration-300 scale-100 opacity-100'
            : 'glass-panel w-80 max-h-[450px] rounded-2xl shadow-2xl hidden flex-col border-primary/20 overflow-hidden origin-bottom-right transition-all duration-300 scale-95 opacity-0'
        }
        aria-hidden={!open}
      >
        <div className="bg-primary p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">auto_awesome</span>
            <span className="font-title-md">Trợ lý AI Thông Minh</span>
          </div>
          <button
            className="hover:bg-white/20 rounded-full p-1"
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Đóng chat AI"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 h-[300px] bg-white/50">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">
                auto_awesome
              </span>
            </div>
            <div className="bg-surface-container-high p-3 rounded-2xl rounded-tl-none text-body-md max-w-[85%]">
              Chào bạn! Tôi là trợ lý AI của cửa hàng. Bạn cần hỏi thêm gì về
              chiếc Smartphone AI Pro Max này không?
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-none text-body-md max-w-[85%]">
              Pin con này dùng được bao lâu vậy AI?
            </div>
          </div>

          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">
                auto_awesome
              </span>
            </div>
            <div className="bg-surface-container-high p-3 rounded-2xl rounded-tl-none text-body-md max-w-[85%]">
              <span className="flex items-center gap-1 font-bold text-primary mb-1">
                <span className="material-symbols-outlined text-[14px]">
                  auto_awesome
                </span>
                AI Phản hồi
              </span>
              Dựa trên thông số và đánh giá của người dùng, máy có thể sử dụng
              lên đến 1.5 ngày với các tác vụ thông thường. Nếu chơi game liên
              tục, pin trụ được khoảng 7-8 tiếng nhé!
            </div>
          </div>
        </div>

        <div className="p-3 bg-white border-t border-outline-variant flex gap-2">
          <input
            className="flex-1 border-none bg-surface-container rounded-full px-4 h-10 text-body-md focus:ring-1 focus:ring-primary"
            placeholder="Nhập câu hỏi..."
            type="text"
          />
          <button
            className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center"
            type="button"
            aria-label="Gửi"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>

      <button
        className="h-14 px-6 rounded-full bg-primary text-white shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all group"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Hỏi AI về sản phẩm này"
      >
        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">
          auto_awesome
        </span>
        <span className="font-title-md">Hỏi AI về sản phẩm này</span>
      </button>
    </div>
  )
}
