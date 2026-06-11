function registerCategoryRoutes(router, context) {
  const {
    asyncHandler,
    createAdminCategory,
    deleteAdminCategory,
    readAdminCategoriesData,
    updateAdminCategory,
  } = context

  router.get(
    '/categories',
    asyncHandler(async (req, res) => {
      const categories = await readAdminCategoriesData()
      return res.json({ ok: true, data: categories })
    }),
  )

  router.post(
    '/categories',
    asyncHandler(async (req, res) => {
      const categories = await createAdminCategory(req.body)
      return res.status(201).json({ ok: true, data: categories, message: 'Da tao danh muc' })
    }),
  )

  router.patch(
    '/categories/:categoryId',
    asyncHandler(async (req, res) => {
      const categories = await updateAdminCategory(req.params.categoryId, req.body)
      return res.json({ ok: true, data: categories, message: 'Da cap nhat danh muc' })
    }),
  )

  router.delete(
    '/categories/:categoryId',
    asyncHandler(async (req, res) => {
      const categories = await deleteAdminCategory(req.params.categoryId)
      return res.json({ ok: true, data: categories, message: 'Da xoa danh muc' })
    }),
  )
}

module.exports = registerCategoryRoutes
