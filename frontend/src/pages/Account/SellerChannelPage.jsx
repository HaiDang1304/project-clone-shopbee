import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import AccountLayout from './AccountLayout'
import {
  createSellerProduct,
  deleteSellerProduct,
  getAccountProfile,
  getAdminSellerApplications,
  getSellerDashboard,
  getSellerRegistration,
  reviewSellerApplication,
  submitSellerRegistration,
  updateSellerOrder,
  updateSellerProduct,
  updateSellerProductStatus,
  updateSellerShop,
} from '../../lib/account'
import { apiAssetUrl, apiGet } from '../../lib/api'
import { setAuthToken } from '../../lib/auth'

const emptyShopForm = {
  shopName: '',
  contactPhone: '',
  contactEmail: '',
  avatarUrl: '',
  avatarDataUrl: '',
  avatarFileName: '',
  coverUrl: '',
  coverDataUrl: '',
  coverFileName: '',
  description: '',
  addressLine1: '',
  ward: '',
  district: '',
  province: '',
  country: 'VN',
}

const maxShopImageSize = 10 * 1024 * 1024
const allowedShopImageTypes = new Set(['image/jpeg', 'image/png'])
const emptySellerItems = []

const maxProductImageSize = 10 * 1024 * 1024
const allowedProductImageTypes = new Set(['image/jpeg', 'image/png'])

function createEmptyProductForm() {
  return {
    name: '',
    categoryId: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '0',
    thumbnailUrl: '',
    status: 'active',
    isActive: true,
    images: [],
    productOptions: [],
  }
}

const productStatusOptions = [
  { value: 'draft', label: 'Nháp' },
  { value: 'active', label: 'Đang bán' },
  { value: 'hidden', label: 'Ẩn' },
]

const productStatusMeta = {
  draft: { label: 'Nháp', className: 'bg-tertiary/10 text-tertiary' },
  active: { label: 'Đang bán', className: 'bg-primary/10 text-primary' },
  hidden: { label: 'Ẩn', className: 'bg-error-container text-on-error-container' },
  outOfStock: { label: 'Hết hàng', className: 'bg-error-container text-on-error-container' },
}

const applicationStatuses = {
  pending: {
    label: 'Chờ admin duyệt',
    className: 'border-tertiary bg-tertiary/10 text-tertiary',
  },
  approved: {
    label: 'Đã duyệt',
    className: 'border-primary bg-primary/10 text-primary',
  },
  rejected: {
    label: 'Bị từ chối',
    className: 'border-error bg-error-container text-on-error-container',
  },
}

const orderStatusLabels = {
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
}

const orderStatusOptions = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
]

const sellerTabs = [
  { value: 'overview', icon: 'dashboard', label: 'Tổng quan' },
  { value: 'profile', icon: 'storefront', label: 'Hồ sơ cửa hàng' },
  { value: 'products', icon: 'inventory_2', label: 'Sản phẩm' },
  { value: 'orders', icon: 'receipt_long', label: 'Đơn hàng' },
  { value: 'reports', icon: 'bar_chart', label: 'Báo cáo' },
]

function toShopForm(profile, application, shop) {
  return {
    shopName: shop?.name || application?.shopName || '',
    contactPhone: shop?.contactPhone || application?.contactPhone || profile?.phone || '',
    contactEmail: shop?.contactEmail || application?.contactEmail || profile?.email || '',
    avatarUrl: shop?.avatarUrl || '',
    avatarDataUrl: '',
    avatarFileName: '',
    coverUrl: shop?.coverUrl || '',
    coverDataUrl: '',
    coverFileName: '',
    description: shop?.description || application?.description || '',
    addressLine1: shop?.addressLine1 || application?.addressLine1 || '',
    ward: shop?.ward || application?.ward || '',
    district: shop?.district || application?.district || '',
    province: shop?.province || application?.province || '',
    country: shop?.country || application?.country || 'VN',
  }
}

