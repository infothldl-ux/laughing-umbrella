/** 404：未匹配到任何路由 */
export function notFound(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `接口不存在: ${req.method} ${req.originalUrl}` },
  })
}

/** 统一错误处理（Express 通过 4 个参数识别错误中间件，不可删减参数） */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[server error]', err)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: {
      code: typeof err.code === 'string' ? err.code : 'INTERNAL_ERROR',
      message: err.message || '服务器内部错误',
    },
  })
}
