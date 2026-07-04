"""
审计日志模块 - 记录所有重要操作，支持合规审计。
"""
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Optional
from config import config


class AuditLogger:
    """
    审计日志记录器。
    记录AI对话、记忆操作、推送决策等关键事件。
    支持防篡改的追加写入。
    """
    
    def __init__(self, log_dir: str = None):
        self.log_dir = Path(log_dir or config.log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self._log_file = self.log_dir / "audit.log"
        self._setup_file_logger()
    
    def _setup_file_logger(self):
        """设置文件日志"""
        self._logger = logging.getLogger("audit")
        self._logger.setLevel(logging.INFO)
        
        if not self._logger.handlers:
            handler = logging.FileHandler(
                self._log_file, encoding="utf-8"
            )
            handler.setFormatter(logging.Formatter(
                '%(asctime)s | %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            ))
            self._logger.addHandler(handler)
    
    def log_conversation(self, user_id: str, session_id: str, chain: str,
                         input_text: str, output_text: str, memory_ids: list = None) -> None:
        """记录对话事件"""
        entry = {
            "event": "conversation",
            "user_id": self._anonymize(user_id),
            "session_id": session_id,
            "chain": chain,
            "input_summary": input_text[:200],
            "output_summary": output_text[:200],
            "memory_ids": memory_ids or [],
            "timestamp": datetime.now().isoformat()
        }
        self._write(entry)
    
    def log_memory_operation(self, user_id: str, operation: str,
                             memory_id: str, content_summary: str = "") -> None:
        """记录记忆操作"""
        entry = {
            "event": "memory_operation",
            "user_id": self._anonymize(user_id),
            "operation": operation,
            "memory_id": memory_id,
            "content_summary": content_summary[:200],
            "timestamp": datetime.now().isoformat()
        }
        self._write(entry)
    
    def log_push_decision(self, user_id: str, push_type: str,
                          priority_score: float, cost_score: float,
                          pushed: bool, message: str = "") -> None:
        """记录推送决策"""
        entry = {
            "event": "push_decision",
            "user_id": self._anonymize(user_id),
            "push_type": push_type,
            "priority_score": round(priority_score, 3),
            "cost_score": round(cost_score, 3),
            "pushed": pushed,
            "message_summary": message[:200],
            "timestamp": datetime.now().isoformat()
        }
        self._write(entry)
    
    def log_consent_change(self, user_id: str, action: str) -> None:
        """记录用户同意/撤回操作"""
        entry = {
            "event": "consent_change",
            "user_id": self._anonymize(user_id),
            "action": action,
            "timestamp": datetime.now().isoformat()
        }
        self._write(entry)
    
    def log_model_call(self, user_id: str, model: str, prompt_tokens: int,
                       completion_tokens: int, latency_ms: float) -> None:
        """记录模型调用"""
        entry = {
            "event": "model_call",
            "user_id": self._anonymize(user_id) if user_id else "system",
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "latency_ms": round(latency_ms, 2),
            "timestamp": datetime.now().isoformat()
        }
        self._write(entry)
    
    def _write(self, entry: dict) -> None:
        """写入日志（追加）"""
        self._logger.info(json.dumps(entry, ensure_ascii=False))
    
    def _anonymize(self, user_id: str) -> str:
        """匿名化用户ID"""
        import hashlib
        return hashlib.sha256(user_id.encode()).hexdigest()[:16]
    
    def query_logs(self, user_id: str = None, event_type: str = None,
                   start_time: str = None, end_time: str = None,
                   limit: int = 100) -> list[dict]:
        """查询日志"""
        results = []
        if not self._log_file.exists():
            return results
        
        with open(self._log_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    # 提取JSON部分
                    json_start = line.find("{")
                    if json_start < 0:
                        continue
                    entry = json.loads(line[json_start:])
                    
                    if user_id and self._anonymize(user_id) != entry.get("user_id"):
                        continue
                    if event_type and entry.get("event") != event_type:
                        continue
                    
                    results.append(entry)
                except json.JSONDecodeError:
                    continue
        
        return results[-limit:]


def setup_logging():
    """设置全局日志"""
    log_dir = Path(config.log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)
    
    logging.basicConfig(
        level=getattr(logging, config.log_level),
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        handlers=[
            logging.FileHandler(log_dir / "app.log", encoding="utf-8"),
            logging.StreamHandler()
        ]
    )