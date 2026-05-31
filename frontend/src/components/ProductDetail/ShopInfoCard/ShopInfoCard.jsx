export default function ShopInfoCard() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-wrap md:flex-nowrap items-center gap-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-container p-0.5">
          <img
            alt="Shop Avatar"
            className="w-full h-full object-cover rounded-full"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBos7NrlY0-TuppRp-RoqqZ0pG0wvnS9qz6Jqw0KY1Xz88hEFMFxY_DwHZ_NDdV0rWIYDATdfeuDx0SvZM6LhibTBzfUo0maRHGZu4WMgy6QsSCd5mmNfP8zTmEyPX8ZqxRh3jZHLGlk3BiaLh9wOb6w3p0YnE39jqOoVaLvscW7XWViUHGaNBwQuvf9jxfEHnYbkSYOkjC4EHQiohKGklzco3noEK1MJdqKLsEYQYSX1c4xLi3uVhJh__WL2aTghmY9SyCN1FvSGK_"
          />
        </div>
        <div>
          <h3 className="font-title-md text-title-md">AI Tech Store Official</h3>
          <p className="text-on-surface-variant font-label-md text-label-md flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-tertiary" /> Online 2 phút
            trước
          </p>
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 border border-primary text-primary rounded font-label-md text-label-md hover:bg-primary/5"
              type="button"
            >
              Chat ngay
            </button>
            <button
              className="px-3 py-1 border border-outline-variant text-on-surface-variant rounded font-label-md text-label-md hover:bg-surface-container"
              type="button"
            >
              Xem shop
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1 border-l border-outline-variant pl-6">
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant font-label-md">Đánh giá</span>
          <span className="text-primary font-bold">4.8k</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant font-label-md">Tham gia</span>
          <span className="text-primary font-bold">3 năm trước</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant font-label-md">Sản phẩm</span>
          <span className="text-primary font-bold">142</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-on-surface-variant font-label-md">Phản hồi</span>
          <span className="text-primary font-bold">98%</span>
        </div>
      </div>
    </div>
  )
}
