"""
AI好友代理 - 配置模块
"""

from dataclasses import dataclass, field
from typing import Optional
from pathlib import Path

BASE_DIR = Path(__file__).parent


@dataclass
class LLMConfig:
    """LLM模型配置"""
    provider: str = "deepseek"           # openai / anthropic / local
    api_key: str = ""
    api_base: str = "https://api.deepseek.com"
    model: str = "deepseek-v4-pro"
    max_tokens: int = 2048
    temperature: float = 0.7
    embedding_model: str = "text-embedding-3-small"


@dataclass
class MemoryConfig:
    """记忆系统配置"""
    text_store_path: str = str(BASE_DIR / "data" / "memories")
    vector_store_path: str = str(BASE_DIR / "data" / "vectors")
    vector_dim: int = 1536
    max_context_memories: int = 10
    compression_threshold: int = 50       # 对话轮数超过此值触发摘要压缩
    compression_keep_recent: int = 20     # 压缩时保留最近N轮
    versioning_enabled: bool = True
    encryption_enabled: bool = False
    encryption_key: str = ""


@dataclass
class PushConfig:
    """主动推送配置"""
    max_daily_pushes: int = 10
    min_interval_seconds: int = 300       # 两次推送最小间隔
    quiet_hours_start: int = 22           # 免打扰开始时间
    quiet_hours_end: int = 8              # 免打扰结束时间
    default_cost_threshold: float = 0.5   # 成本函数阈值
    priority_weights: dict = field(default_factory=lambda: {
        "urgency": 0.35,
        "importance": 0.30,
        "user_preference": 0.20,
        "history_feedback": 0.15
    })
    cost_weights: dict = field(default_factory=lambda: {
        "time_window": 0.4,
        "frequency": 0.35,
        "scene": 0.25
    })


@dataclass
class DriftConfig:
    """Drift探索配置"""
    idle_threshold_seconds: int = 3600    # 静默多久触发Drift
    cooldown_seconds: int = 7200          # 两次Drift最小间隔
    max_daily_drifts: int = 5
    confidence_threshold: float = 0.6     # 新信息写入置信度阈值
    forbidden_topics: list = field(default_factory=lambda: [
        "政治敏感", "违法犯罪", "成人内容", "暴力"
    ])


@dataclass
class AgentConfig:
    """Agent人格配置"""
    name: str = "小艾"
    persona: str = "你是一个温暖、善解人意的AI好友，像真正的朋友一样陪伴用户。"
    tone: str = "友好、自然、共情"
    traits: list = field(default_factory=lambda: [
        "善于倾听", "主动关怀", "幽默风趣", "知识渊博"
    ])


@dataclass
class AppConfig:
    """应用总配置"""
    llm: LLMConfig = field(default_factory=LLMConfig)
    memory: MemoryConfig = field(default_factory=MemoryConfig)
    push: PushConfig = field(default_factory=PushConfig)
    drift: DriftConfig = field(default_factory=DriftConfig)
    agent: AgentConfig = field(default_factory=AgentConfig)
    api_host: str = "0.0.0.0"
    api_port: int = 8001
    log_level: str = "INFO"
    log_dir: str = str(BASE_DIR / "data" / "logs")
    audit_log_enabled: bool = True
    debug: bool = False


# 全局配置实例
config = AppConfig()