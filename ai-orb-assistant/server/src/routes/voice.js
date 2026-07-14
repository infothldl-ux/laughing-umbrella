import { Router } from 'express'

const router = Router()

/**
 * POST /api/voice/transcribe —— 语音识别（STT）预留接口
 * 第二阶段：接收前端上传的音频（multipart/form-data 或 base64），
 * 调用语音识别服务后返回 { text: string }
 */
router.post('/transcribe', (req, res) => {
  res.status(501).json({
    error: { code: 'NOT_IMPLEMENTED', message: '语音识别接口将在第二阶段实现' },
  })
})

/**
 * POST /api/voice/synthesize —— 语音合成（TTS）预留接口
 * 第二阶段：接收 { text: string }，调用语音合成服务后返回音频流
 */
router.post('/synthesize', (req, res) => {
  res.status(501).json({
    error: { code: 'NOT_IMPLEMENTED', message: '语音合成接口将在第二阶段实现' },
  })
})

export default router
