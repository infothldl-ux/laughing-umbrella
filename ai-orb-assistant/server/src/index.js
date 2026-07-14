import http from 'node:http'
import { createApp } from './app.js'
import { config } from './config.js'

const app = createApp()

// 用原生 http server 包一层：
// 第二阶段做实时语音时，WebSocket（ws / socket.io）可以直接挂载到同一个 server 上
const server = http.createServer(app)

server.listen(config.port, () => {
  console.log('==========================================')
  console.log('  AI Orb Assistant · 后端服务已启动')
  console.log(`  地址:     http://localhost:${config.port}`)
  console.log(`  健康检查: http://localhost:${config.port}/api/health`)
  console.log('==========================================')
})
