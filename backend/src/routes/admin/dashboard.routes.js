function registerDashboardRoutes(router, context) {
  const {
    asyncHandler,
    readDashboardData,
  } = context

  router.get(
    '/dashboard',
    asyncHandler(async (req, res) => {
      const dashboard = await readDashboardData()
      return res.json({ ok: true, data: dashboard })
    }),
  )
}

module.exports = registerDashboardRoutes
