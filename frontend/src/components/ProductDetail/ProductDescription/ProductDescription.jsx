export default function ProductDescription() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
      <h2 className="font-title-lg text-title-lg mb-6 border-l-4 border-primary pl-4 uppercase tracking-wider">
        Mô tả sản phẩm
      </h2>
      <div className="space-y-4 text-on-surface-variant font-body-md leading-relaxed">
        <p>
          Chào mừng bạn đến với kỷ nguyên smartphone AI mới. Pro Max Edition mang
          đến sức mạnh xử lý vượt trội với chip AI thế hệ 4, tối ưu hóa mọi tác
          vụ từ chụp ảnh đến quản lý năng lượng.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Màn hình Super AMOLED 6.8 inch, tần số quét 120Hz mượt mà.</li>
          <li>Hệ thống Camera AI 200MP với khả năng chụp đêm ấn tượng.</li>
          <li>Pin 5000mAh, hỗ trợ sạc nhanh 100W đầy pin trong 30 phút.</li>
          <li>Khung Titanium cao cấp, bền bỉ và sang trọng.</li>
          <li>Tích hợp trợ lý ảo AI thế hệ mới nhất.</li>
        </ul>
        <p>
          Sản phẩm đi kèm bộ quà tặng trị giá 2.000.000₫ bao gồm bao da cao cấp
          và gói bảo hành vàng 24 tháng.
        </p>
      </div>
    </div>
  )
}
