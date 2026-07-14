/**
 * 助手状态机：待机 / 聆听 / 思考 / 回答
 *
 * 这里只放 UI 展示相关的元信息；
 * 球体的 3D 视觉参数见 src/three/OrbScene.js 中的 ORB_VISUALS。
 *
 * 注意：Tailwind 需要在源码中出现完整类名才能生成样式，
 * 所以这里写的都是完整 class 字符串，不要改成动态拼接。
 */
export const ORB_STATE_META = {
  idle: {
    label: '待机',
    dotClass: 'bg-sky-400',
    textClass: 'text-sky-300',
    activeClass: 'border-sky-400/70 bg-sky-400/15 text-sky-200',
  },
  listening: {
    label: '聆听中',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-300',
    activeClass: 'border-emerald-400/70 bg-emerald-400/15 text-emerald-200',
  },
  thinking: {
    label: '思考中',
    dotClass: 'bg-violet-400',
    textClass: 'text-violet-300',
    activeClass: 'border-violet-400/70 bg-violet-400/15 text-violet-200',
  },
  speaking: {
    label: '回答中',
    dotClass: 'bg-orange-400',
    textClass: 'text-orange-300',
    activeClass: 'border-orange-400/70 bg-orange-400/15 text-orange-200',
  },
}

export const ORB_STATE_ORDER = ['idle', 'listening', 'thinking', 'speaking']