function toProductForm(product) {
  if (!product) return createEmptyProductForm()

  const images = Array.isArray(product.images) && product.images.length
    ? product.images.map((image, index) => {
        const url = typeof image === 'string' ? image : image.url || image.imageUrl || ''
        return {
          id: `existing-${product.id}-${index}`,
          name: `Ảnh ${index + 1}`,
          url,
          existing: true,
        }
      }).filter((image) => image.url)
    : product.thumbnailUrl
      ? [{ id: `existing-${product.id}-thumbnail`, name: 'Ảnh đại diện', url: product.thumbnailUrl, existing: true }]
      : []

  return {
    name: product.name || '',
    categoryId: product.category?.id ? String(product.category.id) : '',
    description: product.description || '',
    price: product.price === undefined ? '' : String(product.price),
    originalPrice: product.originalPrice === undefined || product.originalPrice === null ? '' : String(product.originalPrice),
    stock: product.stock === undefined ? '0' : String(product.stock),
    thumbnailUrl: product.thumbnailUrl || '',
    status: product.status || (product.isActive ? 'active' : 'hidden'),
    isActive: Boolean(product.isActive),
    images,
    productOptions: Array.isArray(product.productOptions)
      ? product.productOptions.map((option) => ({
          name: option.name || '',
          values: normalizeProductOptionValues(option.values),
          draftValue: '',
        }))
      : [],
  }
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatCount(value) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0))
}

function getProductStatusMeta(product) {
  if (Number(product.stock || 0) <= 0 && product.status === 'active') return productStatusMeta.outOfStock
  return productStatusMeta[product.status || (product.isActive ? 'active' : 'hidden')] || productStatusMeta.hidden
}

function normalizeProductOptionValues(values) {
  const source = Array.isArray(values) ? values : [values]
  const seen = new Set()
  const result = []

  source
    .flatMap((value) => String(value || '').split(/[,;\n]+/))
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      result.push(value)
    })

  return result
}

