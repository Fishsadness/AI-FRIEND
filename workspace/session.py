"""
会话工作区 - 管理单次对话的临时状态和上下文
"""
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class SessionWorkspace:
    """
    会话工作区，每个对话会话创建一个实例。
    维护当前会话状态、对话历史、中间结果等。
    """
    
    session_id: str
    user_id: str
    created_at: str = ""
    updated_at: str = ""
    conversation_history: list = field(default_factory=list)
    variables: dict = field(default_factory=dict)
    sub_tasks: list = field(default_factory=list)
    is_active: bool = True
    
    def __post_init__(self):
        now = datetime.now().isoformat()
        if not self.created_at:
            self.created_at = now
        if not self.updated_at:
            self.updated_at = now
    
    def add_message(self, role: str, content: str) -> None:
        """添加对话消息"""
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        self.updated_at = datetime.now().isoformat()
    
    def get_recent_history(self, n: int = 10) -> list[dict]:
        """获取最近N条对话"""
        return self.conversation_history[-n:]
    
    def set_variable(self, key: str, value) -> None:
        """设置会话变量"""
        self.variables[key] = value
        self.updated_at = datetime.now().isoformat()
    
    def get_variable(self, key: str, default=None):
        """获取会话变量"""
        return self.variables.get(key, default)
    
    def add_sub_task(self, task: dict) -> None:
        """添加子任务"""
        self.sub_tasks.append({
            **task,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        })
    
    def complete_sub_task(self, task_id: str) -> None:
        """标记子任务完成"""
        for t in self.sub_tasks:
            if t.get("id") == task_id:
                t["status"] = "completed"
                t["completed_at"] = datetime.now().isoformat()
                break
    
    def to_summary(self) -> str:
        """生成会话摘要"""
        if not self.conversation_history:
            return ""
        
        summary_parts = [f"会话 {self.session_id} 摘要："]
        user_msgs = [m["content"] for m in self.conversation_history if m["role"] == "user"]
        for i, msg in enumerate(user_msgs[-5:], 1):
            summary_parts.append(f"{i}. {msg[:100]}")
        
        return "\n".join(summary_parts)
    
    def close(self) -> None:
        """关闭会话"""
        self.is_active = False
        self.updated_at = datetime.now().isoformat()
    
    def message_count(self) -> int:
        """消息数量"""
        return len(self.conversation_history)