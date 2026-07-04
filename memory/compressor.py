"""
记忆压缩器 - 对话摘要和历史压缩
"""
from typing import Optional
from datetime import datetime


class MemoryCompressor:
    """将长对话历史压缩为摘要"""
    
    def __init__(self, llm_client=None):
        self.llm = llm_client
    
    def compress_conversation(self, messages: list[dict], keep_recent: int = 20) -> str:
        """
        压缩对话历史，保留最近N条，其余压缩为摘要。
        如果LLM不可用，使用简单截断策略。
        """
        if len(messages) <= keep_recent:
            return ""
        
        to_compress = messages[:-keep_recent]
        
        if self.llm:
            return self._llm_compress(to_compress)
        return self._simple_compress(to_compress)
    
    def _llm_compress(self, messages: list[dict]) -> str:
        """使用LLM生成摘要"""
        conversation_text = "\n".join(
            f"{m['role']}: {m['content']}" for m in messages
        )
        prompt = f"""请将以下对话历史压缩为简洁的要点摘要，提取关键信息（事实、偏好、决定、待办事项等）：

{conversation_text}

摘要："""
        try:
            result = self.llm.complete(prompt, max_tokens=500)
            return result
        except Exception:
            return self._simple_compress(messages)
    
    def _simple_compress(self, messages: list[dict]) -> str:
        """简单压缩：提取用户消息的要点"""
        user_messages = [m["content"] for m in messages if m["role"] == "user"]
        points = []
        for msg in user_messages[:10]:
            if len(msg) > 200:
                points.append(f"- {msg[:200]}...")
            else:
                points.append(f"- {msg}")
        
        summary = "历史对话要点：\n" + "\n".join(points)
        return summary
    
    def extract_key_info(self, text: str) -> list[dict]:
        """
        从文本中提取关键信息点（事实、偏好、事件等）
        返回: [{"type": "fact/preference/event/todo", "content": "...", "confidence": 0.9}]
        """
        if self.llm:
            return self._llm_extract(text)
        return self._rule_extract(text)
    
    def _llm_extract(self, text: str) -> list[dict]:
        """使用LLM提取关键信息"""
        prompt = f"""从以下文本中提取关键信息，按JSON格式返回列表，每项包含type(fact/preference/event/todo)、content和confidence(0-1)：

{text}

JSON:"""
        try:
            import json as _json
            result = self.llm.complete(prompt, max_tokens=300)
            return _json.loads(result)
        except Exception:
            return self._rule_extract(text)
    
    def _rule_extract(self, text: str) -> list[dict]:
        """基于规则提取关键信息"""
        items = []
        keywords = {
            "喜欢": "preference",
            "想要": "todo",
            "计划": "event",
            "我的": "fact",
            "会": "event",
            "是": "fact",
            "在": "fact",
        }
        for kw, itype in keywords.items():
            if kw in text:
                items.append({
                    "type": itype,
                    "content": text[:200],
                    "confidence": 0.5
                })
                break
        return items if items else [{"type": "fact", "content": text[:200], "confidence": 0.3}]