function StatusBadge({ status }) {
  const item = applicationStatuses[status] || applicationStatuses.pending

  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-label-md font-label-md ${item.className}`}>
      {item.label}
    </span>
  )
}

function EmptySellerNotice({ icon, title, message }) {
  return (
    <div className="rounded-lg border border-dashed border-outline-variant px-6 py-8 text-center">
      <span className="material-symbols-outlined text-[36px] text-primary">{icon}</span>
      <p className="mt-3 text-title-sm font-title-sm text-on-surface">{title}</p>
      <p className="mt-1 text-body-sm text-on-surface-variant">{message}</p>
    </div>
  )
}

function MetricCard({ icon, label, value, note }) {
  return (
    <article className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-container text-primary">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
        <span className="rounded-full bg-surface-container px-2 py-1 text-[11px] font-semibold text-on-surface-variant">
          {note}
        </span>
      </div>
      <p className="mt-4 text-body-sm text-on-surface-variant">{label}</p>
      <p className="mt-1 text-title-md font-title-md text-on-surface">{value}</p>
    </article>
  )
}

function RevenueChart({ trend }) {
  const points = trend?.length ? trend : []
  const totalRevenue = points.reduce((sum, point) => sum + Number(point.value || 0), 0)
  const maxValue = Math.max(1, ...points.map((point) => Number(point.value || 0)))
  const hasRevenue = totalRevenue > 0
  const averageRevenue = points.length ? totalRevenue / points.length : 0

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-title-sm font-title-sm text-on-surface">Doanh thu 7 ngày</h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">Theo đơn không hủy</p>
        </div>
        <div className="rounded-lg bg-primary-container px-3 py-2 text-right text-on-primary-container">
          <p className="text-[11px] font-semibold">Tổng 7 ngày</p>
          <p className="mt-0.5 text-title-sm font-title-sm">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="mt-4 flex h-[132px] items-end gap-3 rounded-lg bg-surface-container px-3 pb-3 pt-4">
        {points.map((point) => {
          const value = Number(point.value || 0)
          const barHeight = hasRevenue ? Math.max(8, Math.round((value / maxValue) * 100)) : 4

          return (
            <div key={`${point.date || point.day}-${value}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="flex h-[96px] w-full items-end">
                <div
                  className={`mx-auto w-full max-w-[32px] rounded-t-md transition-all ${
                    value > 0 ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                  style={{ height: `${barHeight}%` }}
                  title={`${point.day}: ${formatCurrency(value)}`}
                />
              </div>
              <span className="h-4 text-[10px] font-semibold text-on-surface-variant">{point.day}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-body-sm text-on-surface-variant">
        <span>Trung bình/ngày: {formatCurrency(averageRevenue)}</span>
        {!hasRevenue ? (
          <span className="inline-flex items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Chưa có doanh thu trong 7 ngày gần đây
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default function SellerChannelPage({ standalone = false }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [sellerData, setSellerData] = useState({ application: null, shop: null })
  const [sellerDashboard, setSellerDashboard] = useState({ shop: null, stats: {}, revenueTrend: [], products: [], orders: [] })
  const [shopForm, setShopForm] = useState(emptyShopForm)
  const [sellerSaving, setSellerSaving] = useState(false)
  const [savingShopProfile, setSavingShopProfile] = useState(false)
  const [categories, setCategories] = useState([])
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

        const [sellerResponse, categoriesResponse] = await Promise.all([getSellerRegistration(), apiGet('/api/categories')])
        let dashboardData = null
        let adminData = []

        if (sellerResponse.data?.shop) {
          dashboardData = await getSellerDashboard()
        }

        if (profileData?.role === 'admin') {
          adminData = await getAdminSellerApplications('pending')
        }

        if (!active) return

        if (sellerResponse.token) setAuthToken(sellerResponse.token)
        setCategories(categoriesResponse.data || [])
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
    if (!standalone && !loading && !loadError && profile?.role !== 'admin' && shop) {
      navigate('/seller/dashboard', { replace: true })
    }
  }, [standalone, loading, loadError, profile?.role, shop, navigate])

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

    if (!String(productForm.name || '').trim()) errors.name = 'Vui lòng nhập tên sản phẩm'
    if (productForm.price === '' || !Number.isFinite(price) || price < 0) errors.price = 'Giá sản phẩm phải lớn hơn hoặc bằng 0'
    if (productForm.stock === '' || !Number.isFinite(stock) || stock < 0) errors.stock = 'Số lượng tồn kho phải lớn hơn hoặc bằng 0'
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
    const data = await getSellerDashboard()
    applySellerDashboard(data)
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

        {!loading && !loadError && profile?.role !== 'admin' && shop ? (
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
              <SellerOverview stats={stats} orders={orders} products={products} revenueTrend={sellerDashboard.revenueTrend} />
            ) : null}

            {activeSellerTab === 'profile' ? (
              <SellerShopProfilePanel
                shopForm={shopForm}
                savingShopProfile={savingShopProfile}
                updateShopField={updateShopField}
                handleShopImageChange={handleShopImageChange}
                handleShopProfileSubmit={handleShopProfileSubmit}
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

            {activeSellerTab === 'orders' ? (
              <SellerOrdersPanel orders={orders} workingOrderId={workingOrderId} handleOrderStatus={handleOrderStatus} />
            ) : null}

            {activeSellerTab === 'reports' ? (
              <SellerReportsPanel stats={stats} orders={orders} revenueTrend={sellerDashboard.revenueTrend} orderStatusCounts={orderStatusCounts} />
            ) : null}
          </div>
        ) : null}

        {!loading && !loadError && profile?.role !== 'admin' && !shop ? (
          <SellerRegistrationPanel
            application={application}
            canSubmitShopApplication={canSubmitShopApplication}
            shopForm={shopForm}
            sellerSaving={sellerSaving}
            updateShopField={updateShopField}
            handleShopSubmit={handleShopSubmit}
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

function SellerCenterShell({ profile, shop, activeTab, onTabChange, children }) {
  return (
    <main className="min-h-screen bg-surface-container-low font-['Be_Vietnam_Pro'] text-on-surface">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden border-r border-outline-variant bg-surface-container-lowest lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
          <div className="flex h-16 items-center gap-2 border-b border-outline-variant px-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary">
              <span className="material-symbols-outlined text-[21px]">storefront</span>
            </span>
            <div className="min-w-0">
              <p className="truncate text-title-sm font-title-sm text-on-surface">ShopBee Seller</p>
              <p className="truncate text-body-sm text-on-surface-variant">{shop?.name || 'Kênh bán hàng'}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-3 py-4">
            {sellerTabs.map((tab) => (
              <button
                key={tab.value}
                className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-label-md font-label-md transition-colors ${
                  activeTab === tab.value
                    ? 'bg-primary-container text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                type="button"
                onClick={() => onTabChange(tab.value)}
              >
                <span className="material-symbols-outlined text-[19px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="border-t border-outline-variant px-4 py-4">
            <p className="truncate text-label-md font-label-md text-on-surface">{profile?.name || 'Seller'}</p>
            <p className="truncate text-body-sm text-on-surface-variant">{profile?.email || ''}</p>
          </div>
        </aside>

        <section className="min-w-0 lg:flex lg:min-h-screen lg:flex-col">
          <header className="sticky top-0 z-10 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-lowest px-4 md:px-6">
            <div>
              <p className="text-title-sm font-title-sm text-on-surface">Seller Center</p>
              <p className="text-body-sm text-on-surface-variant">{shop?.name || 'Quản lý kênh bán hàng'}</p>
            </div>
            <Link className="rounded-md border border-outline-variant px-3 py-2 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary" to="/">
              Trang chủ
            </Link>
          </header>

          <nav className="flex min-h-12 shrink-0 gap-1 overflow-x-auto border-b border-outline-variant bg-surface-container-lowest px-3 py-2 lg:hidden">
            {sellerTabs.map((tab) => (
              <button
                key={tab.value}
                className={`flex min-w-max items-center gap-2 rounded-md px-3 text-label-md font-label-md transition-colors ${
                  activeTab === tab.value
                    ? 'bg-primary-container text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                type="button"
                onClick={() => onTabChange(tab.value)}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <div id="top" className="px-4 py-5 md:px-6">
            <div className="mx-auto max-w-[1280px]">{children}</div>
          </div>
        </section>
      </div>
    </main>
  )
}

function AdminApplicationsPanel({
  adminApplications,
  adminLoading,
  adminReviewingId,
  rejectReasons,
  setRejectReasons,
  loadAdminApplications,
  handleApplicationReview,
}) {
  return (
    <div className="mt-5 rounded-lg border border-outline-variant px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-3">
        <div>
          <h2 className="text-title-sm font-title-sm text-on-surface">Đơn đăng ký chờ duyệt</h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {adminApplications.length ? `${adminApplications.length} đơn đang chờ xử lý` : 'Không có đơn đang chờ'}
          </p>
        </div>
        <button
          className="h-10 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface hover:border-primary hover:text-primary disabled:opacity-60"
          type="button"
          onClick={loadAdminApplications}
          disabled={adminLoading}
        >
          {adminLoading ? 'Đang tải...' : 'Tải lại'}
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {adminApplications.map((item) => (
          <article key={item.id} className="rounded-lg bg-surface-container-low px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-title-sm font-title-sm text-on-surface">{item.shopName}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-body-sm text-on-surface-variant">
                  {item.user?.name} · {item.user?.email} · {item.contactPhone}
                </p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {item.addressLine1}, {item.province}
                </p>
                {item.description ? <p className="mt-2 max-w-2xl text-body-sm text-on-surface">{item.description}</p> : null}
              </div>
              <div className="text-body-sm text-on-surface-variant">{formatDateTime(item.createdAt)}</div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
              <input
                className="h-10 rounded-lg border-outline-variant bg-surface-container-lowest text-body-sm focus:border-primary focus:ring-primary"
                value={rejectReasons[item.id] || ''}
                onChange={(event) => setRejectReasons((current) => ({ ...current, [item.id]: event.target.value }))}
                placeholder="Lý do từ chối"
                disabled={adminReviewingId === item.id}
              />
              <button
                className="h-10 rounded-lg border border-outline-variant px-4 text-label-md font-label-md text-on-surface hover:border-error hover:text-error disabled:opacity-60"
                type="button"
                onClick={() => handleApplicationReview(item, 'reject')}
                disabled={adminReviewingId === item.id}
              >
                Từ chối
              </button>
              <button
                className="h-10 rounded-lg bg-primary px-4 text-label-md font-label-md text-on-primary hover:bg-primary/90 disabled:opacity-60"
                type="button"
                onClick={() => handleApplicationReview(item, 'approve')}
                disabled={adminReviewingId === item.id}
              >
                Duyệt
              </button>
            </div>
          </article>
        ))}

        {!adminApplications.length ? (
          <EmptySellerNotice icon="task_alt" title="Không có đơn chờ duyệt" message="Các đơn đăng ký mới sẽ xuất hiện tại đây." />
        ) : null}
      </div>
    </div>
  )
}

function SellerOverview({ stats, orders, products, revenueTrend }) {
  const recentOrders = orders.slice(0, 5)
  const attentionProducts = products.filter((product) => Number(product.stock || 0) <= 0 || !product.isActive).slice(0, 5)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon="payments" label="Doanh thu tháng" value={formatCurrency(stats.monthlyRevenue)} note="Tháng này" />
        <MetricCard icon="shopping_cart" label="Tổng đơn hàng" value={formatCount(stats.orderCount)} note={`${formatCount(stats.pendingOrders)} chờ xử lý`} />
        <MetricCard icon="inventory_2" label="Sản phẩm đang bán" value={formatCount(stats.activeProducts)} note={`${formatCount(stats.productCount)} tổng`} />
        <MetricCard icon="warning" label="Hết hàng" value={formatCount(stats.outOfStockProducts)} note="Cần xử lý" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <RevenueChart trend={revenueTrend} />
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
          <h3 className="text-title-sm font-title-sm text-on-surface">Sản phẩm cần chú ý</h3>
          <div className="mt-3 space-y-3">
            {attentionProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-label-md font-label-md text-on-surface">{product.name}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    Kho {formatCount(product.stock)} · {product.isActive ? 'Đang bán' : 'Đã đóng'}
                  </p>
                </div>
                <span className="material-symbols-outlined text-error">priority_high</span>
              </div>
            ))}
            {!attentionProducts.length ? <p className="text-body-sm text-on-surface-variant">Không có sản phẩm cần xử lý.</p> : null}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
        <h3 className="text-title-sm font-title-sm text-on-surface">Đơn hàng gần đây</h3>
        <div className="mt-3 space-y-3">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-3">
              <div>
                <p className="text-label-md font-label-md text-on-surface">#{order.code}</p>
                <p className="text-body-sm text-on-surface-variant">{order.customer?.name} · {formatDateTime(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-label-md font-label-md text-primary">{formatCurrency(order.shopTotal)}</p>
                <p className="text-body-sm text-on-surface-variant">{orderStatusLabels[order.status] || order.status}</p>
              </div>
            </div>
          ))}
          {!recentOrders.length ? <p className="text-body-sm text-on-surface-variant">Chưa có đơn hàng.</p> : null}
        </div>
      </div>
    </div>
  )
}

