const mongoose = require('mongoose')

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    avatarUrl: { type: String, trim: true },
    coverUrl: { type: String, trim: true },
    description: { type: String, trim: true },

    address: {
      line1: { type: String, trim: true },
      ward: { type: String, trim: true },
      district: { type: String, trim: true },
      province: { type: String, trim: true },
      country: { type: String, trim: true, default: 'VN' },
    },

    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    followerCount: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

shopSchema.index({ slug: 1 }, { unique: true })
shopSchema.index({ ownerId: 1 })

module.exports = mongoose.model('Shop', shopSchema)
