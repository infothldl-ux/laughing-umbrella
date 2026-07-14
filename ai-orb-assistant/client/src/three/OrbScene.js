import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import {
  coreVertexShader,
  coreFragmentShader,
  haloVertexShader,
  haloFragmentShader,
} from './shaders.js'

/** 每个助手状态对应的球体视觉参数（颜色 / 起伏 / 动感 / 泛光强度） */
export const ORB_VISUALS = {
  idle: { colorA: '#0b2545', colorB: '#4cc9f0', displacement: 0.1, speed: 0.55, bloom: 0.5, ringSpeed: 0.06 },
  listening: { colorA: '#04372b', colorB: '#34d399', displacement: 0.2, speed: 1.15, bloom: 0.7, ringSpeed: 0.14 },
  thinking: { colorA: '#231263', colorB: '#a78bfa', displacement: 0.15, speed: 2.1, bloom: 0.6, ringSpeed: 0.5 },
  speaking: { colorA: '#571c0d', colorB: '#fb923c', displacement: 0.26, speed: 1.5, bloom: 0.8, ringSpeed: 0.22 },
}

/**
 * OrbScene —— 用原生 Three.js 封装的「3D 发光球体」场景，与 React 完全解耦。
 *
 * 用法：
 *   const orb = new OrbScene(containerElement)
 *   orb.setState('listening')  // 切换状态，颜色/动感会平滑过渡
 *   orb.setLevel(0.6)          // 第二阶段：传入实时音量（0~1）驱动球体
 *   orb.dispose()              // 组件卸载时清理所有资源
 *
 * 场景构成：噪声形变的核心球 + 大气光晕 + 环绕粒子带 + 远景星空 + Bloom 泛光
 */
