import { useEffect, useRef, useState } from 'react'
import { OrbScene } from '../three/OrbScene.js'

/**
 * 3D 发光球体组件（Three.js 场景的 React 封装）
 *
 * props:
 * - state:  'idle' | 'listening' | 'thinking' | 'speaking'
 * - level:  0~1 实时音量（第二阶段接入麦克风后传入）
 * - className: 容器样式（通常为 absolute inset-0 铺满全屏）
 */
export default function Orb({ state = 'idle', level = 0, className = '' }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const [webglFailed, setWebglFailed] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return undefined

    let orbScene = null
    try {
      orbScene = new OrbScene(containerRef.current)
      sceneRef.current = orbScene
    } catch (error) {
      // WebGL 不可用（老设备 / 被禁用）时降级为 CSS 发光球
      console.warn('[Orb] WebGL 初始化失败，使用降级样式：', error)
      setWebglFailed(true)
    }

    return () => {
      orbScene?.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setState(state)
  }, [state])

  useEffect(() => {
    sceneRef.current?.setLevel(level)
  }, [level])

  return (
    <div ref={containerRef} className={className} aria-hidden="true">
      {webglFailed && (
        <div className="flex h-full w-full items-center justify-center">
          <div className="orb-fallback" />
        </div>
      )}
    </div>
  )
}
