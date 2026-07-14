import { Router } from 'express'

const router = Router()

/** GET /api/health —— 健康检查（前端启动时用它探测后端连通性） */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-orb-server',
    phase: 1,
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString(),
  })
})

export default router
