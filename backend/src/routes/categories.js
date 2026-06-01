const express = require('express')

const { query } = require('../config/db')
const { asyncHandler } = require('../middleware/error')

const router = express.Router()

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
    isActive: Boolean(row.is_active),
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await query(
      `SELECT id, name, slug, parent_id, is_active
       FROM categories
       WHERE is_active = 1
       ORDER BY sort_order ASC, name ASC`,
    )

    res.json({ ok: true, data: rows.map(mapCategory) })
  }),
)

module.exports = router
