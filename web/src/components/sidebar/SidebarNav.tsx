import { MessageCircle, Brain, Puzzle, Bell, Settings, Sparkles, Coins } from 'lucide-react';
import type { PanelType } from '../../types';
import { useAppStore } from '../../store';

const navItems: { id: PanelType; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: '对话', icon: <MessageCircle size={18} /> },
  { id: 'memory', label: '记忆', icon: <Brain size={18} /> },
  { id: 'plugins', label: '插件', icon: <Puzzle size={18} /> },
  { id: 'push', label: '推送', icon: <Bell size={18} /> },
  { id: 'token', label: 'Token', icon: <Coins size={18} /> },
  { id: 'settings', label: '设置', icon: <Settings size={18} /> },
];

export default function SidebarNav() {
  const activePanel = useAppStore((s) => s.activePanel);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const isConnected = useAppStore((s) => s.isConnected);
  const chainStatus = useAppStore((s) => s.chainStatus);

  const activeCount = chainStatus.active.pendingCount;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06] dark:border-white/[0.03]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white/90 leading-tight">小艾</h1>
            <p className="text-[11px] text-white/40 leading-tight">AI Friend Agent</p>
          </div>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = activePanel === item.id;
          const showBadge = item.id === 'push' && activeCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                isActive
                  ? 'bg-white/[0.08] dark:bg-white/[0.06] text-white font-medium'
                  : 'text-white/50 dark:text-white/40 hover:text-white/80 dark:hover:text-white/70 hover:bg-white/[0.04] dark:hover:bg-white/[0.03]'
              }`}
            >
              <span className={isActive ? 'text-blue-400' : 'text-white/40 dark:text-white/30 group-hover:text-white/60 dark:group-hover:text-white/50'}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {showBadge && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                  {activeCount}
                </span>
              )}
              {item.id === 'memory' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 底部状态 */}
      <div className="px-5 py-4 border-t border-white/[0.06] dark:border-white/[0.03]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'} shadow-sm`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          </div>
          <span className="text-[11px] text-white/40 dark:text-white/30">
            {isConnected ? 'Agent 在线' : 'Agent 离线'}
          </span>
        </div>
        <div className="flex gap-3 mt-2.5">
          <ChainDot color="bg-emerald-400" label="被动" active={chainStatus.passive.active} />
          <ChainDot color="bg-blue-400" label="主动" active={chainStatus.active.active} />
          <ChainDot color="bg-amber-400" label="Drift" active={chainStatus.drift.active} />
        </div>
      </div>
    </div>
  );
}

function ChainDot({ color, label, active }: { color: string; label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-1.5" title={`${label}链路${active ? ' 激活中' : ''}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${color} ${active ? 'animate-pulse shadow-sm' : 'opacity-30'}`} />
      <span className="text-[10px] text-white/30 dark:text-white/20">{label}</span>
    </div>
  );
}