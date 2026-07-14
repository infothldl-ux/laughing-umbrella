import { ORB_STATE_META } from '../lib/orbStates.js'

/** 当前助手状态徽标（跟随状态变色） */
export default function StatusBadge({ state }) {
  const meta = ORB_STATE_META[state] ?? ORB_STATE_META.idle
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
      <span className={`h-2 w-2 rounded-full ${meta.dotClass} animate-pulse`} />
      <span className={`text-xs tracking-widest ${meta.textClass}`}>{meta.label}</span>
    </div>
  )
}
