/**
 * 后端 API 统一封装
 * 所有请求都走这里，方便第二阶段替换为 SSE / WebSocket 流式实现。
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

async function request(path, { method = 'GET', body, ...options } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...options,
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.error?.message || `请求失败（HTTP ${response.status}）`
    throw new ApiError(message, response.status, data)
  }
  return data
}

export const api = {
  /** GET /api/health —— 健康检查 */
  health: () => request('/health'),

  /** POST /api/chat —— 文本对话（第一阶段为占位回显，第二阶段接入大模型） */
  chat: (message) => request('/chat', { method: 'POST', body: { message } }),

  /** POST /api/voice/transcribe —— 语音识别（预留接口，当前返回 501） */
  transcribe: (payload) => request('/voice/transcribe', { method: 'POST', body: payload }),

  /** POST /api/voice/synthesize —— 语音合成（预留接口，当前返回 501） */
  synthesize: (payload) => request('/voice/synthesize', { method: 'POST', body: payload }),
}
