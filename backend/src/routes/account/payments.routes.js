function registerPaymentRoutes(router, context) {
  const {
    asyncHandler,
  } = context

  router.get(
    '/payment-methods',
    asyncHandler(async (req, res) => {
      return res.json({
        ok: true,
        data: {
          bankAccounts: [],
          cards: [],
          message: '',
        },
      })
    }),
  )
}

module.exports = registerPaymentRoutes
