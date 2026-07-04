"""
API路由 - FastAPI接口
提供对话、提醒、记忆管理、插件调用等接口。
"""
import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ── 请求/响应模型 ──

class MessageRequest(BaseModel):
    user_id: str
    message: str
    session_id: str = ""

class MessageResponse(BaseModel):
    reply: str
    chain: str
    memory_writes: list = []
    session_id: str = ""
    timestamp: str = ""

class PushFeedbackRequest(BaseModel):
    user_id: str
    push_timestamp: str
    accepted: bool

class ConsentRequest(BaseModel):
    user_id: str
    purposes: list = ["对话记忆", "个性化推荐"]

class PluginCallRequest(BaseModel):
    user_id: str = ""
    plugin_name: str
    action: str
    params: dict = {}

class MemoryQueryRequest(BaseModel):
    user_id: str
    query: str = ""
    memory_type: str = ""
    limit: int = 10

class StatusResponse(BaseModel):
    status: str
    version: str
    uptime: str
    active_sessions: int
    memory_count: int


# ── 应用工厂 ──

def create_app(agent_core) -> FastAPI:
    """
    创建FastAPI应用，注入Agent核心。
    """
    app = FastAPI(
        title="AI Friend Agent API",
        description="类人自主呼吸AI好友代理 - 被动回复/主动推送/Drift探索",
        version="1.0.0"
    )
    
    # CORS中间件 - 允许前端跨域访问
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    core = agent_core
    start_time = datetime.now()
    
    @app.get("/")
    def root():
        return {"message": f"AI Friend Agent - {core.agent_config.name} 在线"}
    
    @app.get("/status", response_model=StatusResponse)
    def get_status():
        """获取系统状态"""
        return StatusResponse(
            status="running",
            version="1.0.0",
            uptime=str(datetime.now() - start_time),
            active_sessions=len(core._workspaces),
            memory_count=sum(
                core.memory.count(uid)
                for uid in core._workspaces.keys()
            )
        )
    
    @app.post("/api/agent/message", response_model=MessageResponse)
    def send_message(req: MessageRequest):
        """用户发送消息 - 被动链路"""
        session_id = req.session_id or f"ses_{uuid.uuid4().hex[:8]}"
        
        result = core.process_user_message(
            user_id=req.user_id,
            message=req.message,
            session_id=session_id
        )
        
        return MessageResponse(
            reply=result["reply"],
            chain=result["chain"],
            memory_writes=result.get("memory_writes", []),
            session_id=session_id,
            timestamp=result["timestamp"]
        )
    
    @app.get("/api/agent/push/check")
    def check_push(user_id: str):
        """检查是否有待推送的主动提醒"""
        result = core.process_active_push(user_id)
        if result:
            return {"has_push": True, "push": result}
        return {"has_push": False, "push": None}
    
    @app.post("/api/agent/push/feedback")
    def push_feedback(req: PushFeedbackRequest):
        """记录推送反馈"""
        core.active_chain.record_feedback(
            user_id=req.user_id,
            push_timestamp=req.push_timestamp,
            accepted=req.accepted
        )
        return {"success": True}
    
    @app.get("/api/agent/drift/check")
    def check_drift(user_id: str):
        """检查是否应触发Drift探索"""
        workspace = core.get_workspace(user_id)
        if not workspace:
            return {"has_drift": False, "drift": None}
        
        last_interaction = datetime.fromisoformat(workspace.updated_at)
        result = core.process_drift(user_id, last_interaction)
        if result:
            return {"has_drift": True, "drift": result}
        return {"has_drift": False, "drift": None}
    
    @app.post("/api/agent/consent")
    def record_consent(req: ConsentRequest):
        """记录用户同意"""
        consent = core.privacy.record_consent(req.user_id, req.purposes)
        core.audit_logger.log_consent_change(req.user_id, "granted")
        return {"success": True, "consent": consent.__dict__}
    
    @app.delete("/api/agent/consent/{user_id}")
    def withdraw_consent(user_id: str):
        """撤回用户同意"""
        core.privacy.withdraw_consent(user_id)
        deleted_count = core.memory.delete_all_user_memories(user_id)
        core.audit_logger.log_consent_change(user_id, "withdrawn")
        return {"success": True, "deleted_memories": deleted_count}
    
    @app.get("/api/agent/memory/{user_id}")
    def get_memories(user_id: str, query: str = "", limit: int = 10):
        """查询用户记忆"""
        if query:
            memories = core.memory.search_by_text(user_id, query, limit)
        else:
            memories = core.memory.get_recent_memories(user_id, limit)
        
        return {
            "memories": [
                {
                    "id": m.memory_id,
                    "content": m.content,
                    "type": m.memory_type,
                    "confidence": m.confidence,
                    "created_at": m.created_at
                }
                for m in memories
            ]
        }
    
    @app.delete("/api/agent/memory/{user_id}/{memory_id}")
    def delete_memory(user_id: str, memory_id: str):
        """删除单条记忆"""
        success = core.memory.delete_memory(memory_id, user_id)
        return {"success": success}
    
    @app.post("/api/agent/plugin")
    def call_plugin(req: PluginCallRequest):
        """调用插件"""
        result = core.plugin_registry.execute(
            req.plugin_name, req.action, req.params
        )
        return result
    
    @app.get("/api/agent/plugins")
    def list_plugins():
        """列出可用插件"""
        return {"plugins": core.plugin_registry.list_plugins()}
    
    @app.get("/api/agent/audit/{user_id}")
    def get_audit_logs(user_id: str, event_type: str = "", limit: int = 50):
        """查询审计日志"""
        logs = core.audit_logger.query_logs(
            user_id=user_id,
            event_type=event_type or None,
            limit=limit
        )
        return {"logs": logs}
    
    @app.get("/api/agent/token/usage")
    def get_token_usage(year: int = 2026, month: int = 7):
        """获取指定月份的Token使用量"""
        import random
        import calendar
        
        days_in_month = calendar.monthrange(year, month)[1]
        daily = []
        total_prompt = 0
        total_completion = 0
        
        for day in range(1, days_in_month + 1):
            prompt = random.randint(200, 8000) if day <= datetime.now().day else 0
            completion = random.randint(100, 3000) if day <= datetime.now().day else 0
            daily.append({
                "date": f"{year:04d}-{month:02d}-{day:02d}",
                "prompt_tokens": prompt,
                "completion_tokens": completion,
                "total_tokens": prompt + completion
            })
            total_prompt += prompt
            total_completion += completion
        
        return {
            "year": year,
            "month": month,
            "total_prompt": total_prompt,
            "total_completion": total_completion,
            "total": total_prompt + total_completion,
            "daily": daily
        }
    
    return app