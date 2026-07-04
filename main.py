"""
AI好友代理 - 主入口
文件驱动的主循环，协调三条链路、记忆系统、插件和Workspace。
"""
import uuid
import logging
from datetime import datetime
from typing import Optional

from config import config
from models.llm_client import LLMClient
from memory.memory_store import MemoryStore
from chains.passive_chain import PassiveChain
from chains.active_chain import ActiveChain
from chains.drift_chain import DriftChain
from workspace.session import SessionWorkspace
from plugins.base_plugin import PluginRegistry
from plugins.calendar_plugin import CalendarPlugin
from plugins.weather_plugin import WeatherPlugin
from utils.logger import AuditLogger, setup_logging
from utils.security import PrivacyManager


class AgentCore:
    """
    AI好友代理核心 - 文件驱动的主循环。
    
    协调三条链路：
    - 被动链路：用户输入 → 记忆检索 → 生成回复 → 写入记忆
    - 主动链路：定时检查 → 优先级评估 → 成本函数 → 推送提醒
    - Drift链路：静默检测 → 话题选择 → 安全审查 → 发起对话
    
    管理：
    - 记忆系统（双存储）
    - 会话工作区
    - 插件注册中心
    - 隐私与审计
    """
    
    def __init__(self, cfg=None):
        self.cfg = cfg or config
        
        # 初始化日志
        setup_logging()
        self.logger = logging.getLogger("agent_core")
        
        # 初始化LLM客户端
        self.llm = LLMClient(self.cfg.llm)
        
        # 初始化记忆系统
        self.memory = MemoryStore(self.llm)
        self.memory.set_embedding_fn(self.llm.embed)
        
        # 初始化隐私管理器
        self.privacy = PrivacyManager()
        
        # 初始化审计日志
        self.audit_logger = AuditLogger()
        
        # 初始化插件注册中心
        self.plugin_registry = PluginRegistry()
        self._register_default_plugins()
        
        # 初始化三条链路
        self.passive_chain = PassiveChain(self.llm, self.memory, self.cfg.agent)
        self.active_chain = ActiveChain(self.llm, self.memory, self.cfg.agent)
        self.drift_chain = DriftChain(self.llm, self.memory, self.cfg.agent)
        
        # 会话工作区管理
        self._workspaces: dict[str, SessionWorkspace] = {}  # user_id -> workspace
        
        # Agent配置
        self.agent_config = self.cfg.agent
        
        self.logger.info(f"AgentCore初始化完成 - {self.agent_config.name} 已就绪")
    
    # ── 主循环事件处理 ──
    
    def process_user_message(self, user_id: str, message: str,
                             session_id: str = "") -> dict:
        """
        处理用户消息 - 被动链路。
        这是主入口，用户每次输入都会触发此方法。
        """
        # 检查隐私同意
        if not self.privacy.has_consent(user_id):
            return {
                "reply": "在使用之前，请先同意我们的隐私政策。您的数据将受到严格保护。",
                "chain": "system",
                "memory_writes": [],
                "timestamp": datetime.now().isoformat()
            }
        
        # 获取或创建工作区
        workspace = self._get_or_create_workspace(user_id, session_id)
        
        # 添加用户消息
        workspace.add_message("user", message)
        
        # 处理被动链路
        result = self.passive_chain.process(
            user_id=user_id,
            message=message,
            session_id=workspace.session_id,
            conversation_history=workspace.get_recent_history()
        )
        
        # 添加AI回复
        workspace.add_message("assistant", result["reply"])
        
        # 压缩对话历史（如需要）
        if workspace.message_count() > self.cfg.memory.compression_threshold:
            summary = self.memory.compress_and_archive(
                user_id, workspace.get_recent_history()
            )
            if summary:
                self.logger.info(f"对话历史已压缩，用户: {user_id}")
        
        # 审计日志
        self.audit_logger.log_conversation(
            user_id=user_id,
            session_id=workspace.session_id,
            chain="passive",
            input_text=message,
            output_text=result["reply"],
            memory_ids=[w.get("id") for w in result.get("memory_writes", [])]
        )
        
        self.logger.info(f"被动链路处理完成 - 用户: {user_id}, 会话: {workspace.session_id}")
        
        return {
            **result,
            "session_id": workspace.session_id
        }
    
    def process_active_push(self, user_id: str) -> Optional[dict]:
        """
        处理主动推送 - 主动链路。
        由定时器触发，检查是否需要推送提醒。
        """
        if not self.privacy.has_consent(user_id):
            return None
        
        result = self.active_chain.evaluate_and_push(user_id)
        
        if result:
            workspace = self._get_or_create_workspace(user_id)
            workspace.add_message("assistant", result["message"])
            
            # 审计日志
            self.audit_logger.log_push_decision(
                user_id=user_id,
                push_type=result["push_type"],
                priority_score=result["priority_score"],
                cost_score=result["cost_score"],
                pushed=True,
                message=result["message"]
            )
            
            self.logger.info(f"主动推送触发 - 用户: {user_id}, 类型: {result['push_type']}")
        
        return result
    
    def process_drift(self, user_id: str,
                      last_interaction: datetime = None) -> Optional[dict]:
        """
        处理Drift探索 - Drift链路。
        在对话静默时主动发起话题。
        """
        if not self.privacy.has_consent(user_id):
            return None
        
        if last_interaction is None:
            workspace = self._get_or_create_workspace(user_id)
            last_interaction = datetime.fromisoformat(workspace.updated_at)
        
        workspace = self._get_or_create_workspace(user_id)
        
        result = self.drift_chain.evaluate_and_drift(
            user_id=user_id,
            last_interaction_time=last_interaction,
            conversation_history=workspace.get_recent_history()
        )
        
        if result:
            workspace.add_message("assistant", result["message"])
            
            self.audit_logger.log_conversation(
                user_id=user_id,
                session_id=workspace.session_id,
                chain="drift",
                input_text=f"[Drift: {result['topic']}]",
                output_text=result["message"]
            )
            
            self.logger.info(f"Drift探索触发 - 用户: {user_id}, 话题: {result['topic']}")
        
        return result
    
    def process_drift_response(self, user_id: str, message: str,
                               drift_topic: str) -> dict:
        """
        处理用户对Drift话题的回复。
        收集新信息并写入记忆。
        """
        # 提取新信息
        memory_writes = self.drift_chain.process_new_info(
            user_id, message, drift_topic
        )
        
        # 生成回复
        reply = self.passive_chain.handle_quick_reply(user_id, message)
        
        workspace = self._get_or_create_workspace(user_id)
        workspace.add_message("user", message)
        workspace.add_message("assistant", reply)
        
        return {
            "reply": reply,
            "chain": "drift",
            "memory_writes": memory_writes,
            "timestamp": datetime.now().isoformat()
        }
    
    # ── 工作区管理 ──
    
    def _get_or_create_workspace(self, user_id: str,
                                 session_id: str = "") -> SessionWorkspace:
        """获取或创建会话工作区"""
        if user_id in self._workspaces and self._workspaces[user_id].is_active:
            return self._workspaces[user_id]
        
        if not session_id:
            session_id = f"ses_{uuid.uuid4().hex[:8]}"
        
        workspace = SessionWorkspace(
            session_id=session_id,
            user_id=user_id
        )
        self._workspaces[user_id] = workspace
        return workspace
    
    def get_workspace(self, user_id: str) -> Optional[SessionWorkspace]:
        """获取用户工作区"""
        return self._workspaces.get(user_id)
    
    def close_workspace(self, user_id: str) -> Optional[str]:
        """关闭工作区，生成摘要并写入记忆"""
        workspace = self._workspaces.get(user_id)
        if not workspace:
            return None
        
        # 生成摘要
        summary = workspace.to_summary()
        if summary:
            self.memory.add_memory(
                user_id=user_id,
                content=summary,
                memory_type="conversation_summary",
                source="system"
            )
        
        workspace.close()
        return summary
    
    # ── 插件管理 ──
    
    def _register_default_plugins(self):
        """注册默认插件"""
        self.plugin_registry.register(CalendarPlugin())
        self.plugin_registry.register(WeatherPlugin())
        self.logger.info("默认插件已注册")
    
    # ── 系统控制 ──
    
    def run_event_loop(self):
        """
        主事件循环（简化版）。
        实际部署中应使用异步框架或消息队列。
        """
        self.logger.info(f"{self.agent_config.name} 主循环启动")
        self.logger.info("等待事件... (使用API接口进行交互)")
    
    def shutdown(self):
        """关闭系统"""
        self.logger.info("正在关闭系统...")
        for user_id in list(self._workspaces.keys()):
            self.close_workspace(user_id)
        self.logger.info("系统已关闭")


# ── 入口 ──

def main():
    """主函数 - 启动API服务"""
    import uvicorn
    
    # 初始化Agent核心
    agent = AgentCore()
    
    # 创建FastAPI应用
    from api.routes import create_app
    app = create_app(agent)
    
    # 启动服务器
    print(f"\n{'='*50}")
    print(f"  AI Friend Agent - {agent.agent_config.name}")
    print(f"  三条链路: 被动回复 | 主动推送 | Drift探索")
    print(f"  API: http://{config.api_host}:{config.api_port}")
    print(f"  Docs: http://{config.api_host}:{config.api_port}/docs")
    print(f"{'='*50}\n")
    
    uvicorn.run(
        app,
        host=config.api_host,
        port=config.api_port,
        log_level=config.log_level.lower()
    )


if __name__ == "__main__":
    main()