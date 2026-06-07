const shippingConfig = require('../config/shipping.config')

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function groupCartByShop(cartItems) {
  const groups = new Map()

  cartItems.forEach((item) => {
    const shopId = Number(item.shopId)
    const group = groups.get(shopId) || {
      shopId,
      shopName: item.shopName || '',
      shopAddress: item.shopAddress,
      items: [],
      shopSubtotal: 0,
      totalWeightGrams: 0,
    }

    const quantity = toNumber(item.quantity)
    group.items.push(item)
    group.shopSubtotal += toNumber(item.lineTotal)
    group.totalWeightGrams += toNumber(item.weightGrams) * quantity
    groups.set(shopId, group)
  })

  return [...groups.values()]
}

function getShippingDistanceType(shopAddress, customerAddress) {
  if (!shopAddress?.provinceId || !shopAddress?.wardId) {
    throw new Error('Cua hang chua cau hinh day du dia chi lay hang')
  }

  if (!customerAddress?.provinceId || !customerAddress?.wardId) {
    throw new Error('Dia chi nhan hang chua chon day du tinh/thanh pho va phuong/xa')
  }

  if (Number(shopAddress.wardId) === Number(customerAddress.wardId)) return 'SAME_WARD'
  if (Number(shopAddress.provinceId) === Number(customerAddress.provinceId)) return 'SAME_PROVINCE'
  if (shopAddress.region && customerAddress.region && shopAddress.region === customerAddress.region) return 'SAME_REGION'
  return 'DIFFERENT_REGION'
}

function getWeightFee(totalWeight) {
  const weightGrams = Math.max(0, toNumber(totalWeight))
  return shippingConfig.weightFees.find((rule) => weightGrams <= rule.maxGrams)?.fee || 0
}

function calculateShippingFee({ distanceType, totalWeight, isRemoteArea = false }) {
  const distanceFee = shippingConfig.distanceFees[distanceType]
  if (distanceFee === undefined) {
    throw new Error('Khoang cach van chuyen khong hop le')
  }

  return shippingConfig.baseFee + distanceFee + getWeightFee(totalWeight) + (isRemoteArea ? shippingConfig.remoteAreaFee : 0)
}

function calculateShippingForCart(cartItems, customerAddress) {
  const shops = groupCartByShop(cartItems).map((shop) => {
    const distanceType = getShippingDistanceType(shop.shopAddress, customerAddress)
    const shippingFee = calculateShippingFee({
      distanceType,
      totalWeight: shop.totalWeightGrams,
      isRemoteArea: shop.shopAddress?.zoneType === 'REMOTE' || customerAddress.zoneType === 'REMOTE',
    })

    return {
      ...shop,
      distanceType,
      shippingFee,
      shopTotal: shop.shopSubtotal + shippingFee,
    }
  })

  const subtotal = shops.reduce((sum, shop) => sum + shop.shopSubtotal, 0)
  const totalShippingFee = shops.reduce((sum, shop) => sum + shop.shippingFee, 0)

  return {
    provider: 'shopbee',
    shops,
    subtotal,
    totalShippingFee,
    grandTotal: subtotal + totalShippingFee,
  }
}

module.exports = {
  calculateShippingFee,
  calculateShippingForCart,
  getShippingDistanceType,
  groupCartByShop,
}
