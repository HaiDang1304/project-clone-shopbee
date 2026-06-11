const express = require('express')

const { asyncHandler } = require('../middleware/error')
const { createChatboxReply } = require('../services/chatbox.service')

const router = express.Router()

router.post(
  '/message',
  asyncHandler(async (req, res) => {
    const data = await createChatboxReply({
      message: req.body?.message,
      history: req.body?.history,
    })

    res.json({
      ok: true,
      data,
    })
  }),
)

module.exports = router
