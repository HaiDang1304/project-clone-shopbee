function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

function notFoundHandler(req, res) {
  res.status(404).json({ ok: false, message: 'Không tìm thấy API' })
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)

  const status = err.statusCode || err.status || 500

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err)
  }

  return res.status(status).json({
    ok: false,
    message: err.publicMessage || err.message || 'Server error',
  })
}

module.exports = {
  asyncHandler,
  errorHandler,
  notFoundHandler,
}
