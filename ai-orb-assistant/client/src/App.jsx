import { useEffect, useRef, useState } from 'react'
import Orb from './components/Orb.jsx'
import StatusBadge from './components/StatusBadge.jsx'
import ControlBar from './components/ControlBar.jsx'
import { api } from './lib/api.js'

/**
 * AI Orb Assistant 主界面（第一阶段：基础架构）
 *
 * 状态机：idle（待机）-> listening（聆听）-> thinking（思考）-> speaking（回答）
 * 第二阶段将由「录音 -> STT -> LLM -> TTS」的真实流程驱动这套状态。
 */
export default function App() {
  const [orbState, setOrbState] = useState('idle')
  const [backendStatus, setBackendStatus] = useState('checking') // checking | online | offline
  const [conversation, setConversation] = useState([])
  const [sending, setSending] = useState(false)
  const speakTimerRef = useRef(null)

  // 启动时探测后端连通性（验证前后端 API 链路）
  useEffect(() => {
    let cancelled = false
    api
      .health()
      .then(() => !cancelled && setBackendStatus('online'))
      .catch(() => !cancelled && setBackendStatus('offline'))
    return () => {
      cancelled = true
    }
  }, [])

  // 卸载时清理「回答中 -> 待机」的定时器
  useEffect(() => () => clearTimeout(speakTimerRef.current), [])

  // 麦克风按钮：目前只切换状态；第二阶段接入真实录音
  const handleToggleMic = () => {
    setOrbState((current) => (current === 'listening' ? 'idle' : 'listening'))
  }

  // 发送文本消息：演示完整状态流转 思考中 -> 回答中 -> 待机
  const handleSend = async (text) => {
    setSending(true)
    setOrbState('thinking')
    setConversation((list) => [...list.slice(-4), { role: 'user', text }])
    try {
      const data = await api.chat(text)
      setConversation((list) => [...list.slice(-4), { role: 'assistant', text: data.reply }])
      setOrbState('speaking')
      clearTimeout(speakTimerRef.current)
      speakTimerRef.current = setTimeout(() => setOrbState('idle'), 2000)
    } catch (error) {
      setConversation((list) => [
        ...list.slice(-4),
        { role: 'assistant', text: `请求失败：${error.message}（请确认后端已启动）` },
      ])
      setOrbState('idle')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#05070f]">
      {/* 3D 球体画布：铺满全屏，位于 UI 之下 */}
      <Orb state={orbState} className="absolute inset-0" />

      {/* 顶部栏 */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6">
        <div>
          <h1 className="bg-linear-to-r from-sky-300 via-cyan-200 to-violet-300 bg-clip-text text-xl font-semibold tracking-wide text-transparent">
            AI Orb Assistant
          </h1>
          <p className="mt-1 text-xs tracking-widest text-slate-500">AI 实时语音助手 · 第一阶段</p>
        </div>
        <BackendIndicator status={backendStatus} />
      </header>

      {/* 底部：最近消息 + 状态徽标 + 控制栏 */}
      <footer className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 pb-8">
        <MessageList conversation={conversation} />
        <StatusBadge state={orbState} />
        <ControlBar
          orbState={orbState}
          onSelectState={setOrbState}
          onToggleMic={handleToggleMic}
          onSend={handleSend}
          sending={sending}
        />
      </footer>
    </div>
  )
}

/** 后端连接状态指示灯 */
function BackendIndicator({ status }) {
  const meta = {
    checking: { dot: 'bg-amber-400', label: '正在连接后端…' },
    online: { dot: 'bg-emerald-400', label: '后端已连接' },
    offline: { dot: 'bg-rose-400', label: '后端未连接' },
  }[status]

  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      <span className="text-xs text-slate-400">{meta.label}</span>
    </div>
  )
}

/** 最近两条消息（占位展示，验证 /api/chat 链路） */
function MessageList({ conversation }) {
  if (conversation.length === 0) {
    return (
      <p className="max-w-md px-4 text-center text-xs leading-relaxed text-slate-500">
        点击下方按钮切换球体状态，或输入文字调用后端占位接口。
        <br />
        语音识别与 AI 对话将在第二阶段接入。
      </p>
    )
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-2 px-4">
      {conversation.slice(-2).map((message, index) => (
        <div
          key={`${index}-${message.text}`}
          className={`max-w-[85%] rounded-2xl border px-4 py-2 text-sm backdrop-blur-md ${
            message.role === 'user'
              ? 'self-end border-sky-400/30 bg-sky-400/10 text-sky-100'
              : 'self-start border-white/10 bg-white/5 text-slate-200'
          }`}
        >
          {message.text}
        </div>
      ))}
    </div>
  )
}
