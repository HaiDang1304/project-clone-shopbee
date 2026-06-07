const shippingConfig = {
  baseFee: 15000,
  remoteAreaFee: 10000,
  distanceFees: {
    SAME_WARD: 0,
    SAME_PROVINCE: 10000,
    SAME_REGION: 18000,
    DIFFERENT_REGION: 30000,
  },
  weightFees: [
    { maxGrams: 500, fee: 0 },
    { maxGrams: 1000, fee: 7000 },
    { maxGrams: 2000, fee: 15000 },
    { maxGrams: Infinity, fee: 25000 },
  ],
}

module.exports = shippingConfig
