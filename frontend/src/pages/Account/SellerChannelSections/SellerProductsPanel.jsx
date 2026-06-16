import { apiAssetUrl } from '../../../lib/api'
import { EmptySellerNotice } from './common'
import { productStatusOptions } from '../sellerChannel.constants'
import { formatCount, formatCurrency, getProductStatusMeta } from '../sellerChannel.utils'

export function SellerProductsPanel({
  categories,
  productForm,
  productErrors,
  productModalOpen,
  products,
  savingProduct,
  editingProductId,
  workingProductId,
  updateProductField,
  openCreateProductModal,
  handleProductImagesChange,
  removeProductImage,
  addProductOptionGroup,
  updateProductOptionGroup,
  addProductOptionValue,
  removeProductOptionValue,
  removeProductOptionGroup,
  handleProductSubmit,
  handleEditProduct,
  handleToggleProduct,
  handleDeleteProduct,
  resetProductForm,
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-title-sm font-title-sm text-on-surface">Quản lý sản phẩm</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">Thêm sản phẩm bằng modal, danh sách bên dưới vẫn giữ nguyên thao tác hiện có.</p>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-label-md font-label-md text-on-primary shadow-sm hover:bg-primary/90"
            type="button"
            onClick={openCreateProductModal}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Đăng sản phẩm mới
          </button>
        </div>
      </section>

      {productModalOpen ? (
        <ProductEditorModal
          categories={categories}
          editingProductId={editingProductId}
          productErrors={productErrors}
          productForm={productForm}
          savingProduct={savingProduct}
          updateProductField={updateProductField}
          handleProductImagesChange={handleProductImagesChange}
          removeProductImage={removeProductImage}
          addProductOptionGroup={addProductOptionGroup}
          updateProductOptionGroup={updateProductOptionGroup}
          addProductOptionValue={addProductOptionValue}
          removeProductOptionValue={removeProductOptionValue}
          removeProductOptionGroup={removeProductOptionGroup}
          handleProductSubmit={handleProductSubmit}
          resetProductForm={resetProductForm}
        />
      ) : null}

      <div className="rounded-lg border border-outline-variant px-4 py-4">
        <h2 className="text-title-sm font-title-sm text-on-surface">Sản phẩm của cửa hàng</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="h-11 bg-surface-container-low text-label-sm font-label-sm uppercase text-on-surface-variant">
                <th className="px-3">Sản phẩm</th>
                <th className="px-3">Giá</th>
                <th className="px-3">Khối lượng</th>
                <th className="px-3">Kho</th>
                <th className="px-3">Đã bán</th>
                <th className="px-3">Trạng thái</th>
                <th className="px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const working = workingProductId === product.id
                const outOfStock = Number(product.stock || 0) <= 0
                const statusMeta = getProductStatusMeta(product)

                return (
                  <tr key={product.id} className="border-t border-outline-variant text-body-sm">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {product.thumbnailUrl ? (
                          <img
                            className="h-12 w-12 rounded-md object-cover"
                            src={apiAssetUrl(product.thumbnailUrl)}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-container text-primary">
                            <span className="material-symbols-outlined">image</span>
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-label-md font-label-md text-on-surface">{product.name}</p>
                          <p className="text-body-sm text-on-surface-variant">{product.category?.name || 'Chưa phân loại'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-primary">{formatCurrency(product.price)}</td>
                    <td className="px-3 py-3">{product.weightGrams ? `${formatCount(product.weightGrams)} g` : 'Chưa nhập'}</td>
                    <td className="px-3 py-3">{formatCount(product.stock)}</td>
                    <td className="px-3 py-3">{formatCount(product.soldCount)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-md px-2 py-1 text-label-sm font-label-sm ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button className="h-8 rounded-md border border-outline-variant px-3 text-label-sm hover:border-primary hover:text-primary" type="button" onClick={() => handleEditProduct(product)}>
                          Sửa
                        </button>
                        <button
                          className="h-8 rounded-md border border-outline-variant px-3 text-label-sm hover:border-primary hover:text-primary disabled:opacity-50"
                          type="button"
                          onClick={() => handleToggleProduct(product)}
                          disabled={working || (!product.isActive && outOfStock)}
                        >
                          {product.isActive ? 'Đóng' : 'Mở'}
                        </button>
                        <button
                          className="h-8 rounded-md border border-outline-variant px-3 text-label-sm text-error hover:border-error disabled:opacity-50"
                          type="button"
                          onClick={() => handleDeleteProduct(product)}
                          disabled={working}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!products.length ? (
          <div className="mt-4">
            <EmptySellerNotice icon="inventory_2" title="Chưa có sản phẩm" message="Sản phẩm mới đăng sẽ xuất hiện trong danh sách này." />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ProductEditorModal({
  categories,
  editingProductId,
  productErrors,
  productForm,
  savingProduct,
  updateProductField,
  handleProductImagesChange,
  removeProductImage,
  addProductOptionGroup,
  updateProductOptionGroup,
  addProductOptionValue,
  removeProductOptionValue,
  removeProductOptionGroup,
  handleProductSubmit,
  resetProductForm,
}) {
  const primaryStatus = productForm.status === 'hidden' ? 'hidden' : 'active'
  const primaryLabel = productForm.status === 'hidden' ? 'Lưu sản phẩm ẩn' : 'Đăng sản phẩm'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4">
      <form
        className="flex max-h-[calc(100vh-32px)] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-surface-container-lowest shadow-2xl"
        onSubmit={(event) => handleProductSubmit(event, primaryStatus)}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant px-4 py-3 md:px-5">
          <h2 className="text-title-sm font-title-sm text-on-surface">
            {editingProductId ? 'Chỉnh sửa sản phẩm' : 'Đăng sản phẩm mới'}
          </h2>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            type="button"
            onClick={resetProductForm}
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[21px]">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-body-sm text-on-surface-variant">Tên sản phẩm</span>
              <input
                className={`h-10 rounded-lg bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary ${productErrors.name ? 'border-error' : 'border-outline-variant'}`}
                value={productForm.name}
                onChange={(event) => updateProductField('name', event.target.value)}
                disabled={savingProduct}
              />
              {productErrors.name ? <span className="text-body-sm text-error">{productErrors.name}</span> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-body-sm text-on-surface-variant">Danh mục sản phẩm</span>
              <select
                className={`h-10 rounded-lg bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary ${productErrors.categoryId ? 'border-error' : 'border-outline-variant'}`}
                value={productForm.categoryId}
                onChange={(event) => updateProductField('categoryId', event.target.value)}
                disabled={savingProduct}
              >
                <option value="">Chưa chọn</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {productErrors.categoryId ? <span className="text-body-sm text-error">{productErrors.categoryId}</span> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-body-sm text-on-surface-variant">Giá sản phẩm</span>
              <input
                className={`h-10 rounded-lg bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary ${productErrors.price ? 'border-error' : 'border-outline-variant'}`}
                type="number"
                min="0"
                step="1000"
                value={productForm.price}
                onChange={(event) => updateProductField('price', event.target.value)}
                disabled={savingProduct}
              />
              {productErrors.price ? <span className="text-body-sm text-error">{productErrors.price}</span> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-body-sm text-on-surface-variant">Số lượng tồn kho</span>
              <input
                className={`h-10 rounded-lg bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary ${productErrors.stock ? 'border-error' : 'border-outline-variant'}`}
                type="number"
                min="0"
                step="1"
                value={productForm.stock}
                onChange={(event) => updateProductField('stock', event.target.value)}
                disabled={savingProduct}
              />
              {productErrors.stock ? <span className="text-body-sm text-error">{productErrors.stock}</span> : null}
            </label>

            <label className="grid gap-2">
              <span className="text-body-sm text-on-surface-variant">Khối lượng sản phẩm (gram)</span>
              <input
                className={`h-10 rounded-lg bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary ${productErrors.weightGrams ? 'border-error' : 'border-outline-variant'}`}
                type="number"
                min="1"
                step="1"
                value={productForm.weightGrams}
                onChange={(event) => updateProductField('weightGrams', event.target.value)}
                disabled={savingProduct}
                required
              />
              {productErrors.weightGrams ? <span className="text-body-sm text-error">{productErrors.weightGrams}</span> : null}
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-body-sm text-on-surface-variant">Trạng thái sản phẩm</span>
              <select
                className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                value={productForm.status}
                onChange={(event) => updateProductField('status', event.target.value)}
                disabled={savingProduct}
              >
                {productStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-body-sm text-on-surface-variant">Ảnh sản phẩm</span>
              <input
                className="block w-full rounded-lg border border-outline-variant bg-surface-container-low text-body-sm text-on-surface file:mr-4 file:h-10 file:border-0 file:bg-primary file:px-4 file:text-label-md file:font-label-md file:text-on-primary hover:file:bg-primary/90"
                type="file"
                accept="image/png,image/jpeg"
                multiple
                onChange={handleProductImagesChange}
                disabled={savingProduct}
              />
            </label>

            {productForm.images.length ? (
              <div className="grid gap-3 sm:grid-cols-3 md:col-span-2 lg:grid-cols-4">
                {productForm.images.map((image) => {
                  const previewUrl = image.dataUrl || apiAssetUrl(image.url)
                  return (
                    <div key={image.id} className="relative overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
                      <img className="aspect-square w-full object-cover" src={previewUrl} alt={image.name || 'Ảnh sản phẩm'} />
                      <button
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest/90 text-error shadow-sm hover:bg-error hover:text-on-error"
                        type="button"
                        onClick={() => removeProductImage(image.id)}
                        disabled={savingProduct}
                        aria-label="Xóa ảnh"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                      <p className="truncate px-2 py-2 text-body-sm text-on-surface-variant">{image.name}</p>
                    </div>
                  )
                })}
              </div>
            ) : null}

            <label className="grid gap-2 md:col-span-2">
              <span className="text-body-sm text-on-surface-variant">Mô tả sản phẩm</span>
              <textarea
                className="min-h-28 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                value={productForm.description}
                onChange={(event) => updateProductField('description', event.target.value)}
                disabled={savingProduct}
              />
            </label>
          </div>

          <section className="mt-5 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-title-sm font-title-sm text-on-surface">Danh mục và phân loại sản phẩm</h3>
              <button
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-outline-variant px-3 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary"
                type="button"
                onClick={addProductOptionGroup}
                disabled={savingProduct}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Thêm nhóm
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {productForm.productOptions.map((option, groupIndex) => (
                <div key={`option-${groupIndex}`} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-3">
                  <div className="flex flex-wrap items-start gap-3">
                    <label className="grid min-w-[180px] flex-1 gap-2">
                      <span className="text-body-sm text-on-surface-variant">Tên nhóm</span>
                      <input
                        className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                        value={option.name}
                        onChange={(event) => updateProductOptionGroup(groupIndex, 'name', event.target.value)}
                        placeholder="Size, Màu sắc, Dung lượng"
                        disabled={savingProduct}
                      />
                    </label>

                    <label className="grid min-w-[220px] flex-1 gap-2">
                      <span className="text-body-sm text-on-surface-variant">Giá trị</span>
                      <div className="flex gap-2">
                        <input
                          className="h-10 min-w-0 flex-1 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                          value={option.draftValue || ''}
                          onChange={(event) => updateProductOptionGroup(groupIndex, 'draftValue', event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              addProductOptionValue(groupIndex)
                            }
                          }}
                          placeholder="S, M, L..."
                          disabled={savingProduct}
                        />
                        <button
                          className="h-10 rounded-lg bg-primary px-3 text-label-md font-label-md text-on-primary hover:bg-primary/90 disabled:opacity-60"
                          type="button"
                          onClick={() => addProductOptionValue(groupIndex)}
                          disabled={savingProduct}
                        >
                          Thêm
                        </button>
                      </div>
                    </label>

                    <button
                      className="mt-7 flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant text-error hover:border-error"
                      type="button"
                      onClick={() => removeProductOptionGroup(groupIndex)}
                      disabled={savingProduct}
                      aria-label="Xóa nhóm phân loại"
                    >
                      <span className="material-symbols-outlined text-[19px]">delete</span>
                    </button>
                  </div>

                  {option.values.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {option.values.map((value, valueIndex) => (
                        <span key={`${value}-${valueIndex}`} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-primary/10 px-3 text-label-md font-label-md text-primary">
                          {value}
                          <button
                            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/10"
                            type="button"
                            onClick={() => removeProductOptionValue(groupIndex, valueIndex)}
                            disabled={savingProduct}
                            aria-label="Xóa giá trị"
                          >
                            <span className="material-symbols-outlined text-[15px]">close</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {!productForm.productOptions.length ? (
                <div className="rounded-lg border border-dashed border-outline-variant px-4 py-5 text-center text-body-sm text-on-surface-variant">
                  Chưa có phân loại sản phẩm.
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-outline-variant px-4 py-3 md:px-5">
          <button
            className="h-10 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary"
            type="button"
            onClick={resetProductForm}
            disabled={savingProduct}
          >
            Hủy
          </button>
          <button
            className="h-10 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary disabled:opacity-60"
            type="button"
            onClick={(event) => handleProductSubmit(event, 'draft')}
            disabled={savingProduct}
          >
            {savingProduct ? 'Đang lưu...' : 'Lưu nháp'}
          </button>
          <button
            className="h-10 rounded-lg bg-primary px-5 text-label-md font-label-md text-on-primary hover:bg-primary/90 disabled:opacity-60"
            type="submit"
            disabled={savingProduct}
          >
            {savingProduct ? 'Đang lưu...' : primaryLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
