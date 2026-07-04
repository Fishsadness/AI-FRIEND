import { Bell, Clock, BarChart3 } from 'lucide-react';
import { useAppStore } from '../../store';

export default function PushPanel() {
  const chainStatus = useAppStore((s) => s.chainStatus);
  const messages = useAppStore((s) => s.messages);
  const checkPush = useAppStore((s) => s.checkPush);

  // 从消息中提取推送记录
  const pushMessages = messages.filter((m) => m.chain === 'active');

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white/90">推送管理</h2>
          <span className="text-[10px] text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">{pushMessages.length}</span>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 size={12} className="text-blue-400/70" />
              <span className="text-[10px] text-white/40">待推送</span>
            </div>
            <p className="text-lg font-semibold text-white/80">{chainStatus.active.pendingCount}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={12} className="text-amber-400/70" />
              <span className="text-[10px] text-white/40">已推送</span>
            </div>
            <p className="text-lg font-semibold text-white/80">{pushMessages.length}</p>
          </div>
        </div>

        <button
          onClick={checkPush}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors"
        >
          <Bell size={12} />
          手动检查推送
        </button>
      </div>

      {/* 推送历史 */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <h3 className="text-[11px] text-white/30 font-medium mb-2 px-1">推送历史</h3>
        {pushMessages.length === 0 ? (
          <div className="text-center py-8 text-white/20 text-xs">暂无推送记录</div>
        ) : (
          <div className="relative pl-4 border-l border-white/[0.06] ml-1 space-y-3">
            {pushMessages.map((msg) => (
              <div key={msg.id} className="relative">
                <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-blue-400 ring-2 ring-[#161625]" />
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-2.5">
                  <p className="text-xs text-white/70 leading-relaxed mb-1.5">{msg.content}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/20">
                      {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-400/70">
                      <Bell size={10} /> 主动推送
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 免打扰设置 */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <h3 className="text-[11px] text-white/40 mb-2">免打扰时段</h3>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Clock size={12} />
          <span>22:00 - 08:00</span>
          <span className="text-[10px] text-white/20">（可配置）</span>
        </div>
      </div>
    </div>
  );
}