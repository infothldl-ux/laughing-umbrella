import 'dotenv/config'

/**
 * 统一读取环境变量。
 * 全部提供默认值：不创建 .env 文件也能直接运行。
 */
export const config = {
  port: Number(process.env.PORT) || 3001,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // ---------- 第二阶段预留：AI 服务密钥 ----------
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
}
