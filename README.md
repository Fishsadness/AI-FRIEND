# 小艾 · AI Friend Agent

> 具备"自主呼吸"能力的 AI 好友代理 — 被动回复、主动推送、Drift 探索三条链路闭环协同，打造有温度、有自主性的对话式 AI 伴侣。

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.104+-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## 项目简介

小艾是一个像朋友般陪伴的 AI 助手。与传统"一问一答"的聊天机器人不同，小艾具备**自主性**——不仅能被动回答你的提问，还能**主动推送**提醒与关怀，并在合适的时机**自主发起话题**，形成真正有温度的互动体验。

### 三条链路协同

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

### AI 技术栈

| 技术 | 应用位置 |
|------|---------|
| **RAG（检索增强生成）** | 被动回复链：检索记忆 → 增强 Prompt → LLM 生成 |
| **Embedding 向量检索** | 记忆系统语义搜索，余弦相似度 top-K 匹配 |
| **Multi-Chain Agent** | 三条链路协同调度，各司其职 |
| **Prompt Engineering** | 所有链路的 Prompt 构建，Persona 注入，上下文注入 |
| **加权打分模型** | 推送优先级（紧急性×0.35 + 重要性×0.30 + 偏好×0.20 + 反馈×0.15） |
| **LLM 摘要压缩** | 对话超过 50 轮自动压缩为要点摘要 |
| **规则提取** | 关键词匹配抽取事实/偏好/事件/待办 |

### 记忆系统

双存储架构，兼顾完整性与检索效率：

| 层级 | 存储方式 | 用途 |
|------|---------|------|
| 文本层 | JSON 文件 | 完整记忆内容、元数据、版本控制 |
| 向量层 | 余弦相似度检索 | 语义搜索，快速定位相关记忆 |

**记忆特性**：分类存储（事实/偏好/事件/待办）、置信度评估、自动压缩、隐私分级（normal/sensitive/confidential）、撤回删除。

### 主动推送优先级模型

```
优先级分数 = 紧急性 × 0.35 + 重要性 × 0.30 + 用户偏好 × 0.20 + 历史反馈 × 0.15
打扰成本   = 时间窗口 × 0.40 + 推送频次 × 0.35 + 场景 × 0.25

推送条件：优先级分数 > 打扰成本
```

模型通过收集用户接受/拒绝反馈持续学习。

### 插件系统

- 统一接口：继承 `BasePlugin`，实现 `execute(action, params)` 方法
- 注册中心：`PluginRegistry` 管理所有插件，按名称调用
- 内置插件：日历管理、天气查询

---

## 系统架构

```
┌──────────────────────────────────────────────────┐
│                  前端 (React 18 + TypeScript)      │
│  设计风格：Natural Organic 暖色自然风               │
│  布局：侧边栏 + 对话区，面板瀑布流                    │
│                                                    │
│  ┌──────────┐  ┌───────────────────────────────┐  │
│  │ 深棕侧边栏 │  │          对话区                │  │
│  │          │  │  ChatHeader · 链路指示器        │  │
│  │  导航    │  │  MessageList · 消息气泡         │  │
│  │  记忆    │  │  ChatInput · 输入框             │  │
│  │  插件    │  │                                │  │
│  │  推送    │  └───────────────────────────────┘  │
│  │  Token   │                                     │
│  │  设置    │  Zustand 状态管理                    │
│  │          │                                     │
│  │ 主题切换  │                                     │
│  │ 自动/浅/深│                                     │
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

### 演示模式

无需配置 API Key 即可体验：

```bash
python demo.py
```

---

## API 参考

### 对话

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/agent/message` | 发送消息 |
| `GET` | `/api/agent/push/check` | 检查待推送提醒 |
| `POST` | `/api/agent/push/feedback` | 推送反馈 |
| `GET` | `/api/agent/drift/check` | 检查 Drift 触发 |

