"""
演示脚本 - 展示三条链路协同工作
运行: python demo.py
"""
import sys
import time
from datetime import datetime, timedelta
sys.path.insert(0, ".")


def demo():
    """演示被动链路 + 主动链路 + Drift链路"""
    from main import AgentCore
    
    print("\n" + "="*60)
    print("  AI好友代理 - 三条链路协同演示")
    print("="*60 + "\n")
    
    # 初始化Agent
    agent = AgentCore()
    print(f"[系统] {agent.agent_config.name} 已启动，准备就绪\n")
    
    user_id = "demo_user_001"
    
    # 记录用户同意
    agent.privacy.record_consent(user_id)
    print("[系统] 用户已同意隐私政策\n")
    
    # ── 场景1：被动链路 - 用户发起对话 ──
    print("─" * 40)
    print("【场景1】被动链路 - 用户发起对话")
    print("─" * 40)
    
    messages = [
        "你好！我下周有一个重要的项目汇报，需要准备PPT。",
        "另外我最近想学瑜伽，有什么建议吗？",
        "谢谢！我最近压力有点大。"
    ]
    
    for msg in messages:
        print(f"\n用户: {msg}")
        result = agent.process_user_message(user_id, msg)
        print(f"{agent.agent_config.name}: {result['reply']}")
        if result.get("memory_writes"):
            print(f"  [记忆写入: {len(result['memory_writes'])}条]")
        time.sleep(1)
    
    # ── 场景2：主动链路 - 推送提醒 ──
    print("\n" + "─" * 40)
    print("【场景2】主动链路 - 推送提醒检查")
    print("─" * 40)
    
    push_result = agent.process_active_push(user_id)
    if push_result:
        print(f"\n{agent.agent_config.name}: {push_result['message']}")
        print(f"  优先级: {push_result['priority_score']:.2f} | 成本: {push_result['cost_score']:.2f}")
    else:
        print("\n[系统] 当前无需推送（免打扰或成本过高）")
    
    # ── 场景3：Drift链路 - 自主探索 ──
    print("\n" + "─" * 40)
    print("【场景3】Drift链路 - 自主探索")
    print("─" * 40)
    
    # 模拟长时间静默
    last_interaction = datetime.now() - timedelta(hours=2)
    
    drift_result = agent.process_drift(user_id, last_interaction)
    if drift_result:
        print(f"\n{agent.agent_config.name}: {drift_result['message']}")
        print(f"  话题: {drift_result['topic']} | 置信度: {drift_result['confidence']:.2f}")
        
        # 模拟用户回复
        user_response = "确实，我最近有在考虑开始跑步锻炼。"
        print(f"\n用户: {user_response}")
        drift_reply = agent.process_drift_response(
            user_id, user_response, drift_result['topic']
        )
        print(f"{agent.agent_config.name}: {drift_reply['reply']}")
        if drift_reply.get("memory_writes"):
            print(f"  [Drift新信息写入: {len(drift_reply['memory_writes'])}条]")
    else:
        print("\n[系统] 当前不满足Drift触发条件")
    
    # ── 场景4：查看记忆 ──
    print("\n" + "─" * 40)
    print("【场景4】记忆系统状态")
    print("─" * 40)
    
    memories = agent.memory.get_recent_memories(user_id, limit=10)
    print(f"\n总记忆数: {agent.memory.count(user_id)}")
    for m in memories:
        print(f"  [{m.memory_type}] {m.content[:80]}... (置信度: {m.confidence})")
    
    # ── 场景5：插件调用 ──
    print("\n" + "─" * 40)
    print("【场景5】插件调用")
    print("─" * 40)
    
    # 日历插件
    cal_result = agent.plugin_registry.execute(
        "calendar", "add_event",
        {
            "user_id": user_id,
            "title": "项目汇报",
            "datetime": (datetime.now() + timedelta(days=3)).isoformat(),
            "description": "准备PPT并演练",
            "reminder_minutes": 30
        }
    )
    print(f"\n日历插件: 事件已添加 - {cal_result.get('result', {}).get('title', '')}")
    
    # 天气插件
    weather_result = agent.plugin_registry.execute(
        "weather", "get_activity_suggestion",
        {"city": "北京"}
    )
    if weather_result["success"]:
        print(f"天气插件: {weather_result['result']['tip']}")
    
    # ── 总结 ──
    print("\n" + "="*60)
    print("  演示完成！三条链路已协同运作。")
    print("  启动API服务: python main.py")
    print(f"  然后访问: http://localhost:{agent.cfg.api_port}/docs")
    print("="*60 + "\n")
    
    agent.shutdown()


if __name__ == "__main__":
    demo()