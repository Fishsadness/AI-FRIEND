"""
LLM客户端 - 统一模型调用接口
支持OpenAI API、本地模型和模拟模式。
"""
from typing import Optional
from config import config


class LLMClient:
    """
    LLM调用客户端，封装API调用。
    支持真实API调用和模拟模式（用于开发测试）。
    """
    
    def __init__(self, cfg=None):
        self.cfg = cfg or config.llm
        self._client = None
        self._mock_mode = not self.cfg.api_key
    
    def complete(self, prompt: str, max_tokens: int = None,
                 temperature: float = None, system_prompt: str = "") -> str:
        """生成回复"""
        if self._mock_mode:
            return self._mock_complete(prompt)
        
        if max_tokens is None:
            max_tokens = self.cfg.max_tokens
        if temperature is None:
            temperature = self.cfg.temperature
        
        try:
            import openai
            if self._client is None:
                self._client = openai.OpenAI(
                    api_key=self.cfg.api_key,
                    base_url=self.cfg.api_base
                )
            
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            response = self._client.chat.completions.create(
                model=self.cfg.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return self._mock_complete(prompt, error=str(e))
    
    def embed(self, text: str) -> list[float]:
        """生成文本向量"""
        if self._mock_mode:
            return self._mock_embed(text)
        
        try:
            import openai
            if self._client is None:
                self._client = openai.OpenAI(
                    api_key=self.cfg.api_key,
                    base_url=self.cfg.api_base
                )
            
            response = self._client.embeddings.create(
                model=self.cfg.embedding_model,
                input=text
            )
            return response.data[0].embedding
        except Exception:
            return self._mock_embed(text)
    
    def _mock_complete(self, prompt: str, error: str = "") -> str:
        """模拟回复（开发/测试用）"""
        # 提取用户消息
        if "用户：" in prompt:
            user_msg = prompt.split("用户：")[-1].split("\n")[0].strip()
        else:
            user_msg = prompt[-200:]
        
        # 模拟不同场景的回复
        if "会议" in user_msg:
            return "收到！我会帮您记录会议信息，并在会前提醒您。需要我帮您准备什么吗？"
        elif "面试" in user_msg:
            return "好的，面试很重要呢！我会在面试前提醒您，有什么需要我帮忙准备的吗？"
        elif "提醒" in user_msg:
            return "没问题，我已经记下了。到时候会提醒您的！"
        elif "喜欢" in user_msg:
            return "了解了！我会记住您的喜好，以后可以更好地为您服务。"
        elif "天气" in user_msg:
            return "最近天气还不错呢！适合出去走走，呼吸新鲜空气对身心都有好处。"
        elif "健康" in user_msg:
            return "关心健康是好事！记得规律作息，适当运动哦。"
        elif "学习" in user_msg:
            return "学习新东西总是让人兴奋！您想学什么？我可以帮您制定计划。"
        elif "压力" in user_msg or "累" in user_msg:
            return "听起来您最近有些疲惫。记得给自己一些喘息的时间，我会一直在这里支持您。"
        elif "谢谢" in user_msg:
            return "不客气！能帮到您我很开心。有什么需要随时找我。"
        else:
            return f"我理解了。作为您的AI好友，我会一直陪伴您。有什么想聊的都可以告诉我~"
    
    def _mock_embed(self, text: str) -> list[float]:
        """模拟向量生成（开发/测试用）"""
        import hashlib
        import struct
        
        # 基于文本哈希生成确定性向量
        h = hashlib.sha256(text.encode()).digest()
        dim = config.memory.vector_dim
        vec = []
        for i in range(dim):
            # 从哈希中提取值
            idx = i % len(h)
            val = (h[idx] / 255.0) * 2 - 1
            vec.append(val)
        
        # 归一化
        import math
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        
        return vec