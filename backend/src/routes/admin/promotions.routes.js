function registerPromotionRoutes(router, context) {
  const {
    asyncHandler,
    createAdminVoucher,
    deleteAdminVoucher,
    readAdminVouchersData,
    updateAdminVoucher,
  } = context

  router.get(
    '/promotions',
    asyncHandler(async (req, res) => {
      const vouchers = await readAdminVouchersData()
      return res.json({ ok: true, data: vouchers })
    }),
  )

  router.post(
    '/promotions',
    asyncHandler(async (req, res) => {
      const vouchers = await createAdminVoucher(req.body)
      return res.status(201).json({ ok: true, data: vouchers, message: 'Da tao voucher' })
    }),
  )

  router.patch(
    '/promotions/:voucherId',
    asyncHandler(async (req, res) => {
      const vouchers = await updateAdminVoucher(req.params.voucherId, req.body)
      return res.json({ ok: true, data: vouchers, message: 'Da cap nhat voucher' })
    }),
  )

  router.delete(
    '/promotions/:voucherId',
    asyncHandler(async (req, res) => {
      const vouchers = await deleteAdminVoucher(req.params.voucherId)
      return res.json({ ok: true, data: vouchers, message: 'Da xoa voucher' })
    }),
  )
}

module.exports = registerPromotionRoutes
