function registerShopRoutes(router, context) {
  const {
    asyncHandler,
    readAdminShopsData,
  } = context

  router.get(
    '/shops',
    asyncHandler(async (req, res) => {
      const shops = await readAdminShopsData()
      return res.json({ ok: true, data: shops })
    }),
  )
}

module.exports = registerShopRoutes
