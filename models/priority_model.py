"""
主动推送优先级模型 - 优先级打分与成本函数
"""
from datetime import datetime, timedelta
from typing import Optional
from config import config


class PriorityModel:
    """
    推送优先级模型：
    - 优先级打分：紧急性 × 重要性 × 用户偏好 × 历史反馈
    - 成本函数：时间窗口 × 推送频次 × 场景
    """
    
    def __init__(self):
        self.priority_weights = config.push.priority_weights
        self.cost_weights = config.push.cost_weights
        self._feedback_store: dict[str, dict] = {}  # user_id -> {push_type: {accept: N, reject: N}}
        self._push_counts: dict[str, int] = {}  # user_id -> recent push count
    
    def rank_candidates(self, candidates: list[dict], user_id: str) -> list[dict]:
        """对候选推送按优先级排序"""
        for c in candidates:
            c["priority"] = self._calculate_priority(c, user_id)
        
        candidates.sort(key=lambda x: x["priority"], reverse=True)
        return candidates
    
    def _calculate_priority(self, candidate: dict, user_id: str) -> float:
        """
        计算优先级分数。
        Score = w1*urgency + w2*importance + w3*user_preference + w4*history_feedback
        """
        urgency = self._get_urgency(candidate)
        importance = self._get_importance(candidate)
        user_pref = self._get_user_preference(candidate, user_id)
        history = self._get_history_feedback(candidate, user_id)
        
        score = (
            self.priority_weights["urgency"] * urgency +
            self.priority_weights["importance"] * importance +
            self.priority_weights["user_preference"] * user_pref +
            self.priority_weights["history_feedback"] * history
        )
        
        return min(score, 1.0)
    
    def _get_urgency(self, candidate: dict) -> float:
        """紧急性：基于推送类型"""
        urgency_map = {
            "todo_reminder": 0.8,
            "event_reminder": 0.9,
            "care_check": 0.5,
            "daily_greeting": 0.3,
        }
        return urgency_map.get(candidate.get("push_type", ""), 0.5)
    
    def _get_importance(self, candidate: dict) -> float:
        """重要性：基于类别"""
        importance_map = {
            "task": 0.8,
            "schedule": 0.9,
            "care": 0.7,
            "social": 0.4,
        }
        return importance_map.get(candidate.get("category", ""), 0.5)
    
    def _get_user_preference(self, candidate: dict, user_id: str) -> float:
        """用户偏好（初始为中性）"""
        return 0.5  # 默认中性，随反馈调整
    
    def _get_history_feedback(self, candidate: dict, user_id: str) -> float:
        """历史反馈"""
        if user_id not in self._feedback_store:
            return 0.5
        
        push_type = candidate.get("push_type", "")
        if push_type not in self._feedback_store[user_id]:
            return 0.5
        
        fb = self._feedback_store[user_id][push_type]
        total = fb.get("accept", 0) + fb.get("reject", 0)
        if total == 0:
            return 0.5
        
        return fb.get("accept", 0) / total
    
    def calculate_cost(self, candidate: dict, user_id: str,
                       push_history: list) -> float:
        """
        计算打扰成本。
        C = w1*f_time_window + w2*f_frequency + w3*f_scene
        """
        time_cost = self._time_window_cost()
        freq_cost = self._frequency_cost(push_history)
        scene_cost = self._scene_cost()
        
        cost = (
            self.cost_weights["time_window"] * time_cost +
            self.cost_weights["frequency"] * freq_cost +
            self.cost_weights["scene"] * scene_cost
        )
        
        return min(cost, 1.0)
    
    def _time_window_cost(self) -> float:
        """时间窗口成本"""
        hour = datetime.now().hour
        # 工作时段成本低，休息时段成本高
        if 9 <= hour <= 12:
            return 0.3
        elif 13 <= hour <= 17:
            return 0.3
        elif 18 <= hour <= 21:
            return 0.5
        elif 22 <= hour <= 23:
            return 0.8
        else:
            return 0.9  # 深夜高成本
    
    def _frequency_cost(self, push_history: list) -> float:
        """推送频率成本"""
        if not push_history:
            return 0.0
        
        # 最近1小时内的推送次数
        recent = [
            p for p in push_history
            if (datetime.now() - datetime.fromisoformat(p["timestamp"])) < timedelta(hours=1)
        ]
        
        count = len(recent)
        if count == 0:
            return 0.0
        elif count <= 2:
            return 0.3
        elif count <= 4:
            return 0.6
        else:
            return 0.9
    
    def _scene_cost(self) -> float:
        """场景成本（简化版：默认假设用户空闲）"""
        return 0.2  # 默认低场景成本，可扩展为检测用户活跃状态
    
    def update_feedback(self, user_id: str, push_type: str, accepted: bool) -> None:
        """更新用户反馈"""
        if user_id not in self._feedback_store:
            self._feedback_store[user_id] = {}
        
        if push_type not in self._feedback_store[user_id]:
            self._feedback_store[user_id][push_type] = {"accept": 0, "reject": 0}
        
        if accepted:
            self._feedback_store[user_id][push_type]["accept"] += 1
        else:
            self._feedback_store[user_id][push_type]["reject"] += 1