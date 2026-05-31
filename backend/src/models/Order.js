const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },

    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true },
    variantSku: { type: String, trim: true },

    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    ward: { type: String, trim: true },
    district: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    country: { type: String, trim: true, default: 'VN' },
    postalCode: { type: String, trim: true },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },

    items: { type: [orderItemSchema], required: true },

    itemsTotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },

    paymentMethod: { type: String, enum: ['cod', 'bank', 'momo', 'vnpay'], default: 'cod' },
    paidAt: { type: Date },

    shippingAddress: { type: shippingAddressSchema, required: true },
    note: { type: String, trim: true },
  },
  { timestamps: true },
)

orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('Order', orderSchema)
