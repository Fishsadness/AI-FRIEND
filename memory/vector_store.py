"""
记忆系统 - 向量存储（简易版）
使用余弦相似度进行语义检索，支持向量的添加、搜索和持久化。
"""
import json
import math
import os
from typing import Optional
from pathlib import Path


class SimpleVectorStore:
    """简易向量存储，基于内存字典 + 文件持久化"""
    
    def __init__(self, dim: int = 1536, store_path: str = "./data/vectors"):
        self.dim = dim
        self.store_path = Path(store_path)
        self.store_path.mkdir(parents=True, exist_ok=True)
        self._vectors: dict[str, list[float]] = {}
        self._load()
    
    def add(self, memory_id: str, vector: list[float]) -> None:
        """添加或更新向量"""
        if len(vector) != self.dim:
            raise ValueError(f"向量维度应为{self.dim}，实际为{len(vector)}")
        self._vectors[memory_id] = vector
        self._save()
    
    def remove(self, memory_id: str) -> None:
        """删除向量"""
        self._vectors.pop(memory_id, None)
        self._save()
    
    def search(self, query_vector: list[float], top_k: int = 5) -> list[tuple[str, float]]:
        """余弦相似度搜索，返回 (memory_id, score) 列表"""
        if not self._vectors:
            return []
        
        scores = []
        for mid, vec in self._vectors.items():
            score = self._cosine_similarity(query_vector, vec)
            scores.append((mid, score))
        
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]
    
    def _cosine_similarity(self, a: list[float], b: list[float]) -> float:
        """计算余弦相似度"""
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(x * x for x in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)
    
    def _save(self) -> None:
        """持久化到文件"""
        filepath = self.store_path / "vectors.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self._vectors, f, ensure_ascii=False)
    
    def _load(self) -> None:
        """从文件加载"""
        filepath = self.store_path / "vectors.json"
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                self._vectors = json.load(f)
    
    def count(self) -> int:
        return len(self._vectors)
    
    def clear(self) -> None:
        self._vectors = {}
        self._save()