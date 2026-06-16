import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import AccountLayout from './AccountLayout'
import ShopMessagesPanel from '../../components/ShopMessagesPanel/ShopMessagesPanel'
import {
  createSellerProduct,
  deleteSellerProduct,
  getAccountLocations,
  getAccountProfile,
  getAdminSellerApplications,
  getSellerFlashSales,
  getSellerDashboard,
  getSellerRegistration,
  getSellerVouchers,
  reviewSellerApplication,
  submitSellerRegistration,
  updateSellerOrder,
  updateSellerProduct,
  updateSellerProductStatus,
  updateSellerShop,
} from '../../lib/account'
import { apiGet } from '../../lib/api'
import { setAuthToken } from '../../lib/auth'
import { defaultRevenueFilter, revenueFilterParams } from '../../lib/revenueFilters'
import {
  allowedProductImageTypes,
  allowedShopImageTypes,
  emptySellerItems,
  emptyShopForm,
  maxProductImageSize,
  maxShopImageSize,
} from './sellerChannel.constants'
import {
  createEmptyProductForm,
  normalizeProductOptionValues,
  toProductForm,
  toShopForm,
} from './sellerChannel.utils'
import {
  AdminApplicationsPanel,
  SellerCenterShell,
  SellerFlashSalesPanel,
  SellerOrdersPanel,
  SellerOverview,
  SellerProductsPanel,
  SellerVouchersPanel,
  SellerRegistrationPanel,
  SellerReportsPanel,
  SellerShopProfilePanel,
  StatusBadge,
} from './SellerChannelSections'