function SellerShopProfilePanel({ shopForm, savingShopProfile, updateShopField, handleShopImageChange, handleShopProfileSubmit }) {
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
        <label className="grid gap-2">
          <span className="text-body-sm text-on-surface-variant">Tên cửa hàng</span>
          <input
            className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
            value={shopForm.shopName}
            onChange={(event) => updateShopField('shopName', event.target.value)}
            disabled={savingShopProfile}
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-body-sm text-on-surface-variant">Số điện thoại liên hệ</span>
          <input
            className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
            value={shopForm.contactPhone}
            onChange={(event) => updateShopField('contactPhone', event.target.value)}
            disabled={savingShopProfile}
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-body-sm text-on-surface-variant">Email liên hệ</span>
          <input
            className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
            type="email"
            value={shopForm.contactEmail}
            onChange={(event) => updateShopField('contactEmail', event.target.value)}
            disabled={savingShopProfile}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-body-sm text-on-surface-variant">Tỉnh/Thành phố</span>
          <input
            className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
            value={shopForm.province}
            onChange={(event) => updateShopField('province', event.target.value)}
            disabled={savingShopProfile}
            required
          />
        </label>

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

        <label className="grid gap-2">
          <span className="text-body-sm text-on-surface-variant">Phường/Xã</span>
          <input
            className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
            value={shopForm.ward}
            onChange={(event) => updateShopField('ward', event.target.value)}
            disabled={savingShopProfile}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-body-sm text-on-surface-variant">Quận/Huyện</span>
          <input
            className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
            value={shopForm.district}
            onChange={(event) => updateShopField('district', event.target.value)}
            disabled={savingShopProfile}
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

function SellerProductsPanel({
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
            + Đăng sản phẩm mới
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

function SellerOrdersPanel({ orders, workingOrderId, handleOrderStatus }) {
  return (
    <div className="rounded-lg border border-outline-variant px-4 py-4">
      <h2 className="text-title-sm font-title-sm text-on-surface">Quản lý đơn hàng</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="h-11 bg-surface-container-low text-label-sm font-label-sm uppercase text-on-surface-variant">
              <th className="px-3">Đơn hàng</th>
              <th className="px-3">Khách hàng</th>
              <th className="px-3">Sản phẩm</th>
              <th className="px-3">Giá trị shop</th>
              <th className="px-3">Ngày đặt</th>
              <th className="px-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-outline-variant text-body-sm">
                <td className="px-3 py-3 font-semibold text-primary">#{order.code}</td>
                <td className="px-3 py-3">
                  <p className="font-semibold text-on-surface">{order.customer?.name}</p>
                  <p className="text-body-sm text-on-surface-variant">{order.customer?.phone}</p>
                </td>
                <td className="max-w-[260px] px-3 py-3">
                  <p className="line-clamp-2">{order.productNames}</p>
                  <p className="text-body-sm text-on-surface-variant">{formatCount(order.itemCount)} sản phẩm</p>
                </td>
                <td className="px-3 py-3 font-semibold text-primary">{formatCurrency(order.shopTotal)}</td>
                <td className="px-3 py-3">{formatDateTime(order.createdAt)}</td>
                <td className="px-3 py-3">
                  <select
                    className="h-9 rounded-md border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary disabled:opacity-60"
                    value={order.status}
                    onChange={(event) => handleOrderStatus(order, event.target.value)}
                    disabled={workingOrderId === order.id || order.status === 'refunded'}
                  >
                    {orderStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    {order.status === 'refunded' ? <option value="refunded">Đã hoàn tiền</option> : null}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!orders.length ? (
        <div className="mt-4">
          <EmptySellerNotice icon="receipt_long" title="Chưa có đơn hàng" message="Khi khách mua sản phẩm, đơn hàng sẽ xuất hiện tại đây." />
        </div>
      ) : null}
    </div>
  )
}

function SellerReportsPanel({ stats, orders, revenueTrend, orderStatusCounts }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon="account_balance_wallet" label="Tổng doanh thu" value={formatCurrency(stats.totalRevenue)} note="Tất cả" />
        <MetricCard icon="payments" label="Doanh thu tháng" value={formatCurrency(stats.monthlyRevenue)} note="Tháng này" />
        <MetricCard icon="shopping_bag" label="Tổng đơn" value={formatCount(stats.orderCount)} note={`${formatCount(stats.pendingOrders)} chờ`} />
        <MetricCard icon="inventory" label="Sản phẩm" value={formatCount(stats.productCount)} note={`${formatCount(stats.activeProducts)} đang bán`} />
      </div>

      <RevenueChart trend={revenueTrend} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
          <h3 className="text-title-sm font-title-sm text-on-surface">Trạng thái đơn hàng</h3>
          <div className="mt-3 space-y-2">
            {Object.entries(orderStatusLabels).map(([status, label]) => (
              <div key={status} className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2">
                <span className="text-body-sm text-on-surface">{label}</span>
                <span className="text-label-md font-label-md text-primary">{formatCount(orderStatusCounts[status] || 0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4">
          <h3 className="text-title-sm font-title-sm text-on-surface">Đơn doanh thu cao</h3>
          <div className="mt-3 space-y-2">
            {[...orders]
              .sort((a, b) => Number(b.shopTotal || 0) - Number(a.shopTotal || 0))
              .slice(0, 5)
              .map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2">
                  <span className="text-body-sm text-on-surface">#{order.code}</span>
                  <span className="text-label-md font-label-md text-primary">{formatCurrency(order.shopTotal)}</span>
                </div>
              ))}
            {!orders.length ? <p className="text-body-sm text-on-surface-variant">Chưa có dữ liệu đơn hàng.</p> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function SellerRegistrationPanel({ application, canSubmitShopApplication, shopForm, sellerSaving, updateShopField, handleShopSubmit }) {
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

            <label className="grid gap-2">
              <span className="text-body-sm text-on-surface-variant">Email liên hệ</span>
              <input
                className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                type="email"
                value={shopForm.contactEmail}
                onChange={(event) => updateShopField('contactEmail', event.target.value)}
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
              <span className="text-body-sm text-on-surface-variant">Quận/Huyện</span>
              <input
                className="h-10 rounded-lg border-outline-variant bg-surface-container-low text-body-sm focus:border-primary focus:ring-primary"
                value={shopForm.district}
                onChange={(event) => updateShopField('district', event.target.value)}
                disabled={sellerSaving}
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
