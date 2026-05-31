const mongoose = require('mongoose')

const productVariantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    attributes: { type: Map, of: String, default: {} },
    imageUrls: { type: [String], default: [] },
  },
  { _id: false },
)

const flashSaleSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: false },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    startAt: { type: Date },
    endAt: { type: Date },
    soldInEvent: { type: Number, default: 0, min: 0 },
    eventStock: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '' },

    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },

    imageUrls: { type: [String], default: [] },
    thumbnailUrl: { type: String, trim: true },

    variants: { type: [productVariantSchema], default: [] },
    flashSale: { type: flashSaleSchema, default: () => ({}) },

    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },

    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

productSchema.index({ slug: 1 }, { unique: true })
productSchema.index({ shopId: 1, createdAt: -1 })
productSchema.index({ categoryId: 1, createdAt: -1 })
productSchema.index({ name: 'text', description: 'text', tags: 'text' })

module.exports = mongoose.model('Product', productSchema)
