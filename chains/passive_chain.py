"""
被动回复链 - 用户发起时响应
处理用户消息，检索记忆，生成回复，写入新记忆。
"""
from datetime import datetime
from typing import Optional
from config import config


class PassiveChain:
    """被动回复链：用户输入 → 记忆检索 → 生成回复 → 写入记忆"""
    
    def __init__(self, llm_client, memory_store, agent_config=None):
        self.llm = llm_client
        self.memory = memory_store
        self.agent = agent_config or config.agent
    
    def process(self, user_id: str, message: str, session_id: str = "",
                conversation_history: list = None) -> dict:
        """
        处理用户消息，返回回复。
        
        返回: {
            "reply": str,
            "memory_writes": list,
            "context_used": list,
            "chain": "passive"
        }
        """
        # 1. 检索相关记忆
        context = self.memory.get_context_for_prompt(user_id, query=message)
        
        # 2. 构建Prompt
        prompt = self._build_prompt(user_id, message, context, conversation_history)
        
        # 3. 生成回复
        reply = self.llm.complete(prompt)
        
        # 4. 提取关键信息并写入记忆
        memory_writes = self._extract_and_write(user_id, message, reply)
        
        return {
            "reply": reply,
            "memory_writes": memory_writes,
            "context_used": context,
            "chain": "passive",
            "timestamp": datetime.now().isoformat()
        }
    
    def _build_prompt(self, user_id: str, message: str, context: str,
                      history: list = None) -> str:
        """构建对话Prompt"""
        parts = [
            f"你是{self.agent.name}，{self.agent.persona}",
            f"语气：{self.agent.tone}",
            f"特质：{', '.join(self.agent.traits)}",
        ]
        
        if context:
            parts.append(f"\n关于用户的记忆：\n{context}")
        
        if history:
            parts.append("\n最近的对话历史：")
            for h in history[-6:]:
                parts.append(f"{h['role']}: {h['content']}")
        
        parts.append(f"\n用户：{message}")
        parts.append(f"\n{self.agent.name}：")
        
        return "\n".join(parts)
    
    def _extract_and_write(self, user_id: str, message: str, reply: str) -> list[dict]:
        """从对话中提取关键信息并写入记忆"""
        writes = []
        
        # 简单规则提取
        combined = f"{message} {reply}"
        
        # 检测事件信息
        if any(kw in combined for kw in ["会议", "面试", "演讲", "汇报", "旅行", "计划"]):
            entry = self.memory.add_memory(
                user_id=user_id,
                content=f"用户提到：{message[:100]}",
                memory_type="event",
                source="user",
                confidence=0.8
            )
            writes.append({"type": "event", "content": entry.content, "id": entry.memory_id})
        
        # 检测偏好
        if any(kw in combined for kw in ["喜欢", "爱好", "偏好", "感兴趣"]):
            entry = self.memory.add_memory(
                user_id=user_id,
                content=f"用户偏好：{message[:100]}",
                memory_type="preference",
                source="user",
                confidence=0.7
            )
            writes.append({"type": "preference", "content": entry.content, "id": entry.memory_id})
        
        # 检测待办
        if any(kw in combined for kw in ["需要", "要", "准备", "完成"]):
            entry = self.memory.add_memory(
                user_id=user_id,
                content=f"待办：{message[:100]}",
                memory_type="todo",
                source="user",
                confidence=0.6
            )
            writes.append({"type": "todo", "content": entry.content, "id": entry.memory_id})
        
        return writes
    
    def handle_quick_reply(self, user_id: str, message: str) -> str:
        """快速回复（无需记忆检索的简单场景）"""
        prompt = f"用户：{message}\n简短友好地回复："
        return self.llm.complete(prompt, max_tokens=100)