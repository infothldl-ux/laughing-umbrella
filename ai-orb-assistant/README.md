# AI Orb Assistant

网页端 AI 实时语音助手 —— 页面中央是一个 3D 发光球体，用户将可以通过语音与 AI 实时交流。

> **当前进度：第一阶段（基础架构）已完成。AI / 语音识别 / 语音合成尚未接入，相关接口已预留。**

![tech](https://img.shields.io/badge/React-19-61dafb) ![tech](https://img.shields.io/badge/Vite-6-646cff) ![tech](https://img.shields.io/badge/Three.js-r178-000000) ![tech](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8) ![tech](https://img.shields.io/badge/Express-5-259dff)

---

## 技术栈

| 端 | 技术 |
| --- | --- |
| 前端 | React 19 · Vite 6 · Three.js（原生，含 Bloom 后期泛光）· Tailwind CSS 4 |
| 后端 | Node.js · Express 5 |
| 工程 | npm workspaces（一次 `npm install` 装完前后端）· concurrently（一条命令同时启动前后端） |

## 项目结构

```
ai-orb-assistant/
├── package.json              # 根工作区：workspaces + 一键启动脚本
├── .gitignore
├── README.md
│
├── client/                   # 前端（React + Vite + Three.js + Tailwind）
│   ├── package.json
│   ├── vite.config.js        # Vite 配置：/api 代理到后端 3001
│   ├── .env.example          # 前端环境变量模板
│   ├── index.html
│   ├── public/
│   │   └── orb.svg           # 网站图标
│   └── src/
│       ├── main.jsx          # 入口
│       ├── index.css         # Tailwind 入口 + 全局样式 + WebGL 降级样式
│       ├── App.jsx           # 主界面：状态机 + 布局
│       ├── components/
│       │   ├── Orb.jsx       # 3D 球体组件（Three.js 的 React 封装）
│       │   ├── StatusBadge.jsx  # 状态徽标（待机/聆听/思考/回答）
│       │   └── ControlBar.jsx   # 控制栏：状态按钮 + 麦克风 + 文本输入
│       ├── three/
│       │   ├── OrbScene.js   # 核心：Three.js 场景封装（球体/光晕/粒子/Bloom）
│       │   └── shaders.js    # GLSL 着色器（Simplex 噪声形变 + 菲涅尔发光）
│       └── lib/
│           ├── api.js        # 后端 API 统一封装
│           └── orbStates.js  # 状态机 UI 元信息
│
└── server/                   # 后端（Node.js + Express）
    ├── package.json
    ├── .env.example          # 后端环境变量模板（含 AI Key 预留位）
    └── src/
        ├── index.js          # 入口（http server，预留 WebSocket 挂载点）
        ├── app.js            # Express 应用组装（中间件/路由注册）
        ├── config.js         # 环境变量统一读取（全部有默认值）
        ├── routes/
        │   ├── health.js     # GET  /api/health            健康检查
        │   ├── chat.js       # POST /api/chat              文本对话（占位回显）
        │   └── voice.js      # POST /api/voice/transcribe  语音识别（预留 501）
        │                     # POST /api/voice/synthesize  语音合成（预留 501）
        └── middleware/
            └── errorHandler.js  # 404 与统一错误处理
```

## 环境要求

- Node.js ≥ 18.18（推荐 20 或 22 LTS）
- npm ≥ 9

## 快速开始

```bash
# 1. 进入项目目录
cd ai-orb-assistant

# 2. 安装依赖（workspaces 会同时装好 client 和 server）
npm install

# 3. 同时启动前后端
npm run dev
```

启动后：

- 前端页面: <http://localhost:5173>
- 后端 API: <http://localhost:3001/api>（浏览器打开可看到接口总览）

> 环境变量均有默认值，**不需要任何配置即可运行**。如需自定义端口等，
> 复制模板后修改：`cp server/.env.example server/.env`、`cp client/.env.example client/.env`。

## 可用脚本（在 ai-orb-assistant 目录下执行）

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 同时启动后端（3001）和前端（5173），开发模式均带热更新 |
| `npm run dev:client` | 只启动前端 |
| `npm run dev:server` | 只启动后端（`node --watch`） |
| `npm run build` | 构建前端生产包（输出到 `client/dist/`） |
| `npm run start` | 以生产模式启动后端 |

## 环境变量

### server/.env

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3001` | 后端监听端口 |
| `CLIENT_ORIGIN` | `http://localhost:5173` | 允许跨域的前端地址 |
| `ANTHROPIC_API_KEY` | 空 | **第二阶段**：大模型 API Key 预留位 |

### client/.env

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | API 基础路径（开发环境由 Vite 代理到后端） |

## API 一览（第一阶段）

| 方法 | 路径 | 状态 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/health` | ✅ 可用 | 健康检查，前端启动时探测后端连通性 |
| POST | `/api/chat` | ✅ 占位 | 文本对话，当前直接回显；第二阶段接入大模型 |
| POST | `/api/voice/transcribe` | 🔒 预留 | 语音识别（STT），当前返回 501 |
| POST | `/api/voice/synthesize` | 🔒 预留 | 语音合成（TTS），当前返回 501 |

## 3D 球体说明

球体由原生 Three.js 实现（`src/three/OrbScene.js`），与 React 解耦：

- **核心球**：Icosahedron + 自定义着色器，3D Simplex 噪声驱动表面有机起伏，菲涅尔边缘发光
- **光晕**：背面渲染 + 加色混合的大气辉光
- **氛围**：环绕粒子带 + 远景星空 + UnrealBloom 泛光
- **交互**：鼠标视差、窗口自适应；WebGL 不可用时自动降级为 CSS 发光球

球体有四种状态，颜色与动感平滑过渡，未来由真实语音流程驱动：

| 状态 | 颜色 | 触发（第二阶段） |
| --- | --- | --- |
| `idle` 待机 | 蓝青色 | 无会话时 |
| `listening` 聆听 | 绿色 | 用户说话（麦克风输入） |
| `thinking` 思考 | 紫色 | 等待大模型响应 |
| `speaking` 回答 | 橙色 | TTS 播放中 |

`OrbScene.setLevel(0~1)` 已预留实时音量入口，接入麦克风后球体会随声音"呼吸"。

## 路线图

- [x] **第一阶段：基础架构**（本次）—— 项目骨架、3D 球体、状态机 UI、API 占位、环境变量
- [ ] 第二阶段：接入语音 —— 麦克风录音、STT、大模型对话（流式）、TTS 播放
- [ ] 第三阶段：实时化 —— WebSocket 双向流、打断（barge-in）、会话记忆
