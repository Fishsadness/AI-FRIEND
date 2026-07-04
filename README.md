# 小艾 · AI Friend Agent

> 类人"自主呼吸"AI 好友代理 — 被动回复 · 主动推送 · Drift 探索，三条链路闭环协同，打造有温度、有自主性的对话式 AI 伴侣。

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.104+-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## 目录

- [项目简介](#项目简介)
- [核心设计](#核心设计)
- [系统架构](#系统架构)
- [快速开始](#快速开始)
- [API 参考](#api-参考)
- [Web 控制台](#web-控制台)
- [配置说明](#配置说明)
- [项目结构](#项目结构)

---

## 项目简介

小艾是一个像朋友般陪伴的 AI 助手。与传统"一问一答"的聊天机器人不同，小艾具备**自主性**——不仅能被动回答用户提问，还能**主动推送**提醒与关怀，并在合适的时机**自主发起话题**，形成真正有温度的互动体验。

三条链路协同工作，覆盖了人与 AI 之间最自然的三种互动模式：

| 链路 | 触发方式 | 做什么 | 类比 |
|------|---------|--------|------|
| **被动回复链** | 用户发送消息 | 检索记忆 → 生成个性化回复 → 提取关键信息写入记忆 | 朋友即时回应你的话 |
| **主动推送链** | 定时器 / 事件规则 | 收集候选 → 优先级打分 → 成本函数判断 → 推送提醒 | 朋友主动关心你 |
| **Drift 探索链** | 对话静默超时 | 选择话题 → 安全审查 → 发起对话 → 收集新信息 | 朋友主动找话题聊天 |

### 适用场景

| 场景 | 角色 | 核心能力 |
|------|------|---------|
| 大学生助学 | 学习伙伴 | 考试提醒、随堂答疑、作息监督 |
| 职场白领 | 工作助理 | 会议提醒、任务推送、压力疏导 |
| 老年人陪伴 | 生活伴侣 | 用药提醒、体检通知、情感陪伴 |
| 慢性病患者 | 健康管家 | 血糖记录、异常提醒、习惯鼓励 |
| 语言学习者 | 练习伙伴 | 话题对话、发音纠正、进度检查 |
| 心理支持 | 倾听者 | 情绪监测、安慰鼓励、专业转介 |
| 家庭助理 | 家务管家 | 采购清单、孩子日程、偏好记录 |
| 创业者 | 项目助手 | 任务拆分、进度推送、方案讨论 |

---

## 核心设计

### 三条链路协同

```
被动回复链 (Passive)          主动推送链 (Active)           Drift 探索链 (Drift)
─────────────────────        ─────────────────────        ─────────────────────
触发：用户发送消息             触发：定时器 / 事件 / 规则     触发：对话静默超时
流程：检索记忆 → 生成回复      流程：收集候选 → 优先级打分    流程：选择话题 → 安全审查
      → 提取关键信息 → 写入记忆       → 成本函数 → 推送提醒          → 发起对话 → 收集新信息
响应：即时回复                 响应：主动提醒                 响应：探索性话题
优先级：最高                   优先级：中                     优先级：低
```

**协同规则**：
- 用户主动交互期间，推送和 Drift 自动暂停或降级
- 免打扰时段（22:00–08:00）屏蔽非紧急提醒
- 推送频率受每日上限（10次）和最小间隔（5分钟）约束
- Drift 有冷却时间（2小时）和每日上限（5次）

### 记忆系统

双存储架构，兼顾完整性与检索效率：

| 层级 | 存储方式 | 用途 |
|------|---------|------|
| 文本层 | JSON 文件 | 完整记忆内容、元数据、版本控制 |
| 向量层 | 余弦相似度检索 | 语义搜索，快速定位相关记忆 |

**记忆特性**：
- **分类存储**：事实 (fact) / 偏好 (preference) / 事件 (event) / 待办 (todo)
- **置信度评估**：低置信度记忆先存为"待确认"，后续确认后提升
- **自动压缩**：对话超过 50 轮自动生成摘要存档
- **隐私分级**：normal / sensitive / confidential，支持加密存储
- **撤回删除**：用户撤回同意后，所有记忆一并删除

### 主动推送优先级模型

```
优先级分数 = 紧急性 × 0.35 + 重要性 × 0.30 + 用户偏好 × 0.20 + 历史反馈 × 0.15
打扰成本   = 时间窗口 × 0.40 + 推送频次 × 0.35 + 场景 × 0.25

推送条件：优先级分数 > 打扰成本
```

模型通过收集用户反馈（接受/拒绝）持续学习，逐步贴合用户期望。

### 插件系统

- **统一接口**：继承 `BasePlugin`，实现 `execute(action, params)` 方法
- **注册中心**：`PluginRegistry` 管理所有插件，按名称调用
- **权限模型**：读写记忆、访问日历、发送通知、网络请求等权限控制
- **内置插件**：日历管理 (Calendar)、天气查询 (Weather)

---

## 系统架构

```
┌──────────────────────────────────────────────────┐
│                  前端 (React 18)                   │
│  ┌──────────┐  ┌───────────────────────────────┐ │
│  │  侧边栏   │  │          对话区                │ │
│  │          │  │  ChatHeader · 链路指示器        │ │
│  │  导航    │  │  MessageList · 消息气泡         │ │
│  │  记忆    │  │  ChatInput · 输入框             │ │
│  │  插件    │  │                                │ │
│  │  推送    │  └───────────────────────────────┘ │
│  │  Token   │                                     │
│  │  设置    │  Zustand 状态管理                    │
│  └──────────┘                                     │
└──────────────────────┬───────────────────────────┘
                       │ REST API
┌──────────────────────┴───────────────────────────┐
│                 后端 (FastAPI)                     │
│                                                   │
│  ┌─────────────────────────────────────┐         │
│  │           AgentCore 主循环           │         │
│  │  ┌──────────┐┌──────────┐┌───────┐ │         │
│  │  │Passive   ││ Active   ││ Drift │ │         │
│  │  │Chain     ││ Chain    ││ Chain │ │         │
│  │  └──────────┘└──────────┘└───────┘ │         │
│  └─────────────────────────────────────┘         │
│                                                   │
│  ┌───────────────┐  ┌──────────────────┐        │
│  │ MemoryStore   │  │ PluginRegistry   │        │
│  │ 文本层+向量层  │  │ Calendar·Weather │        │
│  └───────────────┘  └──────────────────┘        │
│                                                   │
│  ┌───────────────┐  ┌──────────────────┐        │
│  │PrivacyManager │  │  AuditLogger     │        │
│  │ 同意/加密/撤回 │  │  防篡改审计日志   │        │
│  └───────────────┘  └──────────────────┘        │
└──────────────────────────────────────────────────┘
```

---

## 快速开始

### 环境要求

- **Python** 3.9+
- **Node.js** 18+
- **npm** 9+

### 安装

```bash
# 进入项目目录
cd ai-friend-agent

# 安装 Python 依赖
pip install -r requirements.txt

# 安装前端依赖
cd web && npm install && cd ..
```

### 启动

```bash
# 终端 1 — 启动后端
python main.py
# 后端运行在 http://localhost:8001
# API 文档：http://localhost:8001/docs

# 终端 2 — 启动前端
cd web && npm run dev
# 前端运行在 http://localhost:5173
```

### 演示模式

无需配置 API Key 即可体验三条链路协同：

```bash
python demo.py
```

演示模式内置模拟回复，无需联网，可直接体验被动回复、主动推送和 Drift 探索的完整流程。

---

## API 参考

### 对话

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/agent/message` | 发送消息，触发被动链路 |
| `GET` | `/api/agent/push/check` | 检查是否有待推送提醒 |
| `POST` | `/api/agent/push/feedback` | 记录推送反馈（接受/拒绝） |
| `GET` | `/api/agent/drift/check` | 检查是否应触发 Drift 探索 |

### 记忆

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/agent/memory/{user_id}` | 查询记忆，支持关键词搜索 |
| `DELETE` | `/api/agent/memory/{user_id}/{memory_id}` | 删除单条记忆 |

### 隐私

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/agent/consent` | 记录用户隐私同意 |
| `DELETE` | `/api/agent/consent/{user_id}` | 撤回同意（删除所有记忆） |

### 插件

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/agent/plugins` | 列出所有已注册插件 |
| `POST` | `/api/agent/plugin` | 调用指定插件 |

### 统计

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/agent/token/usage` | 按月查询 Token 用量 |
| `GET` | `/api/agent/audit/{user_id}` | 查询审计日志 |
| `GET` | `/status` | 系统运行状态 |

### 调用示例

```bash
# 发送消息
curl -X POST http://localhost:8001/api/agent/message \
  -H "Content-Type: application/json" \
  -d '{"user_id":"u1","message":"我下周有面试，需要准备"}'

# 响应
{
  "reply": "好的，面试很重要呢！我会在面试前提醒您...",
  "chain": "passive",
  "memory_writes": [{"type": "event", "content": "面试准备", "id": "mem_xxx"}],
  "session_id": "ses_xxx",
  "timestamp": "2026-07-04T18:00:00"
}
```

---

## Web 控制台

ChatGPT/Claude 风格的对话式 Web 界面，侧边栏模块化管理所有功能。

### 界面布局

```
┌──────────────┬───────────────────────────────────┐
│  深色侧边栏   │           主对话区                  │
│              │  ┌ 小艾 ── ●被动 ●主动 ●Drift ──┐  │
│  ✨ 小艾     │  └───────────────────────────────┘  │
│  ─────────  │                                     │
│  💬 对话     │   用户消息 ──────────────────┐       │
│  🧠 记忆     │                    ┌─ AI 回复       │
│  🧩 插件     │   [被动回复] 标签    [+3 记忆]      │
│  🔔 推送     │                                     │
│  🪙 Token    │  ┌──────────────────────────────┐  │
│  ⚙ 设置      │  │ 输入消息...          [发送]  │  │
│  ─────────  │  └──────────────────────────────┘  │
│  🟢 在线     │                                     │
└──────────────┴───────────────────────────────────┘
```

### 侧边栏功能模块

| 模块 | 功能 |
|------|------|
| **对话** | 默认视图，显示聊天消息流，支持 Markdown 渲染 |
| **记忆** | 搜索记忆、按类型筛选、查看置信度、删除记忆 |
| **插件** | 已注册插件列表、执行操作、查看 JSON 返回结果 |
| **推送** | 推送历史时间线、推送统计、免打扰时段管理 |
| **Token** | 年月选择器、总用量/输入/输出统计卡片、SVG 每日趋势柱状图 |
| **设置** | Agent 人格编辑、模型选择、隐私同意、数据导出 |

### 主题切换

界面自动跟随操作系统深色/浅色模式。当系统主题变化时，所有组件（消息气泡、侧边栏、输入框、面板）无缝切换配色。

### 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 3 |
| 状态管理 | Zustand |
| 图标 | Lucide React |
| 路由 | React Router DOM v7 |
| Markdown | react-markdown |

---

## 配置说明

所有配置集中在 `config.py`，按模块分为五个配置类。

### LLM 模型

```python
@dataclass
class LLMConfig:
    provider: str = "deepseek"           # openai / anthropic / local
    api_key: str = ""                    # API 密钥，空则使用模拟模式
    api_base: str = "https://api.deepseek.com"
    model: str = "deepseek-v4-pro"
    max_tokens: int = 2048
    temperature: float = 0.7
    embedding_model: str = "text-embedding-3-small"
```

支持所有兼容 OpenAI 接口的服务：OpenAI、DeepSeek、通义千问、智谱 AI 等。

### 记忆系统

```python
class MemoryConfig:
    max_context_memories: int = 10       # 每次检索最大记忆数
    compression_threshold: int = 50      # 对话轮数超过此值触发压缩
    compression_keep_recent: int = 20    # 压缩时保留最近轮数
    encryption_enabled: bool = False     # 是否加密存储
```

### 主动推送

```python
class PushConfig:
    max_daily_pushes: int = 10           # 每日最大推送次数
    min_interval_seconds: int = 300      # 最小推送间隔（秒）
    quiet_hours_start: int = 22          # 免打扰开始（时）
    quiet_hours_end: int = 8             # 免打扰结束（时）
    default_cost_threshold: float = 0.5  # 默认成本阈值
```

### Drift 探索

```python
class DriftConfig:
    idle_threshold_seconds: int = 3600   # 静默多久触发（秒）
    cooldown_seconds: int = 7200         # 两次 Drift 最小间隔
    max_daily_drifts: int = 5            # 每日最大 Drift 次数
    confidence_threshold: float = 0.6    # 新信息写入置信度阈值
```

### Agent 人格

```python
class AgentConfig:
    name: str = "小艾"
    persona: str = "你是一个温暖、善解人意的AI好友，像真正的朋友一样陪伴用户。"
    tone: str = "友好、自然、共情"
    traits: list = ["善于倾听", "主动关怀", "幽默风趣", "知识渊博"]
```

---

## 项目结构

```
ai-friend-agent/
├── main.py                  # 入口 · AgentCore 主循环 + FastAPI 启动
├── config.py                # 全部配置（LLM/记忆/推送/Drift/Agent）
├── demo.py                  # 演示脚本（无需 API Key）
├── requirements.txt         # Python 依赖
├── README.md                # 本文件
├── 运行指南.md              # 详细运行指南
│
├── chains/                  # 三条链路
│   ├── passive_chain.py     # 被动回复：用户输入 → 记忆检索 → 生成回复 → 写入记忆
│   ├── active_chain.py      # 主动推送：收集候选 → 优先级打分 → 成本函数 → 推送
│   └── drift_chain.py       # Drift 探索：静默检测 → 话题选择 → 安全审查 → 发起对话
│
├── memory/                  # 记忆系统
│   ├── memory_store.py      # 核心存储：文本层 + 向量层，版本控制，隐私分级
│   ├── vector_store.py      # 简易向量存储：余弦相似度检索
│   └── compressor.py        # 对话压缩：摘要生成与关键信息提取
│
├── models/                  # 模型
│   ├── llm_client.py        # LLM 客户端：OpenAI 兼容 API / 模拟模式
│   └── priority_model.py    # 推送优先级：打分 + 成本函数 + 反馈学习
│
├── plugins/                 # 插件系统
│   ├── base_plugin.py       # 插件基类 + 注册中心 + 权限模型
│   ├── calendar_plugin.py   # 日历插件：事件管理、提醒检查
│   └── weather_plugin.py    # 天气插件：天气查询、活动建议
│
├── api/                     # API 层
│   └── routes.py            # FastAPI 路由：全部接口，CORS 已配置
│
├── workspace/               # 会话
│   └── session.py           # 会话工作区：对话历史、临时变量、子任务
│
├── utils/                   # 工具
│   ├── logger.py            # 审计日志：防篡改追加写入
│   └── security.py          # 隐私管理：同意/撤回/加密/脱敏
│
├── web/                     # 前端 (React + TypeScript + Tailwind)
│   ├── src/
│   │   ├── api/index.ts         # API 服务层
│   │   ├── store/index.ts       # Zustand 全局状态
│   │   ├── types/index.ts       # TypeScript 类型定义
│   │   ├── hooks/useTheme.ts    # 系统主题检测 Hook
│   │   ├── components/
│   │   │   ├── chat/            # ChatHeader · MessageList · MessageBubble · ChatInput
│   │   │   ├── sidebar/         # Sidebar · SidebarNav
│   │   │   ├── panels/          # MemoryPanel · PluginPanel · PushPanel · TokenPanel · SettingsPanel
│   │   │   └── ui/              # Dropdown 通用组件
│   │   ├── App.tsx              # 主页面
│   │   ├── main.tsx             # 入口
│   │   └── index.css            # 全局样式 + 深色模式
│   ├── vite.config.ts           # Vite 配置 + API 代理
│   └── package.json
│
└── data/                    # 数据存储（运行时生成）
    ├── memories/            # 记忆 JSON 文件
    ├── vectors/             # 向量数据
    └── logs/                # 应用日志 + 审计日志
```

---

<p align="center">
  <sub>Made with care for better AI companionship</sub>
</p>
