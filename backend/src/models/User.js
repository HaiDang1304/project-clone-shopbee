const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    ward: { type: String, trim: true },
    district: { type: String, trim: true },
    province: { type: String, trim: true },
    country: { type: String, trim: true, default: 'VN' },
    postalCode: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: {
      type: String,
      required: function requiredPasswordHash() {
        return !this.googleSub
      },
    },
    googleSub: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    emailVerified: { type: Boolean, default: false },
    emailVerification: {
      codeHash: { type: String },
      expiresAt: { type: Date },
      lastSentAt: { type: Date },
    },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ googleSub: 1 }, { unique: true, sparse: true })

module.exports = mongoose.model('User', userSchema)
