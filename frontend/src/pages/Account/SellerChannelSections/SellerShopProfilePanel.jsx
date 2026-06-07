import { apiAssetUrl } from '../../../lib/api'
import { LocationSelectFields } from './common'

export function SellerShopProfilePanel({ shopForm, savingShopProfile, updateShopField, handleShopImageChange, handleShopProfileSubmit, locations }) {
  const avatarPreview = shopForm.avatarDataUrl || apiAssetUrl(shopForm.avatarUrl)
  const coverPreview = shopForm.coverDataUrl || apiAssetUrl(shopForm.coverUrl)

  return (
    <form className="space-y-5 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4" onSubmit={handleShopProfileSubmit}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-title-sm font-title-sm text-on-surface">Hồ sơ cửa hàng</h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">Cập nhật thông tin hiển thị, liên hệ và địa chỉ của shop.</p>
        </div>
        <button
          className="h-10 rounded-lg bg-primary px-5 text-label-md font-label-md text-on-primary hover:bg-primary/90 disabled:opacity-60"
          type="submit"
          disabled={savingShopProfile}
        >
          {savingShopProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
        <div
          className="flex h-36 items-center justify-center bg-surface-container bg-cover bg-center text-on-surface-variant"
          style={coverPreview ? { backgroundImage: `url(${coverPreview})` } : undefined}
        >
          {!coverPreview ? <span className="material-symbols-outlined text-[36px]">panorama</span> : null}
        </div>
        <div className="flex flex-wrap items-end gap-4 px-4 pb-4">
          <div className="-mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border-4 border-surface-container-low bg-surface-container-lowest text-primary">
            {avatarPreview ? (
              <img className="h-full w-full object-cover" src={avatarPreview} alt={shopForm.shopName || 'Cửa hàng'} referrerPolicy="no-referrer" />
            ) : (
              <span className="material-symbols-outlined text-[32px]">storefront</span>
            )}
          </div>
          <div className="min-w-0 pb-1">
            <p className="truncate text-title-sm font-title-sm text-on-surface">{shopForm.shopName || 'Tên cửa hàng'}</p>
            <p className="truncate text-body-sm text-on-surface-variant">{shopForm.addressLine1 || shopForm.province || 'Địa chỉ cửa hàng'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LocationSelectFields
          locations={locations}
          form={shopForm}
          disabled={savingShopProfile}
          onChange={updateShopField}
          provinceLabel="Tỉnh/Thành phố"
        />

        <label className="grid gap-2 md:col-span-2">
          <span className="text-body-sm text-on-surface-variant">Địa chỉ cửa hàng</span>
          <input
            className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
            value={shopForm.addressLine1}
            onChange={(event) => updateShopField('addressLine1', event.target.value)}
            disabled={savingShopProfile}
            required
          />
        </label>

        <div className="grid gap-2">
          <span className="text-body-sm text-on-surface-variant">Ảnh đại diện</span>
          <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Chọn ảnh
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => handleShopImageChange('avatarDataUrl', event)}
              disabled={savingShopProfile}
            />
          </label>
          <span className="truncate text-body-sm text-on-surface-variant">
            {shopForm.avatarFileName || (shopForm.avatarUrl ? 'Đang dùng ảnh hiện tại' : 'Chưa chọn ảnh')}
          </span>
        </div>

        <div className="grid gap-2">
          <span className="text-body-sm text-on-surface-variant">Ảnh bìa</span>
          <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Chọn ảnh
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => handleShopImageChange('coverDataUrl', event)}
              disabled={savingShopProfile}
            />
          </label>
          <span className="truncate text-body-sm text-on-surface-variant">
            {shopForm.coverFileName || (shopForm.coverUrl ? 'Đang dùng ảnh hiện tại' : 'Chưa chọn ảnh')}
          </span>
        </div>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-body-sm text-on-surface-variant">Mô tả cửa hàng</span>
          <textarea
            className="min-h-28 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
            value={shopForm.description}
            onChange={(event) => updateShopField('description', event.target.value)}
            disabled={savingShopProfile}
          />
        </label>
      </div>
    </form>
  )
}

