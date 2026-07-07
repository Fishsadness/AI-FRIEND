import { Bell, Clock, BarChart3 } from 'lucide-react';
import { useAppStore } from '../../store';

export default function PushPanel() {
  const chainStatus = useAppStore((s) => s.chainStatus);
  const messages = useAppStore((s) => s.messages);
  const checkPush = useAppStore((s) => s.checkPush);

  const pushMessages = messages.filter((m) => m.chain === 'active');

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-earth-200 dark:border-earth-800">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-warm-400" />
          <h2 className="text-sm font-serif font-semibold text-earth-700 dark:text-earth-200">推送管理</h2>
          <span className="text-[10px] text-earth-400 dark:text-earth-500 bg-earth-100 dark:bg-earth-800 px-1.5 py-0.5 rounded-full">{pushMessages.length}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-organic p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 size={12} className="text-warm-400/70" />
              <span className="text-[10px] text-earth-400 dark:text-earth-500">待推送</span>
            </div>
            <p className="text-lg font-serif font-semibold text-earth-700 dark:text-earth-200">{chainStatus.active.pendingCount}</p>
          </div>
          <div className="bg-white dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-organic p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={12} className="text-earth-400/70" />
              <span className="text-[10px] text-earth-400 dark:text-earth-500">已推送</span>
            </div>
            <p className="text-lg font-serif font-semibold text-earth-700 dark:text-earth-200">{pushMessages.length}</p>
          </div>
        </div>

        <button
          onClick={checkPush}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-organic bg-warm-50 dark:bg-warm-500/10 border border-warm-200 dark:border-warm-500/20 text-warm-600 dark:text-warm-400 text-xs hover:bg-warm-100 dark:hover:bg-warm-500/20 transition-colors duration-500 active:translate-y-0.5"
        >
          <Bell size={12} />
          手动检查推送
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <h3 className="text-[11px] text-earth-400 dark:text-earth-500 font-medium mb-2 px-1">推送历史</h3>
        {pushMessages.length === 0 ? (
          <div className="text-center py-8 text-earth-300 dark:text-earth-600 text-xs">暂无推送记录</div>
        ) : (
          <div className="relative pl-4 border-l border-earth-200 dark:border-earth-700 ml-1 space-y-3">
            {pushMessages.map((msg) => (
              <div key={msg.id} className="relative">
                <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-warm-400 ring-2 ring-earth-50 dark:ring-earth-900" />
                <div className="bg-white dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-organic p-2.5">
                  <p className="text-xs text-earth-600 dark:text-earth-300 leading-relaxed mb-1.5">{msg.content}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-earth-400 dark:text-earth-500">
                      {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-warm-500 dark:text-warm-400">
                      <Bell size={10} /> 主动推送
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-earth-200 dark:border-earth-800">
        <h3 className="text-[11px] text-earth-400 dark:text-earth-500 mb-2">免打扰时段</h3>
        <div className="flex items-center gap-2 text-xs text-earth-500 dark:text-earth-400">
          <Clock size={12} />
          <span>22:00 - 08:00</span>
          <span className="text-[10px] text-earth-300 dark:text-earth-600">（可配置）</span>
        </div>
      </div>
    </div>
  );
}