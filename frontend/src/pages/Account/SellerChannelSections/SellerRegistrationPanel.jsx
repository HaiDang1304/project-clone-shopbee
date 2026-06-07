import { EmptySellerNotice, StatusBadge } from './common'
import { formatDateTime } from '../sellerChannel.utils'

export function SellerRegistrationPanel({ application, canSubmitShopApplication, shopForm, sellerSaving, updateShopField, handleShopSubmit }) {
  return (
    <div className="mt-5 space-y-5">
      {application ? (
        <div className="rounded-lg border border-outline-variant px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-title-sm font-title-sm text-on-surface">{application.shopName}</h2>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Gửi lúc {formatDateTime(application.createdAt) || 'chưa có thời gian'}
              </p>
            </div>
            <StatusBadge status={application.status} />
          </div>
          {application.status === 'rejected' && application.rejectReason ? (
            <div className="mt-4 rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              {application.rejectReason}
            </div>
          ) : null}
        </div>
      ) : null}

      {application?.status === 'pending' ? (
        <EmptySellerNotice
          icon="pending"
          title="Đơn đang chờ xác minh"
          message="Sau khi admin duyệt, tài khoản sẽ được mở dashboard kênh bán hàng."
        />
      ) : null}

      {canSubmitShopApplication ? (
        <form className="rounded-lg border border-outline-variant px-4 py-4" onSubmit={handleShopSubmit}>
          <h2 className="text-title-sm font-title-sm text-on-surface">
            {application?.status === 'rejected' ? 'Gửi lại đăng ký cửa hàng' : 'Đăng ký cửa hàng'}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-body-sm text-on-surface-variant">Tên cửa hàng</span>
              <input
                className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                value={shopForm.shopName}
                onChange={(event) => updateShopField('shopName', event.target.value)}
                disabled={sellerSaving}
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-body-sm text-on-surface-variant">Số điện thoại liên hệ</span>
              <input
                className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                value={shopForm.contactPhone}
                onChange={(event) => updateShopField('contactPhone', event.target.value)}
                disabled={sellerSaving}
                required
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-body-sm text-on-surface-variant">Email liên hệ</span>
              <input
                className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                type="email"
                value={shopForm.contactEmail}
                onChange={(event) => updateShopField('contactEmail', event.target.value)}
                disabled={sellerSaving}
              />
            </label>

            

            <label className="grid gap-2 md:col-span-2">
              <span className="text-body-sm text-on-surface-variant">Địa chỉ cửa hàng</span>
              <input
                className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                value={shopForm.addressLine1}
                onChange={(event) => updateShopField('addressLine1', event.target.value)}
                disabled={sellerSaving}
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-body-sm text-on-surface-variant">Phường/Xã</span>
              <input
                className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                value={shopForm.ward}
                onChange={(event) => updateShopField('ward', event.target.value)}
                disabled={sellerSaving}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-body-sm text-on-surface-variant">Tỉnh/Thành phố</span>
              <input
                className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                value={shopForm.province}
                onChange={(event) => updateShopField('province', event.target.value)}
                disabled={sellerSaving}
                required
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-body-sm text-on-surface-variant">Mô tả cửa hàng</span>
              <textarea
                className="min-h-24 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                value={shopForm.description}
                onChange={(event) => updateShopField('description', event.target.value)}
                disabled={sellerSaving}
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              className="h-10 rounded-lg bg-primary px-5 text-label-md font-label-md text-on-primary hover:bg-primary/90 disabled:opacity-60"
              type="submit"
              disabled={sellerSaving}
            >
              {sellerSaving ? 'Đang gửi...' : 'Gửi đăng ký'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
