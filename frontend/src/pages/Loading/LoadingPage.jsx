export default function LoadingPage({ text = 'Đang mở ShopBee...' }) {
  return (
    <div className="shopbee-loading-page" aria-label="Đang tải trang" role="status">
      <div className="shopbee-loading-page__logoWrap">
        <img className="shopbee-loading-page__logo" src="/logo_shop_remote.png" alt="ShopBee" />
      </div>
      <p className="shopbee-loading-page__text">{text}</p>
      <div className="shopbee-loading-page__bar" aria-hidden="true">
        <span />
      </div>
    </div>
  )
}
