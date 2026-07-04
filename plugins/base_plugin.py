"""
插件接口 - 可扩展的Agent能力模块
定义插件注册、权限模型和调用接口。
"""
from abc import ABC, abstractmethod
from typing import Any, Optional
from dataclasses import dataclass, field


@dataclass
class PluginPermission:
    """插件权限定义"""
    read_memory: bool = False
    write_memory: bool = False
    access_calendar: bool = False
    access_location: bool = False
    send_notification: bool = False
    make_network_call: bool = False


class BasePlugin(ABC):
    """
    插件基类。
    所有插件必须继承此类并实现 execute 方法。
    """
    
    name: str = "base_plugin"
    version: str = "1.0.0"
    description: str = ""
    permissions: PluginPermission = field(default_factory=PluginPermission)
    
    @abstractmethod
    def execute(self, action: str, params: dict) -> dict:
        """
        执行插件操作。
        
        参数:
            action: 操作名称
            params: 操作参数
        
        返回:
            {"success": bool, "result": Any, "error": str}
        """
        pass
    
    def get_actions(self) -> list[str]:
        """返回插件支持的操作列表"""
        return []
    
    def validate_params(self, params: dict, required: list[str]) -> Optional[str]:
        """验证必需参数"""
        for key in required:
            if key not in params:
                return f"缺少必需参数: {key}"
        return None


class PluginRegistry:
    """
    插件注册中心。
    管理所有已注册的插件，提供统一的调用接口。
    """
    
    def __init__(self):
        self._plugins: dict[str, BasePlugin] = {}
    
    def register(self, plugin: BasePlugin) -> None:
        """注册插件"""
        if plugin.name in self._plugins:
            raise ValueError(f"插件 '{plugin.name}' 已注册")
        self._plugins[plugin.name] = plugin
    
    def unregister(self, plugin_name: str) -> None:
        """注销插件"""
        self._plugins.pop(plugin_name, None)
    
    def get_plugin(self, plugin_name: str) -> Optional[BasePlugin]:
        """获取插件"""
        return self._plugins.get(plugin_name)
    
    def execute(self, plugin_name: str, action: str, params: dict) -> dict:
        """执行插件操作"""
        plugin = self.get_plugin(plugin_name)
        if not plugin:
            return {"success": False, "error": f"插件 '{plugin_name}' 未找到"}
        
        try:
            return plugin.execute(action, params)
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_plugins(self) -> list[dict]:
        """列出所有插件"""
        return [
            {
                "name": p.name,
                "version": p.version,
                "description": p.description,
                "actions": p.get_actions()
            }
            for p in self._plugins.values()
        ]
    
    def check_permission(self, plugin_name: str, action: str, 
                         required_permissions: dict) -> bool:
        """检查权限"""
        plugin = self.get_plugin(plugin_name)
        if not plugin:
            return False
        
        for perm, required in required_permissions.items():
            if required and not getattr(plugin.permissions, perm, False):
                return False
        return True