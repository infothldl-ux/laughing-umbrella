import { Router } from 'express'

const router = Router()

/**
 * POST /api/chat —— 文本对话接口（第一阶段：占位实现，直接回显）
 *
 * 请求体: { message: string }
 * 响应:   { id, role, reply, createdAt }
 *
 * TODO(第二阶段)：在这里接入大语言模型（如 Anthropic Claude API）
 *   - 使用 config.anthropicApiKey 鉴权
 *   - 维护会话上下文（对话历史）
 *   - 改为 SSE / WebSocket 流式返回，配合语音合成实现实时对话
 */
router.post('/', (req, res) => {
  const { message } = req.body ?? {}

  if (typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({
      error: { code: 'INVALID_MESSAGE', message: 'message 字段必须是非空字符串' },
    })
  }

  res.json({
    id: `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    reply: `（占位回复，AI 尚未接入）我收到了你的消息：「${message.trim()}」`,
    createdAt: new Date().toISOString(),
  })
})

export default router
