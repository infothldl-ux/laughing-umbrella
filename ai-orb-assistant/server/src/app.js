import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import healthRouter from './routes/health.js'
import chatRouter from './routes/chat.js'
import voiceRouter from './routes/voice.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

/** 创建并组装 Express 应用（路由 / 中间件在这里集中注册） */
export function createApp() {
  const app = express()

  app.use(cors({ origin: config.clientOrigin }))
  app.use(express.json({ limit: '2mb' }))

  // 简易请求日志
  app.use((req, res, next) => {
    const startedAt = Date.now()
    res.on('finish', () => {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`,
      )
    })
    next()
  })

  // API 总览：浏览器直接访问 /api 可以看到所有可用接口
  app.get('/api', (req, res) => {
    res.json({
      service: 'ai-orb-server',
      message: 'AI Orb Assistant 后端 API（第一阶段：占位接口，AI 尚未接入）',
      endpoints: [
        { method: 'GET', path: '/api/health', description: '健康检查' },
        { method: 'POST', path: '/api/chat', description: '文本对话（占位回显，第二阶段接入大模型）' },
        { method: 'POST', path: '/api/voice/transcribe', description: '语音识别 STT（预留，返回 501）' },
        { method: 'POST', path: '/api/voice/synthesize', description: '语音合成 TTS（预留，返回 501）' },
      ],
    })
  })

  app.use('/api/health', healthRouter)
  app.use('/api/chat', chatRouter)
  app.use('/api/voice', voiceRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
