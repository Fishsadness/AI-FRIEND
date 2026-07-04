"""
Drift探索链 - 自主发起非紧急话题或行动，引导深入对话。
在对话静默时触发，进行探索性对话，收集新信息。
"""
from datetime import datetime, timedelta
from typing import Optional
import random
from config import config


class DriftChain:
    """
    Drift链：检测静默 → 选择话题 → 发起对话 → 收集新信息 → 写入记忆。
    体现AI的自主探索能力，像朋友一样主动开启话题。
    """
    
    def __init__(self, llm_client, memory_store, agent_config=None):
        self.llm = llm_client
        self.memory = memory_store
        self.agent = agent_config or config.agent
        self._last_drift_time: Optional[datetime] = None
        self._daily_drift_count: int = 0
        self._drift_date: datetime = datetime.now().date()
        
        # 探索话题模板
        self._topic_templates = [
            "weather_and_activity",
            "learning_and_growth",
            "health_and_wellness",
            "entertainment",
            "social_and_relationships",
            "goals_and_dreams",
            "daily_reflection",
            "fun_facts",
        ]
    
    def evaluate_and_drift(self, user_id: str, last_interaction_time: datetime,
                           conversation_history: list = None) -> Optional[dict]:
        """
        评估是否应发起Drift对话，如需则生成话题。
        
        返回: None（不触发）或 {
            "message": str,
            "drift_type": str,
            "topic": str,
            "confidence": float,
            "chain": "drift"
        }
        """
        # 1. 重置每日计数
        self._reset_daily_count()
        
        # 2. 检查静默时长
        idle_seconds = (datetime.now() - last_interaction_time).total_seconds()
        if idle_seconds < config.drift.idle_threshold_seconds:
            return None
        
        # 3. 检查冷却时间
        if self._last_drift_time:
            cooldown = (datetime.now() - self._last_drift_time).total_seconds()
            if cooldown < config.drift.cooldown_seconds:
                return None
        
        # 4. 检查每日上限
        if self._daily_drift_count >= config.drift.max_daily_drifts:
            return None
        
        # 5. 选择话题
        topic = self._select_topic(user_id, conversation_history)
        if not topic:
            return None
        
        # 6. 内容安全检查
        if not self._safety_check(topic):
            return None
        
        # 7. 生成Drift消息
        message = self._generate_drift_message(user_id, topic, conversation_history)
        
        # 8. 更新状态
        self._last_drift_time = datetime.now()
        self._daily_drift_count += 1
        
        return {
            "message": message,
            "drift_type": topic["type"],
            "topic": topic["topic"],
            "confidence": topic.get("confidence", 0.7),
            "chain": "drift",
            "timestamp": datetime.now().isoformat()
        }
    
    def _select_topic(self, user_id: str, history: list = None) -> Optional[dict]:
        """基于用户记忆和上下文选择最合适的探索话题"""
        # 获取用户偏好和兴趣
        preferences = self.memory.get_memories_by_type(user_id, "preference")
        recent = self.memory.get_recent_memories(user_id, limit=5)
        
        # 检查是否有未完成的目标
        todos = self.memory.get_memories_by_type(user_id, "todo")
        if todos:
            return {
                "type": "goal_followup",
                "topic": f"您之前提到的目标：{todos[0].content[:80]}",
                "confidence": 0.85,
                "source": "memory"
            }
        
        # 情感检测（简化：如果最近记忆中有负面情绪关键词）
        recent_text = " ".join([m.content for m in recent])
        emotion_keywords = ["难过", "压力", "焦虑", "累", "不开心", "烦恼"]
        if any(kw in recent_text for kw in emotion_keywords):
            return {
                "type": "emotional_care",
                "topic": "情感关怀",
                "confidence": 0.9,
                "source": "emotion_detect"
            }
        
        # 基于偏好选择话题
        if preferences:
            pref = random.choice(preferences)
            return {
                "type": "interest_explore",
                "topic": f"基于您的兴趣：{pref.content[:80]}",
                "confidence": 0.75,
                "source": "preference"
            }
        
        # 随机选择一个通用话题
        topic_type = random.choice(self._topic_templates)
        topic_map = {
            "weather_and_activity": "天气与活动建议",
            "learning_and_growth": "学习与成长",
            "health_and_wellness": "健康与养生",
            "entertainment": "娱乐趣事",
            "social_and_relationships": "社交与关系",
            "goals_and_dreams": "目标与梦想",
            "daily_reflection": "每日反思",
            "fun_facts": "趣味知识",
        }
        
        return {
            "type": topic_type,
            "topic": topic_map.get(topic_type, "闲聊"),
            "confidence": 0.5,
            "source": "random"
        }
    
    def _generate_drift_message(self, user_id: str, topic: dict,
                                history: list = None) -> str:
        """生成Drift对话消息"""
        topic_desc = topic["topic"]
        drift_type = topic["type"]
        
        prompts = {
            "goal_followup": f"用户之前提到过：{topic_desc}。请以{self.agent.name}的身份，友好地跟进询问进展。",
            "emotional_care": f"请以{self.agent.name}的身份，温柔地关心用户近况，表达支持和理解。",
            "interest_explore": f"用户感兴趣：{topic_desc}。请以{self.agent.name}的身份，自然地展开这个话题。",
            "weather_and_activity": "请以朋友的身份，聊聊最近的天气，并建议一项有趣的户外活动。",
            "learning_and_growth": "请以朋友的身份，分享一个有趣的知识或学习建议。",
            "health_and_wellness": "请以朋友的身份，关心用户的健康，给一个简单的养生小建议。",
            "entertainment": "请以朋友的身份，分享一个有趣的见闻或推荐。",
            "social_and_relationships": "请以朋友的身份，聊聊人际关系的小话题。",
            "goals_and_dreams": "请以朋友的身份，聊聊梦想和目标，鼓励用户。",
            "daily_reflection": "请以朋友的身份，邀请用户回顾今天，分享感受。",
            "fun_facts": "请以朋友的身份，分享一个有趣的冷知识。",
        }
        
        prompt = prompts.get(drift_type, f"请以{self.agent.name}的身份，自然地聊起：{topic_desc}")
        
        try:
            return self.llm.complete(prompt, max_tokens=200)
        except Exception:
            return f"嘿，最近怎么样？{topic_desc}，想和你聊聊~"
    
    def _safety_check(self, topic: dict) -> bool:
        """内容安全检查"""
        forbidden = config.drift.forbidden_topics
        topic_text = topic.get("topic", "") + topic.get("type", "")
        for fw in forbidden:
            if fw in topic_text:
                return False
        return True
    
    def process_new_info(self, user_id: str, user_response: str, drift_topic: str) -> list[dict]:
        """
        处理Drift对话中收集到的新信息，写入记忆。
        使用置信度评估。
        """
        writes = []
        
        # 提取关键信息
        info_items = self._extract_info(user_response)
        
        for item in info_items:
            entry = self.memory.add_memory_with_confidence(
                user_id=user_id,
                content=item["content"],
                memory_type=item.get("type", "fact"),
                source="agent",
                confidence=item.get("confidence", 0.5),
                tags=[f"drift:{drift_topic}"]
            )
            writes.append({
                "type": item.get("type", "fact"),
                "content": item["content"],
                "confidence": item.get("confidence", 0.5),
                "id": entry.memory_id
            })
        
        return writes
    
    def _extract_info(self, text: str) -> list[dict]:
        """从用户回复中提取信息"""
        items = []
        
        extraction_rules = [
            (["喜欢", "爱好", "感兴趣"], "preference", 0.7),
            (["想要", "想", "打算", "计划"], "todo", 0.6),
            (["会", "将", "要去"], "event", 0.65),
            (["是", "在", "有"], "fact", 0.5),
        ]
        
        for keywords, itype, confidence in extraction_rules:
            if any(kw in text for kw in keywords):
                items.append({
                    "type": itype,
                    "content": text[:200],
                    "confidence": confidence
                })
                break
        
        if not items:
            items.append({
                "type": "fact",
                "content": text[:200],
                "confidence": 0.4
            })
        
        return items
    
    def _reset_daily_count(self) -> None:
        """重置每日计数"""
        today = datetime.now().date()
        if self._drift_date != today:
            self._daily_drift_count = 0
            self._drift_date = today