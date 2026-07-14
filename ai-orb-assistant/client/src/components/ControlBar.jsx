import { useState } from 'react'
import { ORB_STATE_META, ORB_STATE_ORDER } from '../lib/orbStates.js'

/**
 * 底部控制栏：
 * - 状态演示按钮：第一阶段用于验证球体状态机
 * - 麦克风按钮：占位，目前只切换「聆听」状态；第二阶段接入真实录音
 *   （MediaRecorder / AudioWorklet -> POST /api/voice/transcribe）
 * - 文本输入框：调用 /api/chat 占位接口，验证前后端链路
 */
export default function ControlBar({ orbState, onSelectState, onToggleMic, onSend, sending }) {
  const [text, setText] = useState('')
  const listening = orbState === 'listening'

  const handleSubmit = (event) => {
    event.preventDefault()
    const value = text.trim()
    if (!value || sending) return
    onSend(value)
    setText('')
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4 px-4">
      {/* 状态演示按钮 */}
      <div className="flex items-center gap-2">
        {ORB_STATE_ORDER.map((name) => {
          const meta = ORB_STATE_META[name]
          const active = orbState === name
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelectState(name)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors duration-200 ${
                active
                  ? meta.activeClass
                  : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* 麦克风 + 文本输入 */}
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={onToggleMic}
          title={listening ? '停止聆听' : '开始聆听（占位，第二阶段接入真实录音）'}
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            listening
              ? 'border-emerald-300/70 bg-emerald-400/20 text-emerald-200 shadow-[0_0_24px_rgba(52,211,153,0.45)]'
              : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <MicIcon className="h-6 w-6" />
        </button>

        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="输入文字试试（语音对话将在第二阶段开放）"
          className="h-12 flex-1 rounded-full border border-white/10 bg-white/5 px-5 text-sm text-slate-100 outline-none backdrop-blur-md transition-colors placeholder:text-slate-500 focus:border-sky-400/60 focus:bg-white/10"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="h-12 shrink-0 rounded-full border border-sky-400/40 bg-sky-400/15 px-5 text-sm text-sky-200 transition-colors hover:bg-sky-400/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? '发送中…' : '发送'}
        </button>
      </form>
    </div>
  )
}

function MicIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="21" />
    </svg>
  )
}