export class OrbScene {
  constructor(container) {
    this.container = container
    this.disposed = false
    this.pointer = new THREE.Vector2(0, 0)
    this.level = 0
    this.levelSmoothed = 0
    this.shaderTime = 0

    const width = container.clientWidth || 1
    const height = container.clientHeight || 1

    // ---------- 基础三件套 ----------
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#05070f')

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    this.camera.position.set(0, 0, 7)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(width, height)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    container.appendChild(this.renderer.domElement)

    // ---------- 当前值 / 目标值（用于状态切换时的平滑过渡） ----------
    const initial = ORB_VISUALS.idle
    this.current = {
      displacement: initial.displacement,
      speed: initial.speed,
      bloom: initial.bloom,
      ringSpeed: initial.ringSpeed,
    }
    this.target = { ...this.current }
    this.targetColorA = new THREE.Color(initial.colorA)
    this.targetColorB = new THREE.Color(initial.colorB)

    // ---------- 核心球体（自定义着色器） ----------
    this.uniforms = {
      uTime: { value: 0 },
      uDisplacement: { value: initial.displacement },
      uLevel: { value: 0 },
      uColorA: { value: new THREE.Color(initial.colorA) },
      uColorB: { value: new THREE.Color(initial.colorB) },
    }
    const coreGeometry = new THREE.IcosahedronGeometry(1.35, 6)
    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
    })
    this.core = new THREE.Mesh(coreGeometry, coreMaterial)

    // 球体整体略微上移，给底部控制栏留出视觉空间
    this.orbGroup = new THREE.Group()
    this.orbGroup.position.y = 0.35
    this.orbGroup.add(this.core)
    this.scene.add(this.orbGroup)

    // ---------- 外层光晕（与核心共享 uColorB 颜色实例，状态切换自动跟随） ----------
    const haloGeometry = new THREE.SphereGeometry(1.35, 48, 48)
    const haloMaterial = new THREE.ShaderMaterial({
      uniforms: { uColor: this.uniforms.uColorB },
      vertexShader: haloVertexShader,
      fragmentShader: haloFragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
    this.halo = new THREE.Mesh(haloGeometry, haloMaterial)
    this.halo.scale.setScalar(1.45)
    this.orbGroup.add(this.halo)

    // ---------- 环绕粒子带 ----------
    this.ringGroup = new THREE.Group()
    this.ringGroup.rotation.x = 0.42
    this.ring = this.#createParticleBand(320, 2.1, 3.1, 0.45, '#9bb8ff', 0.05, 0.75)
    this.ringGroup.add(this.ring)
    this.orbGroup.add(this.ringGroup)

    // ---------- 远景星空 ----------
    this.stars = this.#createStarShell(500, 9, 22, '#5c7cba', 0.09, 0.7)
    this.scene.add(this.stars)

    // ---------- 后期处理：Bloom 泛光（球体"发光"的关键） ----------
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), initial.bloom, 0.55, 0.35)
    this.composer.addPass(this.bloomPass)
    this.composer.addPass(new OutputPass())

    // ---------- 事件监听 ----------
    this.onPointerMove = (event) => {
      this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      this.pointer.y = -((event.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', this.onPointerMove)

    this.resizeObserver = new ResizeObserver(() => this.#handleResize())
    this.resizeObserver.observe(container)

    // ---------- 动画循环 ----------
    this.clock = new THREE.Clock()
    const animate = () => {
      if (this.disposed) return
      this.rafId = requestAnimationFrame(animate)
      this.#tick(Math.min(this.clock.getDelta(), 0.05))
    }
    animate()
  }

  /** 切换助手状态：'idle' | 'listening' | 'thinking' | 'speaking' */
  setState(name) {
    const visuals = ORB_VISUALS[name] ?? ORB_VISUALS.idle
    this.target.displacement = visuals.displacement
    this.target.speed = visuals.speed
    this.target.bloom = visuals.bloom
    this.target.ringSpeed = visuals.ringSpeed
    this.targetColorA.set(visuals.colorA)
    this.targetColorB.set(visuals.colorB)
  }

  /** 传入实时音量（0~1）。第二阶段由麦克风输入 / TTS 播放电平驱动 */
  setLevel(value) {
    this.level = THREE.MathUtils.clamp(value ?? 0, 0, 1)
  }

  /** 清理全部 WebGL 资源与事件监听（React 组件卸载时调用） */
  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.rafId)
    this.resizeObserver.disconnect()
    window.removeEventListener('pointermove', this.onPointerMove)

    this.scene.traverse((object) => {
      object.geometry?.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => material?.dispose())
    })
    this.bloomPass.dispose()
    this.composer.dispose?.()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  // ---------- 私有方法 ----------

  #tick(dt) {
    // 向目标参数平滑过渡（与帧率无关的指数阻尼）
    const k = 1 - Math.exp(-dt * 3.5)
    this.current.displacement += (this.target.displacement - this.current.displacement) * k
    this.current.speed += (this.target.speed - this.current.speed) * k
    this.current.bloom += (this.target.bloom - this.current.bloom) * k
    this.current.ringSpeed += (this.target.ringSpeed - this.current.ringSpeed) * k
    this.uniforms.uColorA.value.lerp(this.targetColorA, k)
    this.uniforms.uColorB.value.lerp(this.targetColorB, k)
    this.levelSmoothed += (this.level - this.levelSmoothed) * (1 - Math.exp(-dt * 8))

    // 时间按当前速度推进，保证变速瞬间动画依然连续
    this.shaderTime += dt * this.current.speed
    this.uniforms.uTime.value = this.shaderTime
    this.uniforms.uDisplacement.value = this.current.displacement
    this.uniforms.uLevel.value = this.levelSmoothed
    this.bloomPass.strength = this.current.bloom + this.levelSmoothed * 0.6

    // 呼吸缩放 + 缓慢自转
    const breathe = 1 + Math.sin(this.shaderTime * 1.4) * 0.015 + this.levelSmoothed * 0.06
    this.core.scale.setScalar(breathe)
    this.halo.scale.setScalar(1.45 * (1 + this.levelSmoothed * 0.08))
    this.core.rotation.y += dt * 0.12
    this.ringGroup.rotation.y += dt * (0.1 + this.current.ringSpeed)
    this.stars.rotation.y += dt * 0.008

    // 鼠标视差：镜头轻微跟随指针
    const kc = 1 - Math.exp(-dt * 2.5)
    this.camera.position.x += (this.pointer.x * 0.35 - this.camera.position.x) * kc
    this.camera.position.y += (this.pointer.y * 0.25 - this.camera.position.y) * kc
    this.camera.lookAt(0, 0, 0)

    this.composer.render()
  }

  #handleResize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    if (!width || !height) return
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.composer.setSize(width, height)
  }

  /** 生成绕球体的扁平粒子带 */
  #createParticleBand(count, radiusMin, radiusMax, thickness, color, size, opacity) {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = radiusMin + Math.random() * (radiusMax - radiusMin)
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = (Math.random() - 0.5) * thickness
      positions[i * 3 + 2] = Math.sin(angle) * radius
    }
    return this.#createPoints(positions, color, size, opacity)
  }

  /** 生成远景球壳星空 */
  #createStarShell(count, radiusMin, radiusMax, color, size, opacity) {
    const positions = new Float32Array(count * 3)
    const direction = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      direction.randomDirection()
      const radius = radiusMin + Math.random() * (radiusMax - radiusMin)
      positions[i * 3] = direction.x * radius
      positions[i * 3 + 1] = direction.y * radius
      positions[i * 3 + 2] = direction.z * radius
    }
    return this.#createPoints(positions, color, size, opacity)
  }

  #createPoints(positions, color, size, opacity) {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      color,
      size,
      opacity,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    return new THREE.Points(geometry, material)
  }
}
