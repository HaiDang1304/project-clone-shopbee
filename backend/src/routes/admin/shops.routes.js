function registerShopRoutes(router, context) {
  const {
    asyncHandler,
    readAdminShopsData,
    updateAdminShop,
  } = context

  router.get(
    '/shops',
    asyncHandler(async (req, res) => {
      const shops = await readAdminShopsData()
      return res.json({ ok: true, data: shops })
    }),
  )

  router.patch(
    '/shops/:shopId',
    asyncHandler(async (req, res) => {
      const shops = await updateAdminShop(req.params.shopId, req.body)
      return res.json({ ok: true, data: shops, message: 'Đã cập nhật cửa hàng' })
    }),
  )
}

module.exports = registerShopRoutes
