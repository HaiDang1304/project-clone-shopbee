const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')

const avatarUploadDir = path.join(__dirname, '..', '..', '..', '..', 'public', 'uploads', 'avatars')
const avatarPublicPath = '/uploads/avatars'
const shopUploadDir = path.join(__dirname, '..', '..', '..', '..', 'public', 'uploads', 'shops')
const shopPublicPath = '/uploads/shops'
const productUploadDir = path.join(__dirname, '..', '..', '..', '..', 'public', 'uploads', 'products')
const productPublicPath = '/uploads/products'
const maxAvatarSize = 10 * 1024 * 1024

async function saveAvatarDataUrl(userId, dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/)
  if (!match) {
    const err = new Error('Ảnh đại diện không hợp lệ')
    err.status = 400
    throw err
  }

  const ext = match[1] === 'png' ? 'png' : 'jpg'
  const buffer = Buffer.from(match[2], 'base64')
  if (!buffer.length || buffer.length > maxAvatarSize) {
    const err = new Error('Ảnh đại diện tối đa 10MB')
    err.status = 400
    throw err
  }

  await fs.mkdir(avatarUploadDir, { recursive: true })

  const fileName = `user-${userId}-${crypto.randomUUID()}.${ext}`
  const filePath = path.join(avatarUploadDir, fileName)
  await fs.writeFile(filePath, buffer)

  return `${avatarPublicPath}/${fileName}`
}

async function saveShopImageDataUrl(shopId, type, dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/)
  if (!match) {
    const err = new Error('Ảnh cửa hàng không hợp lệ')
    err.status = 400
    throw err
  }

  const ext = match[1] === 'png' ? 'png' : 'jpg'
  const buffer = Buffer.from(match[2], 'base64')
  if (!buffer.length || buffer.length > maxAvatarSize) {
    const err = new Error('Ảnh cửa hàng tối đa 10MB')
    err.status = 400
    throw err
  }

  await fs.mkdir(shopUploadDir, { recursive: true })

  const imageType = type === 'cover' ? 'cover' : 'avatar'
  const fileName = `shop-${shopId}-${imageType}-${crypto.randomUUID()}.${ext}`
  const filePath = path.join(shopUploadDir, fileName)
  await fs.writeFile(filePath, buffer)

  return `${shopPublicPath}/${fileName}`
}

async function saveProductImageDataUrl(productId, dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/)
  if (!match) {
    const err = new Error('Ảnh sản phẩm không hợp lệ')
    err.status = 400
    throw err
  }

  const ext = match[1] === 'png' ? 'png' : 'jpg'
  const buffer = Buffer.from(match[2], 'base64')
  if (!buffer.length || buffer.length > maxAvatarSize) {
    const err = new Error('Ảnh sản phẩm tối đa 10MB')
    err.status = 400
    throw err
  }

  await fs.mkdir(productUploadDir, { recursive: true })

  const fileName = `product-${productId}-${crypto.randomUUID()}.${ext}`
  const filePath = path.join(productUploadDir, fileName)
  await fs.writeFile(filePath, buffer)

  return `${productPublicPath}/${fileName}`
}

module.exports = {
  saveAvatarDataUrl,
  saveShopImageDataUrl,
  saveProductImageDataUrl,
}
