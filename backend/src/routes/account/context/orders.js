function toOrder(row, items) {
  return {
    id: row.id,
    status: row.status,
    itemsTotal: Number(row.itemsTotal || 0),
    shippingFee: Number(row.shippingFee || 0),
    discountTotal: Number(row.discountTotal || 0),
    grandTotal: Number(row.grandTotal || 0),
    paymentMethod: row.paymentMethod,
    paidAt: row.paidAt,
    shipping: {
      fullName: row.shippingFullName,
      phone: row.shippingPhone,
      line1: row.shippingLine1,
      ward: row.shippingWard || '',
      province: row.shippingProvince,
      country: row.shippingCountry,
      postalCode: row.shippingPostalCode || '',
    },
    note: row.note || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items,
  }
}

function toReview(row) {
  return {
    id: Number(row.id),
    productId: Number(row.product_id),
    userId: Number(row.user_id),
    orderId: row.order_id == null ? null : Number(row.order_id),
    rating: Number(row.rating || 0),
    comment: row.comment || '',
    userName: row.user_name || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

module.exports = {
  toOrder,
  toReview,
}
