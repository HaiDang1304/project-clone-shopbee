function registerCommentRoutes(router, context) {
  const {
    asyncHandler,
    deleteAdminReview,
    readAdminReviewsData,
    updateAdminReview,
  } = context

  router.get(
    '/comments',
    asyncHandler(async (req, res) => {
      const reviews = await readAdminReviewsData()
      return res.json({ ok: true, data: reviews })
    }),
  )

  router.patch(
    '/comments/:reviewId',
    asyncHandler(async (req, res) => {
      const reviews = await updateAdminReview(req.params.reviewId, req.body)
      return res.json({ ok: true, data: reviews, message: 'Da cap nhat binh luan' })
    }),
  )

  router.delete(
    '/comments/:reviewId',
    asyncHandler(async (req, res) => {
      const reviews = await deleteAdminReview(req.params.reviewId)
      return res.json({ ok: true, data: reviews, message: 'Da xoa binh luan' })
    }),
  )
}

module.exports = registerCommentRoutes
