import { MessageCircle, Brain, Puzzle, Bell, Settings, Coins, Sun, Moon, Monitor } from 'lucide-react';
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
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const activeCount = chainStatus.active.pendingCount;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-earth-700/20 dark:border-earth-800/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-blob-sm bg-gradient-to-br from-warm-400 to-earth-700 flex items-center justify-center animate-morph">
            <span className="text-white text-base font-serif font-semibold">艾</span>
          </div>
          <div>
            <h1 className="text-sm font-serif font-semibold text-earth-100 dark:text-earth-200 leading-tight">小艾</h1>
            <p className="text-[11px] text-earth-400/60 dark:text-earth-500/60 leading-tight">AI Friend Agent</p>
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-organic text-sm transition-all duration-500 group ${
                isActive
                  ? 'bg-earth-700/50 dark:bg-earth-800/50 text-earth-50 dark:text-earth-100 font-medium translate-y-0.5'
                  : 'text-earth-300/70 dark:text-earth-500/70 hover:text-earth-100 dark:hover:text-earth-300 hover:bg-earth-700/20 dark:hover:bg-earth-800/30'
              }`}
            >
              <span className={isActive ? 'text-warm-400' : 'text-earth-400/50 dark:text-earth-600/50 group-hover:text-warm-400/70 transition-colors duration-500'}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {showBadge && (
                <span className="flex items-center justify-center min-w-[20px] h-5 rounded-full bg-warm-400 text-earth-900 text-[10px] font-bold px-1.5">
                  {activeCount}
                </span>
              )}
              {item.id === 'memory' && (
                <span className="w-1.5 h-1.5 rounded-full bg-sage-400/60 animate-breathe" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 主题切换 */}
      <div className="px-3 py-2 border-t border-earth-700/20 dark:border-earth-800/30">
        <div className="flex bg-earth-700/30 dark:bg-earth-800/30 rounded-organic p-0.5">
          {(['auto', 'light', 'dark'] as const).map((mode) => {
            const isActive = theme === mode;
            const icons = { auto: <Monitor size={13} />, light: <Sun size={13} />, dark: <Moon size={13} /> };
            const labels = { auto: '自动', light: '浅色', dark: '深色' };
            return (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                title={labels[mode]}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-organic text-[10px] transition-all duration-500 ${
                  isActive
                    ? 'bg-earth-600/60 dark:bg-earth-700/60 text-earth-50 dark:text-earth-100 shadow-sm'
                    : 'text-earth-400/50 dark:text-earth-600/50 hover:text-earth-300 dark:hover:text-earth-500'
                }`}
              >
                {icons[mode]}
                <span className="hidden xl:inline">{labels[mode]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 底部状态 */}
      <div className="px-5 py-4 border-t border-earth-700/20 dark:border-earth-800/30">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-sage-400' : 'bg-warm-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-sage-400 animate-breathe' : 'bg-warm-400'}`} />
          </div>
          <span className="text-[11px] text-earth-400/60 dark:text-earth-500/60">
            {isConnected ? 'Agent 在线' : 'Agent 离线'}
          </span>
        </div>
        <div className="flex gap-3 mt-2.5">
          <ChainDot color="bg-sage-400" label="被动" active={chainStatus.passive.active} />
          <ChainDot color="bg-warm-400" label="主动" active={chainStatus.active.active} />
          <ChainDot color="bg-earth-400" label="Drift" active={chainStatus.drift.active} />
        </div>
      </div>
    </div>
  );
}

function ChainDot({ color, label, active }: { color: string; label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-1.5" title={`${label}链路${active ? ' 激活中' : ''}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${color} ${active ? 'animate-breathe' : 'opacity-30'}`} />
      <span className="text-[10px] text-earth-400/50 dark:text-earth-500/50">{label}</span>
    </div>
  );
}