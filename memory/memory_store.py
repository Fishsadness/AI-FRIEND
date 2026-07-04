"""
记忆系统 - 核心存储模块
实现双存储结构：文本记忆 + 向量记忆，支持版本控制和隐私分级。
"""
import json
import uuid
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field, asdict

from config import config
from .vector_store import SimpleVectorStore
from .compressor import MemoryCompressor


@dataclass
class MemoryEntry:
    """单条记忆"""
    memory_id: str
    user_id: str
    content: str
    memory_type: str = "fact"          # fact / preference / event / todo / conversation
    source: str = "user"               # user / agent / system
    confidence: float = 1.0
    privacy_level: str = "normal"      # normal / sensitive / confidential
    tags: list = field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""
    version: int = 1
    is_active: bool = True
    
    def __post_init__(self):
        now = datetime.now().isoformat()
        if not self.created_at:
            self.created_at = now
        if not self.updated_at:
            self.updated_at = now


class MemoryStore:
    """
    记忆存储，双层结构：
    - 文本层：JSON文件存储完整记忆内容
    - 向量层：SimpleVectorStore存储语义向量
    """
    
    def __init__(self, llm_client=None):
        self.text_path = Path(config.memory.text_store_path)
        self.text_path.mkdir(parents=True, exist_ok=True)
        self.vector_store = SimpleVectorStore(
            dim=config.memory.vector_dim,
            store_path=config.memory.vector_store_path
        )
        self.compressor = MemoryCompressor(llm_client)
        self._embedding_fn = None  # 由外部注入embedding函数
    
    def set_embedding_fn(self, fn):
        """设置embedding函数，用于生成向量"""
        self._embedding_fn = fn
    
    # ── 写入操作 ──
    
    def add_memory(self, user_id: str, content: str, memory_type: str = "fact",
                   source: str = "user", confidence: float = 1.0,
                   privacy_level: str = "normal", tags: list = None) -> MemoryEntry:
        """添加一条记忆，同时写入文本层和向量层"""
        entry = MemoryEntry(
            memory_id=self._generate_id(),
            user_id=user_id,
            content=content,
            memory_type=memory_type,
            source=source,
            confidence=confidence,
            privacy_level=privacy_level,
            tags=tags or []
        )
        
        # 写入文本层
        self._write_text(user_id, entry)
        
        # 写入向量层
        if self._embedding_fn:
            vector = self._embedding_fn(content)
            self.vector_store.add(entry.memory_id, vector)
        
        return entry
    
    def add_memory_with_confidence(self, user_id: str, content: str,
                                   memory_type: str = "fact", source: str = "agent",
                                   confidence: float = 0.5, privacy_level: str = "normal",
                                   tags: list = None) -> MemoryEntry:
        """
        以指定置信度写入记忆。
        低置信度记忆先存为临时条目，后续确认后提升。
        """
        if confidence < config.drift.confidence_threshold:
            memory_type = f"tentative_{memory_type}"
        
        return self.add_memory(user_id, content, memory_type, source,
                               confidence, privacy_level, tags)
    
    def confirm_memory(self, memory_id: str, user_id: str) -> Optional[MemoryEntry]:
        """确认临时记忆，提升置信度并转为正式记忆"""
        entry = self.get_memory(memory_id, user_id)
        if entry and entry.memory_type.startswith("tentative_"):
            entry.memory_type = entry.memory_type.replace("tentative_", "")
            entry.confidence = 1.0
            entry.updated_at = datetime.now().isoformat()
            entry.version += 1
            self._write_text(user_id, entry)
            return entry
        return None
    
    def update_memory(self, memory_id: str, user_id: str, **kwargs) -> Optional[MemoryEntry]:
        """更新记忆属性"""
        entry = self.get_memory(memory_id, user_id)
        if not entry:
            return None
        
        for key, value in kwargs.items():
            if hasattr(entry, key):
                setattr(entry, key, value)
        
        entry.updated_at = datetime.now().isoformat()
        entry.version += 1
        self._write_text(user_id, entry)
        return entry
    
    def delete_memory(self, memory_id: str, user_id: str) -> bool:
        """删除记忆（软删除）"""
        entry = self.get_memory(memory_id, user_id)
        if entry:
            entry.is_active = False
            entry.updated_at = datetime.now().isoformat()
            self._write_text(user_id, entry)
            self.vector_store.remove(memory_id)
            return True
        return False
    
    def delete_all_user_memories(self, user_id: str) -> int:
        """删除用户所有记忆（用于撤回同意）"""
        memories = self._read_all(user_id)
        count = 0
        for m in memories:
            if m.is_active:
                m.is_active = False
                m.updated_at = datetime.now().isoformat()
                self._write_text(user_id, m)
                self.vector_store.remove(m.memory_id)
                count += 1
        return count
    
    # ── 读取操作 ──
    
    def get_memory(self, memory_id: str, user_id: str) -> Optional[MemoryEntry]:
        """根据ID获取单条记忆"""
        memories = self._read_all(user_id)
        for m in memories:
            if m.memory_id == memory_id and m.is_active:
                return m
        return None
    
    def search_by_text(self, user_id: str, query: str, top_k: int = None) -> list[MemoryEntry]:
        """
        文本检索：先向量搜索，再返回完整文本记忆。
        如果无embedding函数，则使用关键词匹配。
        """
        if top_k is None:
            top_k = config.memory.max_context_memories
        
        if self._embedding_fn:
            query_vec = self._embedding_fn(query)
            results = self.vector_store.search(query_vec, top_k=top_k)
            memories = []
            for mid, score in results:
                m = self.get_memory(mid, user_id)
                if m:
                    memories.append(m)
            return memories
        
        # 降级：关键词匹配
        return self._keyword_search(user_id, query, top_k)
    
    def get_recent_memories(self, user_id: str, limit: int = 10) -> list[MemoryEntry]:
        """获取最近的记忆"""
        memories = self._read_all(user_id)
        active = [m for m in memories if m.is_active]
        active.sort(key=lambda x: x.updated_at, reverse=True)
        return active[:limit]
    
    def get_memories_by_type(self, user_id: str, memory_type: str) -> list[MemoryEntry]:
        """按类型获取记忆"""
        memories = self._read_all(user_id)
        return [m for m in memories if m.is_active and m.memory_type == memory_type]
    
    def get_memories_by_tag(self, user_id: str, tag: str) -> list[MemoryEntry]:
        """按标签获取记忆"""
        memories = self._read_all(user_id)
        return [m for m in memories if m.is_active and tag in m.tags]
    
    def get_context_for_prompt(self, user_id: str, query: str = "",
                               limit: int = None) -> str:
        """
        获取用于Prompt的上下文文本。
        组合：相关记忆 + 最近记忆 + 偏好 + 待办
        """
        if limit is None:
            limit = config.memory.max_context_memories
        
        parts = []
        
        # 相关记忆
        if query:
            relevant = self.search_by_text(user_id, query, limit)
            if relevant:
                parts.append("【相关记忆】")
                for m in relevant:
                    parts.append(f"- [{m.memory_type}] {m.content}")
        
        # 偏好
        preferences = self.get_memories_by_type(user_id, "preference")
        if preferences:
            parts.append("【用户偏好】")
            for m in preferences[:5]:
                parts.append(f"- {m.content}")
        
        # 待办
        todos = self.get_memories_by_type(user_id, "todo")
        if todos:
            parts.append("【待办事项】")
            for m in todos[:5]:
                parts.append(f"- {m.content}")
        
        # 最近事件
        events = self.get_memories_by_type(user_id, "event")
        if events:
            parts.append("【近期事件】")
            for m in events[:5]:
                parts.append(f"- {m.content}")
        
        return "\n".join(parts)
    
    def _keyword_search(self, user_id: str, query: str, top_k: int) -> list[MemoryEntry]:
        """关键词匹配搜索（降级方案）"""
        memories = self._read_all(user_id)
        active = [m for m in memories if m.is_active]
        query_words = set(query.lower().split())
        
        scored = []
        for m in active:
            content_lower = m.content.lower()
            score = sum(1 for w in query_words if w in content_lower)
            if score > 0:
                scored.append((m, score))
        
        scored.sort(key=lambda x: x[1], reverse=True)
        return [m for m, _ in scored[:top_k]]
    
    # ── 持久化 ──
    
    def _write_text(self, user_id: str, entry: MemoryEntry) -> None:
        """写入文本层（JSON文件）"""
        memories = self._read_all(user_id)
        existing = {m.memory_id: m for m in memories}
        existing[entry.memory_id] = entry
        
        filepath = self.text_path / f"{user_id}.json"
        data = [asdict(m) for m in existing.values()]
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def _read_all(self, user_id: str) -> list[MemoryEntry]:
        """读取用户所有记忆"""
        filepath = self.text_path / f"{user_id}.json"
        if not filepath.exists():
            return []
        
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        return [MemoryEntry(**item) for item in data]
    
    def _generate_id(self) -> str:
        """生成唯一记忆ID"""
        return f"mem_{uuid.uuid4().hex[:12]}"
    
    def count(self, user_id: str) -> int:
        """统计活跃记忆数"""
        memories = self._read_all(user_id)
        return sum(1 for m in memories if m.is_active)
    
    # ── 压缩 ──
    
    def compress_and_archive(self, user_id: str, conversation_history: list[dict]) -> Optional[str]:
        """压缩对话历史并作为摘要记忆写入"""
        if len(conversation_history) < config.memory.compression_threshold:
            return None
        
        summary = self.compressor.compress_conversation(
            conversation_history,
            keep_recent=config.memory.compression_keep_recent
        )
        
        if summary:
            self.add_memory(
                user_id=user_id,
                content=summary,
                memory_type="conversation_summary",
                source="system",
                tags=["auto_summary"]
            )
        
        return summary