"""
主动推送链 - 定时或事件触发，主动向用户推送提醒和关怀。
"""
from datetime import datetime, timedelta
from typing import Optional
from config import config
from models.priority_model import PriorityModel


class ActiveChain:
    """
    主动推送链：监控-评估-推送-反馈循环。
    定时检查待推送事件，按优先级和成本函数决定是否推送。
    """
    
    def __init__(self, llm_client, memory_store, agent_config=None):
        self.llm = llm_client
        self.memory = memory_store
        self.agent = agent_config or config.agent
        self.priority_model = PriorityModel()
        self._push_history: list[dict] = []  # 推送历史记录
    
    def evaluate_and_push(self, user_id: str) -> Optional[dict]:
        """
        评估是否需要推送，如需则生成推送内容。
        
        返回: None（无需推送）或 {
            "message": str,
            "push_type": str,
            "priority_score": float,
            "cost_score": float,
            "chain": "active"
        }
        """
        # 1. 检查是否在免打扰时段
        if self._is_quiet_hours():
            return None
        
        # 2. 检查推送频率
        if not self._can_push():
            return None
        
        # 3. 收集待推送候选
        candidates = self._collect_candidates(user_id)
        if not candidates:
            return None
        
        # 4. 优先级排序
        scored = self.priority_model.rank_candidates(candidates, user_id)
        
        # 5. 成本函数评估
        top_candidate = scored[0]
        cost = self.priority_model.calculate_cost(top_candidate, user_id,
                                                   self._push_history)
        
        if top_candidate["priority"] <= cost:
            return None
        
        # 6. 生成推送消息
        message = self._generate_push_message(user_id, top_candidate)
        
        # 7. 记录推送
        push_record = {
            "user_id": user_id,
            "push_type": top_candidate["push_type"],
            "message": message,
            "priority_score": top_candidate["priority"],
            "cost_score": cost,
            "timestamp": datetime.now().isoformat()
        }
        self._push_history.append(push_record)
        
        # 清理旧记录
        cutoff = datetime.now() - timedelta(hours=24)
        self._push_history = [
            p for p in self._push_history
            if datetime.fromisoformat(p["timestamp"]) > cutoff
        ]
        
        return {
            "message": message,
            "push_type": top_candidate["push_type"],
            "priority_score": top_candidate["priority"],
            "cost_score": cost,
            "chain": "active",
            "timestamp": push_record["timestamp"]
        }
    
    def _collect_candidates(self, user_id: str) -> list[dict]:
        """收集待推送候选项"""
        candidates = []
        
        # 待办事项
        todos = self.memory.get_memories_by_type(user_id, "todo")
        for todo in todos:
            candidates.append({
                "push_type": "todo_reminder",
                "content": todo.content,
                "memory_id": todo.memory_id,
                "category": "task",
                "source": todo
            })
        
        # 事件提醒
        events = self.memory.get_memories_by_type(user_id, "event")
        for event in events:
            candidates.append({
                "push_type": "event_reminder",
                "content": event.content,
                "memory_id": event.memory_id,
                "category": "schedule",
                "source": event
            })
        
        # 关怀提醒（基于用户偏好）
        preferences = self.memory.get_memories_by_type(user_id, "preference")
        if preferences:
            candidates.append({
                "push_type": "care_check",
                "content": "根据用户偏好发起关怀",
                "memory_id": None,
                "category": "care",
                "source": preferences[0]
            })
        
        # 每日问候（如果最近没有交互）
        recent = self.memory.get_recent_memories(user_id, limit=1)
        if recent:
            last_time = datetime.fromisoformat(recent[0].updated_at)
            if datetime.now() - last_time > timedelta(hours=6):
                candidates.append({
                    "push_type": "daily_greeting",
                    "content": "每日问候",
                    "memory_id": None,
                    "category": "social",
                    "source": None
                })
        
        return candidates
    
    def _generate_push_message(self, user_id: str, candidate: dict) -> str:
        """生成推送消息"""
        push_type = candidate["push_type"]
        content = candidate["content"]
        
        prompts = {
            "todo_reminder": f"用户有待办：{content}。请以{self.agent.name}的身份，友好地提醒用户。",
            "event_reminder": f"用户有事件：{content}。请以{self.agent.name}的身份，温馨提醒用户。",
            "care_check": f"基于用户偏好：{content}，请以{self.agent.name}的身份，主动关心用户近况。",
            "daily_greeting": f"请以{self.agent.name}的身份，给用户一个温暖的每日问候，简短即可。",
        }
        
        prompt = prompts.get(push_type, f"请以{self.agent.name}的身份，友好地提醒用户：{content}")
        
        try:
            return self.llm.complete(prompt, max_tokens=200)
        except Exception:
            return f"嗨！{content}，记得关注一下哦~"
    
    def _is_quiet_hours(self) -> bool:
        """检查是否在免打扰时段"""
        hour = datetime.now().hour
        start = config.push.quiet_hours_start
        end = config.push.quiet_hours_end
        if start > end:
            return hour >= start or hour < end
        return start <= hour < end
    
    def _can_push(self) -> bool:
        """检查推送频率是否允许"""
        if not self._push_history:
            return True
        
        # 每日上限
        today = datetime.now().date()
        today_pushes = [
            p for p in self._push_history
            if datetime.fromisoformat(p["timestamp"]).date() == today
        ]
        if len(today_pushes) >= config.push.max_daily_pushes:
            return False
        
        # 最小间隔
        last_push = datetime.fromisoformat(self._push_history[-1]["timestamp"])
        if (datetime.now() - last_push).total_seconds() < config.push.min_interval_seconds:
            return False
        
        return True
    
    def record_feedback(self, user_id: str, push_timestamp: str, accepted: bool) -> None:
        """记录用户对推送的反馈"""
        for p in self._push_history:
            if p["timestamp"] == push_timestamp:
                p["feedback"] = "accepted" if accepted else "rejected"
                self.priority_model.update_feedback(user_id, p["push_type"], accepted)
                break