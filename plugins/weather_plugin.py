"""
天气插件 - 获取天气信息，用于Drift话题和主动关怀
"""
from .base_plugin import BasePlugin, PluginPermission


class WeatherPlugin(BasePlugin):
    """天气查询插件"""
    
    name = "weather"
    version = "1.0.0"
    description = "查询天气信息，用于日常关怀和活动建议"
    permissions = PluginPermission(
        make_network_call=True,
        send_notification=True
    )
    
    def execute(self, action: str, params: dict) -> dict:
        """执行天气查询"""
        handlers = {
            "get_current": self._get_current,
            "get_forecast": self._get_forecast,
            "get_activity_suggestion": self._get_activity_suggestion,
        }
        
        handler = handlers.get(action)
        if not handler:
            return {"success": False, "error": f"未知操作: {action}"}
        
        return handler(params)
    
    def get_actions(self) -> list[str]:
        return ["get_current", "get_forecast", "get_activity_suggestion"]
    
    def _get_current(self, params: dict) -> dict:
        """获取当前天气（模拟）"""
        city = params.get("city", "北京")
        # 模拟天气数据
        import random
        conditions = ["晴天", "多云", "阴天", "小雨", "晴朗"]
        temps = list(range(15, 35))
        
        weather = {
            "city": city,
            "temperature": random.choice(temps),
            "condition": random.choice(conditions),
            "humidity": random.randint(30, 80),
            "wind": f"{random.choice(['微风', '和风', '清风'])} {random.randint(1, 5)}级"
        }
        return {"success": True, "result": weather}
    
    def _get_forecast(self, params: dict) -> dict:
        """获取天气预报（模拟）"""
        city = params.get("city", "北京")
        days = params.get("days", 3)
        
        import random
        forecast = []
        conditions = ["晴天", "多云", "阴天", "小雨", "晴朗", "雷阵雨"]
        
        for i in range(days):
            forecast.append({
                "day": f"第{i+1}天",
                "temperature_high": random.randint(20, 35),
                "temperature_low": random.randint(10, 20),
                "condition": random.choice(conditions),
            })
        
        return {"success": True, "result": {"city": city, "forecast": forecast}}
    
    def _get_activity_suggestion(self, params: dict) -> dict:
        """根据天气推荐活动"""
        weather = self._get_current(params)
        if not weather["success"]:
            return weather
        
        condition = weather["result"]["condition"]
        temp = weather["result"]["temperature"]
        
        suggestions = {
            "晴天": ["去公园散步", "骑行", "户外野餐", "摄影"],
            "晴朗": ["爬山", "跑步", "打篮球", "户外瑜伽"],
            "多云": ["逛街", "逛博物馆", "户外咖啡", "散步"],
            "阴天": ["看电影", "阅读", "室内健身", "烘焙"],
            "小雨": ["在家看书", "做手工", "煲汤", "整理房间"],
            "雷阵雨": ["居家观影", "线上学习", "烹饪", "冥想"],
        }
        
        activities = suggestions.get(condition, ["散步", "阅读"])
        
        return {
            "success": True,
            "result": {
                "weather": weather["result"],
                "suggestions": activities,
                "tip": f"今天{condition}，{temp}°C，适合：{'、'.join(activities[:3])}"
            }
        }