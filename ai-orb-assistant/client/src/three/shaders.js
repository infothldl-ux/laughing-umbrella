/**
 * 球体着色器（GLSL）
 * - 核心顶点着色器：用 3D Simplex 噪声让球面产生有机起伏（"呼吸的能量体"效果）
 * - 核心片元着色器：菲涅尔边缘发光 + 噪声驱动的双色渐变
 * - 光晕着色器：经典"大气辉光"（背面渲染 + 加色混合）
 *
 * Simplex 噪声实现来自 Ashima Arts / Stefan Gustavson 的经典开源实现（MIT License）
 */

const simplexNoise3D = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

export const coreVertexShader = /* glsl */ `
uniform float uTime;
uniform float uDisplacement; // 表面起伏强度（随助手状态变化）
uniform float uLevel;        // 实时音量 0~1（第二阶段接入麦克风后驱动）

varying float vNoise;
varying vec3 vNormalW;
varying vec3 vViewDir;

${simplexNoise3D}

void main() {
  // 两层噪声：低频大起伏 + 高频细节
  float n1 = snoise(normal * 1.6 + vec3(0.0, uTime * 0.35, uTime * 0.2));
  float n2 = snoise(normal * 4.0 + vec3(uTime * 0.6)) * 0.35;
  float displacement = (n1 + n2) * (uDisplacement + uLevel * 0.3);

  vec3 newPosition = position + normal * displacement;
  vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);

  vNoise = n1;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPosition.xyz);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

export const coreFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uColorA; // 球体主色（深）
uniform vec3 uColorB; // 边缘发光色（亮）

varying float vNoise;
varying vec3 vNormalW;
varying vec3 vViewDir;

void main() {
  // 菲涅尔：视线越接近切线方向，边缘越亮
  float fresnel = pow(1.0 - clamp(dot(normalize(vNormalW), normalize(vViewDir)), 0.0, 1.0), 2.2);

  // 噪声驱动的双色渐变 + 边缘增亮
  float mixFactor = clamp(vNoise * 0.5 + 0.5, 0.0, 1.0);
  vec3 baseColor = mix(uColorA, uColorB, mixFactor * 0.45);
  vec3 color = baseColor + uColorB * fresnel * 1.1;

  // 轻微的整体明暗脉动
  color += uColorB * 0.05 * (0.5 + 0.5 * sin(uTime * 2.0));

  gl_FragColor = vec4(color, 1.0);
}
`

export const haloVertexShader = /* glsl */ `
varying vec3 vNormalView;

void main() {
  vNormalView = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const haloFragmentShader = /* glsl */ `
uniform vec3 uColor;

varying vec3 vNormalView;

void main() {
  // 经典大气辉光：越靠近球体轮廓越亮，向外逐渐消散
  float intensity = pow(0.58 - dot(vNormalView, vec3(0.0, 0.0, 1.0)), 3.0);
  gl_FragColor = vec4(uColor, 1.0) * intensity * 0.3;
}
`