export default function SellerChannelPage({ standalone = false }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [sellerData, setSellerData] = useState({ application: null, shop: null })
  const [sellerDashboard, setSellerDashboard] = useState({ shop: null, stats: {}, revenueTrend: [], products: [], orders: [] })
  const [sellerFlashSales, setSellerFlashSales] = useState({ events: [], registrations: [] })
  const [sellerVouchers, setSellerVouchers] = useState({ stats: {}, items: [] })
  const [revenueFilter, setRevenueFilter] = useState(defaultRevenueFilter)
  const [shopForm, setShopForm] = useState(emptyShopForm)
  const [sellerSaving, setSellerSaving] = useState(false)
  const [savingShopProfile, setSavingShopProfile] = useState(false)
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [productForm, setProductForm] = useState(() => createEmptyProductForm())
  const [productErrors, setProductErrors] = useState({})
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [activeSellerTab, setActiveSellerTab] = useState('overview')
  const [workingProductId, setWorkingProductId] = useState(null)
  const [workingOrderId, setWorkingOrderId] = useState(null)
  const [adminApplications, setAdminApplications] = useState([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminReviewingId, setAdminReviewingId] = useState(null)
  const [rejectReasons, setRejectReasons] = useState({})

  const products = sellerDashboard.products || emptySellerItems
  const orders = sellerDashboard.orders || emptySellerItems
  const stats = sellerDashboard.stats || {}
  const shop = sellerDashboard.shop || sellerData.shop
  const application = sellerData.application
  const canManageSellerChannel = profile?.role === 'seller' && shop
  const canSubmitShopApplication = !application || application.status === 'rejected'
  const orderStatusCounts = useMemo(() => {
    return orders.reduce((result, order) => {
      result[order.status] = (result[order.status] || 0) + 1
      return result
    }, {})
  }, [orders])

  useEffect(() => {
    let active = true

    async function loadSellerPage() {
      try {
        const profileData = await getAccountProfile()
        if (!active) return

        setProfile(profileData)
        setLoadError('')

        const [sellerResponse, categoriesResponse, locationsResponse] = await Promise.all([
          getSellerRegistration(),
          apiGet('/api/categories'),
          getAccountLocations(),
        ])
        let dashboardData = null
        let adminData = []

        if (sellerResponse.data?.shop) {
          dashboardData = await getSellerDashboard(revenueFilterParams(defaultRevenueFilter))
          const [flashSalesData, vouchersData] = await Promise.all([
            getSellerFlashSales(),
            getSellerVouchers(),
          ])
          if (!active) return
          setSellerFlashSales(flashSalesData)
          setSellerVouchers(vouchersData)
        }

        if (profileData?.role === 'admin') {
          adminData = await getAdminSellerApplications('pending')
        }

        if (!active) return

        if (sellerResponse.token) setAuthToken(sellerResponse.token)
        setCategories(categoriesResponse.data || [])
        setLocations(locationsResponse || [])
        setSellerData({
          application: sellerResponse.data?.application || null,
          shop: dashboardData?.shop || sellerResponse.data?.shop || null,
        })
        if (dashboardData) setSellerDashboard(dashboardData)
        setShopForm(toShopForm(profileData, sellerResponse.data?.application, dashboardData?.shop || sellerResponse.data?.shop))
        setAdminApplications(adminData)
      } catch (err) {
        if (active) setLoadError(err.message || 'Không tải được kênh bán hàng')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSellerPage()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!standalone && !loading && !loadError && canManageSellerChannel) {
      navigate('/seller/dashboard', { replace: true })
    }
  }, [standalone, loading, loadError, canManageSellerChannel, navigate])

  useEffect(() => {
    if (!productModalOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [productModalOpen])

  function updateShopField(field, value) {
    setShopForm((current) => ({ ...current, [field]: value }))
  }

  function handleShopImageChange(field, event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!allowedShopImageTypes.has(file.type)) {
      toast.error('Chỉ hỗ trợ ảnh JPEG hoặc PNG')
      event.target.value = ''
      return
    }

    if (file.size > maxShopImageSize) {
      toast.error('Dung lượng ảnh tối đa 10MB')
      event.target.value = ''
      return
    }

    const fileNameField = field === 'avatarDataUrl' ? 'avatarFileName' : 'coverFileName'
    const reader = new FileReader()
    reader.onload = () => {
      setShopForm((current) => ({
        ...current,
        [field]: String(reader.result || ''),
        [fileNameField]: file.name,
      }))
    }
    reader.onerror = () => toast.error('Không đọc được ảnh đã chọn')
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function updateProductField(field, value) {
    setProductForm((current) => ({ ...current, [field]: value }))
    setProductErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleProductImagesChange(event) {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const validFiles = []
    for (const file of files) {
      if (!allowedProductImageTypes.has(file.type)) {
        toast.error(`Ảnh ${file.name} không đúng định dạng JPEG/PNG`)
        continue
      }

      if (file.size > maxProductImageSize) {
        toast.error(`Ảnh ${file.name} vượt quá 10MB`)
        continue
      }

      validFiles.push(file)
    }

    try {
      const nextImages = await Promise.all(
        validFiles.map(async (file) => ({
          id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          dataUrl: await readImageFile(file),
          existing: false,
        })),
      )

      if (nextImages.length) {
        setProductForm((current) => ({
          ...current,
          images: [...current.images, ...nextImages],
        }))
      }
    } catch {
      toast.error('Không đọc được ảnh sản phẩm đã chọn')
    } finally {
      event.target.value = ''
    }
  }

  function removeProductImage(imageId) {
    setProductForm((current) => ({
      ...current,
      images: current.images.filter((image) => image.id !== imageId),
    }))
  }

  function addProductOptionGroup() {
    setProductForm((current) => ({
      ...current,
      productOptions: [...current.productOptions, { name: '', values: [], draftValue: '' }],
    }))
  }

  function updateProductOptionGroup(index, field, value) {
    setProductForm((current) => ({
      ...current,
      productOptions: current.productOptions.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option,
      ),
    }))
  }

  function addProductOptionValue(index) {
    setProductForm((current) => ({
      ...current,
      productOptions: current.productOptions.map((option, optionIndex) => {
        if (optionIndex !== index) return option

        const draftValue = String(option.draftValue || '').trim()
        if (!draftValue) return option
        return { ...option, values: normalizeProductOptionValues([...option.values, draftValue]), draftValue: '' }
      }),
    }))
  }

  function removeProductOptionValue(groupIndex, valueIndex) {
    setProductForm((current) => ({
      ...current,
      productOptions: current.productOptions.map((option, optionIndex) =>
        optionIndex === groupIndex
          ? { ...option, values: option.values.filter((_, index) => index !== valueIndex) }
          : option,
      ),
    }))
  }

  function removeProductOptionGroup(index) {
    setProductForm((current) => ({
      ...current,
      productOptions: current.productOptions.filter((_, optionIndex) => optionIndex !== index),
    }))
  }

  function normalizeProductOptions(options) {
    return options
      .map((option) => ({
        name: String(option.name || '').trim(),
        values: normalizeProductOptionValues(option.values),
      }))
      .filter((option) => option.name && option.values.length)
  }

  function validateProductForm(submitStatus) {
    const errors = {}
    const price = Number(productForm.price)
    const stock = Number(productForm.stock)
    const weightGrams = Number(productForm.weightGrams)

    if (!String(productForm.name || '').trim()) errors.name = 'Vui lòng nhập tên sản phẩm'
    if (productForm.price === '' || !Number.isFinite(price) || price < 0) errors.price = 'Giá sản phẩm phải lớn hơn hoặc bằng 0'
    if (productForm.stock === '' || !Number.isFinite(stock) || stock < 0) errors.stock = 'Số lượng tồn kho phải lớn hơn hoặc bằng 0'
    if (productForm.weightGrams === '' || !Number.isFinite(weightGrams) || weightGrams <= 0) {
      errors.weightGrams = 'Vui lòng nhập khối lượng sản phẩm theo gram'
    }
    if (submitStatus === 'active' && !productForm.categoryId) errors.categoryId = 'Vui lòng chọn danh mục khi đăng sản phẩm'

    return errors
  }

  function buildProductPayload(submitStatus) {
    const images = productForm.images || []
    const existingImages = images.filter((image) => image.existing && image.url).map((image) => image.url)
    const imageDataUrls = images.filter((image) => !image.existing && image.dataUrl).map((image) => image.dataUrl)
    const thumbnailUrl = existingImages[0] || productForm.thumbnailUrl || ''

    return {
      name: productForm.name,
      categoryId: productForm.categoryId,
      description: productForm.description,
      price: productForm.price,
      originalPrice: productForm.originalPrice,
      stock: productForm.stock,
      weightGrams: productForm.weightGrams,
      thumbnailUrl,
      status: submitStatus,
      isActive: submitStatus === 'active',
      images: existingImages,
      imageDataUrls,
      productOptions: normalizeProductOptions(productForm.productOptions),
    }
  }

  function openCreateProductModal() {
    setEditingProductId(null)
    setProductForm(createEmptyProductForm())
    setProductErrors({})
    setProductModalOpen(true)
  }

  function applySellerDashboard(data) {
    setSellerDashboard(data)
    setSellerData((current) => ({ ...current, shop: data.shop || current.shop }))
  }

  async function refreshSellerDashboard() {
    const data = await getSellerDashboard(revenueFilterParams(revenueFilter))
    applySellerDashboard(data)
  }

  async function refreshSellerFlashSales() {
    const data = await getSellerFlashSales()
    setSellerFlashSales(data)
  }

  async function refreshSellerVouchers() {
    const data = await getSellerVouchers()
    setSellerVouchers(data)
  }

  async function handleRevenueFilterChange(nextFilter, options = {}) {
    setRevenueFilter(nextFilter)
    if (options.deferLoad) return

    try {
      const data = await getSellerDashboard(revenueFilterParams(nextFilter))
      applySellerDashboard(data)
    } catch (err) {
      toast.error(err.message || 'Khong tai duoc doanh thu theo khoang ngay')
    }
  }

  function resetProductForm() {
    setEditingProductId(null)
    setProductForm(createEmptyProductForm())
    setProductErrors({})
    setProductModalOpen(false)
  }

  async function handleShopSubmit(event) {
    event.preventDefault()
    setSellerSaving(true)

    try {
      const response = await submitSellerRegistration(shopForm)
      const nextData = response.data || { application: null, shop: null }
      setSellerData(nextData)
      setShopForm(toShopForm(profile, nextData.application, nextData.shop))
      setLoadError('')
      toast.success(response.message || 'Đã gửi đơn đăng ký cửa hàng.')
    } catch (err) {
      toast.error(err.message || 'Gửi đăng ký cửa hàng thất bại')
    } finally {
      setSellerSaving(false)
    }
  }

  async function handleShopProfileSubmit(event) {
    event.preventDefault()
    setSavingShopProfile(true)

    try {
      const avatarDataUrl = shopForm.avatarDataUrl
      const coverDataUrl = shopForm.coverDataUrl
      const shopPayload = { ...shopForm }
      delete shopPayload.avatarDataUrl
      delete shopPayload.avatarFileName
      delete shopPayload.coverDataUrl
      delete shopPayload.coverFileName

      const data = await updateSellerShop({
        ...shopPayload,
        ...(avatarDataUrl ? { avatarDataUrl } : {}),
        ...(coverDataUrl ? { coverDataUrl } : {}),
      })
      applySellerDashboard(data)
      setShopForm(toShopForm(profile, application, data.shop))
      toast.success('Đã cập nhật hồ sơ cửa hàng.')
    } catch (err) {
      toast.error(err.message || 'Cập nhật hồ sơ cửa hàng thất bại')
    } finally {
      setSavingShopProfile(false)
    }
  }

  async function handleProductSubmit(event, submitStatus = productForm.status) {
    event.preventDefault()
    const errors = validateProductForm(submitStatus)
    setProductErrors(errors)
    if (Object.keys(errors).length) return

    setSavingProduct(true)

    try {
      const payload = buildProductPayload(submitStatus)
      if (editingProductId) {
        const data = await updateSellerProduct(editingProductId, payload)
        applySellerDashboard(data)
        toast.success('Đã cập nhật sản phẩm.')
      } else {
        await createSellerProduct(payload)
        await refreshSellerDashboard()
        toast.success(submitStatus === 'draft' ? 'Đã lưu nháp sản phẩm.' : 'Đã đăng sản phẩm mới.')
      }

      resetProductForm()
      setActiveSellerTab('products')
    } catch (err) {
      toast.error(err.message || 'Lưu sản phẩm thất bại')
    } finally {
      setSavingProduct(false)
    }
  }

  function handleEditProduct(product) {
    setEditingProductId(product.id)
    setProductForm(toProductForm(product))
    setProductErrors({})
    setProductModalOpen(true)
    setActiveSellerTab('products')
  }

  async function handleToggleProduct(product) {
    setWorkingProductId(product.id)

    try {
      const data = await updateSellerProductStatus(product.id, { isActive: !product.isActive })
      applySellerDashboard(data)
      toast.success(product.isActive ? 'Đã đóng sản phẩm.' : 'Đã mở bán sản phẩm.')
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được trạng thái sản phẩm')
    } finally {
      setWorkingProductId(null)
    }
  }

  async function handleDeleteProduct(product) {
    if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?`)) return

    setWorkingProductId(product.id)

    try {
      const data = await deleteSellerProduct(product.id)
      applySellerDashboard(data)
      toast.success('Đã xử lý sản phẩm.')
      if (editingProductId === product.id) resetProductForm()
    } catch (err) {
      toast.error(err.message || 'Không xóa được sản phẩm')
    } finally {
      setWorkingProductId(null)
    }
  }

  async function handleOrderStatus(order, status) {
    if (order.status === 'delivered' && status !== 'delivered') {
      toast.error('Đơn hàng đã giao không thể thay đổi trạng thái.')
      return
    }

    setWorkingOrderId(order.id)

    try {
      const data = await updateSellerOrder(order.id, { status })
      applySellerDashboard(data)
      toast.success('Đã cập nhật đơn hàng.')
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được đơn hàng')
    } finally {
      setWorkingOrderId(null)
    }
  }

  async function loadAdminApplications() {
    setAdminLoading(true)

    try {
      const data = await getAdminSellerApplications('pending')
      setAdminApplications(data)
    } catch (err) {
      toast.error(err.message || 'Không tải được đơn đăng ký cửa hàng')
    } finally {
      setAdminLoading(false)
    }
  }

  async function handleApplicationReview(item, action) {
    const rejectReason = rejectReasons[item.id] || ''
    setAdminReviewingId(item.id)

    try {
      const data = await reviewSellerApplication(item.id, {
        action,
        rejectReason,
      })
      setAdminApplications(data)
      setRejectReasons((current) => ({ ...current, [item.id]: '' }))
      toast.success(action === 'approve' ? 'Đã duyệt cửa hàng.' : 'Đã từ chối đơn đăng ký.')
    } catch (err) {
      toast.error(err.message || 'Xử lý đơn đăng ký thất bại')
    } finally {
      setAdminReviewingId(null)
    }
  }

  const pageContent = (
      <section className="rounded-lg bg-surface-container-lowest px-6 py-6 shadow-sm md:px-8">
        <div className="border-b border-outline-variant pb-4">
          <h1 className="text-title-md font-title-md text-on-surface">Kênh bán hàng</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Đăng ký cửa hàng, vận hành sản phẩm, đơn hàng và báo cáo bán hàng trên ShopBee.
          </p>
        </div>

        {loading ? (
          <div className="mt-5 rounded-lg bg-surface-container px-4 py-4 text-body-sm text-on-surface-variant">
            Đang tải kênh bán hàng...
          </div>
        ) : null}

        {loadError ? (
          <div className="mt-5 rounded-lg bg-error-container px-4 py-4 text-body-sm text-on-error-container">
            {loadError}
          </div>
        ) : null}

        {!loading && !loadError && profile?.role === 'admin' ? (
          <AdminApplicationsPanel
            adminApplications={adminApplications}
            adminLoading={adminLoading}
            adminReviewingId={adminReviewingId}
            rejectReasons={rejectReasons}
            setRejectReasons={setRejectReasons}
            loadAdminApplications={loadAdminApplications}
            handleApplicationReview={handleApplicationReview}
          />
        ) : null}

        {!loading && !loadError && canManageSellerChannel ? (
          <div className="mt-5 space-y-6">
            <div className="rounded-lg border border-outline-variant px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-title-sm font-title-sm text-on-surface">{shop.name}</h2>
                    <StatusBadge status="approved" />
                  </div>
                  <p className="mt-1 text-body-sm text-on-surface-variant">{shop.addressLine1 || shop.province}</p>
                </div>
                <button
                  className="h-10 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary"
                  type="button"
                  onClick={refreshSellerDashboard}
                >
                  Tải lại dữ liệu
                </button>
              </div>
            </div>

            {activeSellerTab === 'overview' ? (
              <SellerOverview
                stats={stats}
                orders={orders}
                products={products}
                revenueTrend={sellerDashboard.revenueTrend}
                revenueRange={sellerDashboard.revenueRange}
                revenueFilter={revenueFilter}
                onRevenueFilterChange={handleRevenueFilterChange}
              />
            ) : null}

            {activeSellerTab === 'profile' ? (
              <SellerShopProfilePanel
                shopForm={shopForm}
                savingShopProfile={savingShopProfile}
                updateShopField={updateShopField}
                handleShopImageChange={handleShopImageChange}
                handleShopProfileSubmit={handleShopProfileSubmit}
                locations={locations}
              />
            ) : null}

            {activeSellerTab === 'products' ? (
              <SellerProductsPanel
                categories={categories}
                productForm={productForm}
                productErrors={productErrors}
                productModalOpen={productModalOpen}
                products={products}
                savingProduct={savingProduct}
                editingProductId={editingProductId}
                workingProductId={workingProductId}
                updateProductField={updateProductField}
                openCreateProductModal={openCreateProductModal}
                handleProductImagesChange={handleProductImagesChange}
                removeProductImage={removeProductImage}
                addProductOptionGroup={addProductOptionGroup}
                updateProductOptionGroup={updateProductOptionGroup}
                addProductOptionValue={addProductOptionValue}
                removeProductOptionValue={removeProductOptionValue}
                removeProductOptionGroup={removeProductOptionGroup}
                handleProductSubmit={handleProductSubmit}
                handleEditProduct={handleEditProduct}
                handleToggleProduct={handleToggleProduct}
                handleDeleteProduct={handleDeleteProduct}
                resetProductForm={resetProductForm}
              />
            ) : null}

            {activeSellerTab === 'flash-sales' ? (
              <SellerFlashSalesPanel
                events={sellerFlashSales.events}
                registrations={sellerFlashSales.registrations}
                products={products}
                onRegistered={refreshSellerFlashSales}
              />
            ) : null}

            {activeSellerTab === 'vouchers' ? (
              <SellerVouchersPanel
                vouchersData={sellerVouchers}
                onVouchersDataChange={setSellerVouchers}
                onRefresh={refreshSellerVouchers}
              />
            ) : null}

            {activeSellerTab === 'orders' ? (
              <SellerOrdersPanel orders={orders} workingOrderId={workingOrderId} handleOrderStatus={handleOrderStatus} />
            ) : null}

            {activeSellerTab === 'messages' ? (
              <ShopMessagesPanel mode="seller" className="shadow-none" />
            ) : null}

            {activeSellerTab === 'reports' ? (
              <SellerReportsPanel
                stats={stats}
                orders={orders}
                revenueTrend={sellerDashboard.revenueTrend}
                revenueRange={sellerDashboard.revenueRange}
                revenueFilter={revenueFilter}
                orderStatusCounts={orderStatusCounts}
                onRevenueFilterChange={handleRevenueFilterChange}
              />
            ) : null}
          </div>
        ) : null}

        {!loading && !loadError && profile?.role !== 'admin' && !canManageSellerChannel ? (
          <SellerRegistrationPanel
            application={application}
            canSubmitShopApplication={canSubmitShopApplication}
            shopForm={shopForm}
            sellerSaving={sellerSaving}
            updateShopField={updateShopField}
            handleShopSubmit={handleShopSubmit}
            locations={locations}
          />
        ) : null}
      </section>
  )

  if (standalone) {
    return (
      <SellerCenterShell profile={profile} shop={shop} activeTab={activeSellerTab} onTabChange={setActiveSellerTab}>
        {pageContent}
      </SellerCenterShell>
    )
  }

  return <AccountLayout>{pageContent}</AccountLayout>
}
