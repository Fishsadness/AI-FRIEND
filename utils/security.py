"""
隐私与安全模块 - 数据分级加密、同意管理
"""
import json
import base64
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field
from config import config


@dataclass
class UserConsent:
    """用户同意记录"""
    user_id: str
    consented: bool = False
    consent_date: str = ""
    consent_version: str = "1.0"
    data_processing_purposes: list = field(default_factory=lambda: ["对话记忆", "个性化推荐"])
    can_withdraw: bool = True
    withdrawn_date: Optional[str] = None


class PrivacyManager:
    """
    隐私管理器：
    - 用户同意管理
    - 数据分级加密
    - 撤回与删除
    """
    
    def __init__(self, data_dir: str = None):
        self.data_dir = Path(data_dir or config.memory.text_store_path)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self._consent_file = self.data_dir / "consent_records.json"
        self._consents: dict[str, UserConsent] = {}
        self._load_consents()
    
    def record_consent(self, user_id: str, purposes: list = None) -> UserConsent:
        """记录用户同意"""
        consent = UserConsent(
            user_id=user_id,
            consented=True,
            consent_date=datetime.now().isoformat(),
            data_processing_purposes=purposes or ["对话记忆", "个性化推荐"]
        )
        self._consents[user_id] = consent
        self._save_consents()
        return consent
    
    def withdraw_consent(self, user_id: str) -> bool:
        """撤回同意"""
        if user_id in self._consents:
            self._consents[user_id].consented = False
            self._consents[user_id].withdrawn_date = datetime.now().isoformat()
            self._save_consents()
            return True
        return False
    
    def has_consent(self, user_id: str) -> bool:
        """检查用户是否已同意"""
        consent = self._consents.get(user_id)
        return consent is not None and consent.consented
    
    def get_consent_info(self, user_id: str) -> Optional[UserConsent]:
        """获取用户同意信息"""
        return self._consents.get(user_id)
    
    def encrypt_sensitive(self, text: str, key: str = "") -> str:
        """
        加密敏感数据（AES-256简化版）。
        实际生产应使用 cryptography 库。
        """
        if not key:
            key = config.memory.encryption_key
        if not key:
            return text  # 无密钥则不加密
        
        # 简化加密：使用XOR + Base64（生产环境应使用AES-256）
        key_bytes = hashlib.sha256(key.encode()).digest()
        text_bytes = text.encode("utf-8")
        encrypted = bytes(
            text_bytes[i] ^ key_bytes[i % len(key_bytes)]
            for i in range(len(text_bytes))
        )
        return base64.b64encode(encrypted).decode()
    
    def decrypt_sensitive(self, encrypted_text: str, key: str = "") -> str:
        """解密敏感数据"""
        if not key:
            key = config.memory.encryption_key
        if not key:
            return encrypted_text
        
        try:
            key_bytes = hashlib.sha256(key.encode()).digest()
            encrypted = base64.b64decode(encrypted_text)
            decrypted = bytes(
                encrypted[i] ^ key_bytes[i % len(key_bytes)]
                for i in range(len(encrypted))
            )
            return decrypted.decode("utf-8")
        except Exception:
            return encrypted_text
    
    def classify_privacy_level(self, text: str) -> str:
        """
        自动分类隐私级别。
        normal / sensitive / confidential
        """
        sensitive_keywords = [
            "身份证", "手机号", "地址", "银行卡", "密码",
            "疾病", "病历", "体检", "药", "手术",
            "工资", "收入", "存款", "贷款",
        ]
        
        confidential_keywords = [
            "密码", "密钥", "银行卡号", "验证码"
        ]
        
        for kw in confidential_keywords:
            if kw in text:
                return "confidential"
        
        for kw in sensitive_keywords:
            if kw in text:
                return "sensitive"
        
        return "normal"
    
    def anonymize_text(self, text: str) -> str:
        """脱敏处理：替换敏感信息"""
        # 简单替换手机号模式
        import re
        text = re.sub(r'1[3-9]\d{9}', '[手机号]', text)
        text = re.sub(r'\d{6}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]', '[身份证号]', text)
        return text
    
    def _load_consents(self):
        """加载同意记录"""
        if self._consent_file.exists():
            with open(self._consent_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                for uid, cdata in data.items():
                    self._consents[uid] = UserConsent(**cdata)
    
    def _save_consents(self):
        """保存同意记录"""
        data = {uid: c.__dict__ for uid, c in self._consents.items()}
        with open(self._consent_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)