### 记忆 & 插件 & 统计

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/agent/memory/{user_id}` | 查询记忆 |
| `DELETE` | `/api/agent/memory/{user_id}/{memory_id}` | 删除记忆 |
| `GET` | `/api/agent/plugins` | 插件列表 |
| `POST` | `/api/agent/plugin` | 调用插件 |
| `GET` | `/api/agent/token/usage` | Token 用量 |
| `POST` | `/api/agent/consent` | 隐私同意 |
| `DELETE` | `/api/agent/consent/{user_id}` | 撤回同意 |
| `GET` | `/status` | 系统状态 |



---

## Web 控制台

### 界面概览

```
┌──────────────┬───────────────────────────────────┐
│  深棕侧边栏   │           主对话区                  │
│              │  🌿 小艾 AI Friend                 │
│  ✨ 小艾     │  ────────────────────────────────  │
│  ─────────  │                                     │
│  💬 对话     │   用户消息 ──────────────────┐       │
│  🧠 记忆     │                    ┌─ AI 回复       │
│  🧩 插件     │   [被动回复] 标签    [+3 记忆]      │
│  🔔 推送     │                                     │
│  🪙 Token    │  ┌──────────────────────────────┐  │
│  ⚙ 设置      │  │ 给小艾发消息...      [发送]  │  │
│  ─────────  │  └──────────────────────────────┘  │
│  🌓 自动     │                                     │
│  ☀️ 浅色    │                                     │
│  🌙 深色     │                                     │
│  ─────────  │                                     │
│  🟢 在线     │                                     │
└──────────────┴───────────────────────────────────┘
```

### 设计风格：Natural Organic

整体采用温暖自然的有机风格：
- **大地色系**：深棕 (#5c4033)、暖米色 (#faf6f1)、鼠尾草绿 (#8b9d77)、暖棕褐 (#d4a373)
- **有机形状**：`rounded-organic` (2rem) 圆角、blob 形态 Logo
- **纸张纹理**：SVG 图案叠加背景
- **衬线字体**：Noto Serif SC 标题 + Noto Sans SC 正文
- **自然动画**：呼吸感、有机变形、叶片飘入

### 侧边栏功能模块

| 模块 | 功能 |
|------|------|
| **对话** | 默认视图，Markdown 渲染，AI 打字动画 |
| **记忆** | 搜索记忆、瀑布流卡片展示、按类型筛选、删除 |
| **插件** | 瀑布流插件卡片、展开执行操作、JSON 结果 |
| **推送** | 推送历史时间线、统计卡片、免打扰时段 |
| **Token** | 年月选择器、用量统计、SVG 柱状趋势图 |
| **设置** | Agent 人格、模型选择、隐私同意、数据导出 |

### 主题切换

侧边栏底部提供三档主题切换：
- **自动** — 跟随操作系统浅色/深色模式
- **浅色** — 强制暖米色背景
- **深色** — 强制深棕背景

切换即时生效，所有组件无缝过渡。

### 前端技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 3 |
| 状态管理 | Zustand |
| 图标 | Lucide React |
| Markdown | react-markdown |

---

## 配置说明

所有配置集中在 `config.py`：

### LLM 模型

```python
@dataclass
class LLMConfig:
    provider: str = "deepseek"           # openai / anthropic / deepseek / local
    api_key: str = ""                    # 空则使用模拟模式
    api_base: str = "https://api.deepseek.com"
    model: str = "deepseek-v4-pro"
    max_tokens: int = 2048
    temperature: float = 0.7
    embedding_model: str = "text-embedding-3-small"
```

### 记忆系统

```python
class MemoryConfig:
    max_context_memories: int = 10       # 单次检索最大记忆数
    compression_threshold: int = 50      # 触发压缩的对话轮数
    compression_keep_recent: int = 20    # 压缩保留最近轮数
    encryption_enabled: bool = False     # 加密存储
```

### 主动推送

```python
class PushConfig:
    max_daily_pushes: int = 10           # 每日最大推送
    min_interval_seconds: int = 300      # 最小间隔（秒）
    quiet_hours_start: int = 22          # 免打扰开始
    quiet_hours_end: int = 8             # 免打扰结束
    default_cost_threshold: float = 0.5  # 默认成本阈值
```

### Drift 探索

```python
class DriftConfig:
    idle_threshold_seconds: int = 3600   # 静默触发阈值（秒）
    cooldown_seconds: int = 7200         # 冷却时间（秒）
    max_daily_drifts: int = 5            # 每日最大次数
    confidence_threshold: float = 0.6    # 新信息写入置信度
```

---

## 项目结构

```
ai-friend-agent/
├── main.py                  # 入口 · AgentCore 主循环 + FastAPI
├── config.py                # 全部配置
├── demo.py                  # 演示脚本（无需 API Key）
├── requirements.txt         # Python 依赖
├── README.md
├── 运行指南.md
│
├── chains/                  # 三条链路
│   ├── passive_chain.py     # 被动回复：RAG 检索 + 生成 + 写入记忆
│   ├── active_chain.py      # 主动推送：候选收集 + 优先级 + 成本函数
│   └── drift_chain.py       # Drift 探索：静默检测 + 话题 + 安全审查
│
├── memory/                  # 记忆系统
│   ├── memory_store.py      # 核心存储：文本层 + 向量层
│   ├── vector_store.py      # 余弦相似度向量检索
│   └── compressor.py        # LLM 对话摘要压缩
│
├── models/                  # 模型
│   ├── llm_client.py        # LLM 客户端（OpenAI 兼容 / 模拟模式）
│   └── priority_model.py    # 推送优先级：打分 + 成本 + 反馈学习
│
├── plugins/                 # 插件系统
│   ├── base_plugin.py       # 插件基类 + 注册中心
│   ├── calendar_plugin.py   # 日历插件
│   └── weather_plugin.py    # 天气插件
│
├── api/
│   └── routes.py            # FastAPI 路由（全部接口）
│
├── workspace/
│   └── session.py           # 会话工作区
│
├── utils/
│   ├── logger.py            # 防篡改审计日志
│   └── security.py          # 隐私管理
│
├── web/                     # 前端 (React + TypeScript + Tailwind)
│   ├── src/
│   │   ├── api/index.ts         # API 服务层
│   │   ├── store/index.ts       # Zustand 全局状态
│   │   ├── types/index.ts       # 类型定义
│   │   ├── hooks/useTheme.ts    # 主题检测 + 手动切换
│   │   ├── components/
│   │   │   ├── chat/            # ChatHeader · MessageList · MessageBubble · ChatInput
│   │   │   ├── sidebar/         # Sidebar · SidebarNav（含主题切换）
│   │   │   ├── panels/          # Memory/Plugin/Push/Token/Settings 面板
│   │   │   └── ui/              # Dropdown 通用组件
│   │   ├── App.tsx              # 主页面
│   │   ├── main.tsx
│   │   └── index.css            # 全局样式 + 纹理 + 瀑布流
│   ├── tailwind.config.js       # 自定义色板 + 字体 + 动画
│   └── package.json
│
└── data/                    # 运行时生成
    ├── memories/            # 记忆 JSON
    ├── vectors/             # 向量数据
    └── logs/                # 日志
```

---

<p align="center">
  <sub>Made with care for better AI companionship 🌿</sub>
</p>
