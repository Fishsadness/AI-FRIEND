"""
日历插件 - 管理日程提醒和事件查询
"""
from datetime import datetime, timedelta
from .base_plugin import BasePlugin, PluginPermission


class CalendarPlugin(BasePlugin):
    """日历/日程管理插件"""
    
    name = "calendar"
    version = "1.0.0"
    description = "管理用户日程，创建和查询事件，设置提醒"
    permissions = PluginPermission(
        read_memory=True,
        write_memory=True,
        access_calendar=True,
        send_notification=True
    )
    
    def __init__(self):
        self._events: dict[str, list[dict]] = {}  # user_id -> [events]
    
    def execute(self, action: str, params: dict) -> dict:
        """执行日历操作"""
        handlers = {
            "add_event": self._add_event,
            "get_events": self._get_events,
            "get_upcoming": self._get_upcoming,
            "delete_event": self._delete_event,
            "check_reminders": self._check_reminders,
        }
        
        handler = handlers.get(action)
        if not handler:
            return {"success": False, "error": f"未知操作: {action}"}
        
        return handler(params)
    
    def get_actions(self) -> list[str]:
        return ["add_event", "get_events", "get_upcoming", "delete_event", "check_reminders"]
    
    def _add_event(self, params: dict) -> dict:
        """添加事件"""
        error = self.validate_params(params, ["user_id", "title", "datetime"])
        if error:
            return {"success": False, "error": error}
        
        user_id = params["user_id"]
        event = {
            "id": f"evt_{datetime.now().timestamp()}",
            "title": params["title"],
            "datetime": params["datetime"],
            "description": params.get("description", ""),
            "reminder_minutes": params.get("reminder_minutes", 15),
            "created_at": datetime.now().isoformat()
        }
        
        if user_id not in self._events:
            self._events[user_id] = []
        
        self._events[user_id].append(event)
        return {"success": True, "result": event}
    
    def _get_events(self, params: dict) -> dict:
        """获取事件列表"""
        user_id = params.get("user_id", "")
        date_str = params.get("date", datetime.now().strftime("%Y-%m-%d"))
        
        events = self._events.get(user_id, [])
        day_events = [
            e for e in events
            if e["datetime"].startswith(date_str)
        ]
        
        return {"success": True, "result": day_events}
    
    def _get_upcoming(self, params: dict) -> dict:
        """获取即将到来的事件"""
        user_id = params.get("user_id", "")
        hours = params.get("hours", 24)
        
        now = datetime.now()
        cutoff = now + timedelta(hours=hours)
        
        events = self._events.get(user_id, [])
        upcoming = []
        for e in events:
            try:
                event_time = datetime.fromisoformat(e["datetime"])
                if now <= event_time <= cutoff:
                    upcoming.append(e)
            except ValueError:
                continue
        
        upcoming.sort(key=lambda x: x["datetime"])
        return {"success": True, "result": upcoming}
    
    def _delete_event(self, params: dict) -> dict:
        """删除事件"""
        user_id = params.get("user_id", "")
        event_id = params.get("event_id", "")
        
        if user_id not in self._events:
            return {"success": False, "error": "无此事件"}
        
        self._events[user_id] = [
            e for e in self._events[user_id] if e["id"] != event_id
        ]
        return {"success": True, "result": "事件已删除"}
    
    def _check_reminders(self, params: dict) -> dict:
        """检查需要提醒的事件"""
        user_id = params.get("user_id", "")
        now = datetime.now()
        
        events = self._events.get(user_id, [])
        reminders = []
        for e in events:
            try:
                event_time = datetime.fromisoformat(e["datetime"])
                reminder_time = event_time - timedelta(minutes=e.get("reminder_minutes", 15))
                if now >= reminder_time and now < event_time:
                    reminders.append(e)
            except ValueError:
                continue
        
        return {"success": True, "result": reminders}