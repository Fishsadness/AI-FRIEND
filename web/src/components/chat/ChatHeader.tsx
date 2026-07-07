import { Menu, Sparkles, MessageCircle, Bell, Compass } from 'lucide-react';
import { useAppStore } from '../../store';

export default function ChatHeader() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const chainStatus = useAppStore((s) => s.chainStatus);

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-earth-200 dark:border-earth-800 bg-earth-50/80 dark:bg-earth-900/80 backdrop-blur-sm shrink-0 transition-colors duration-500">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button onClick={toggleSidebar} className="p-1.5 rounded-organic hover:bg-earth-100 dark:hover:bg-earth-800 text-earth-500 dark:text-earth-400 transition-colors duration-300">
            <Menu size={18} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-warm-400" />
          <span className="text-sm font-serif font-semibold text-earth-800 dark:text-earth-200">小艾</span>
          <span className="text-[11px] text-earth-400 dark:text-earth-500 bg-earth-100 dark:bg-earth-800 px-1.5 py-0.5 rounded-organic">AI Friend</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ChainIndicator icon={<MessageCircle size={14} />} label="被动" color="sage" active={chainStatus.passive.active} lastTrigger={chainStatus.passive.lastTrigger} />
        <ChainIndicator icon={<Bell size={14} />} label="主动" color="warm" active={chainStatus.active.active} pending={chainStatus.active.pendingCount} />
        <ChainIndicator icon={<Compass size={14} />} label="Drift" color="earth" active={chainStatus.drift.active} lastTrigger={chainStatus.drift.lastTrigger} />
      </div>
    </header>
  );
}

function ChainIndicator({ icon, label, color, active, lastTrigger, pending }: {
  icon: React.ReactNode; label: string; color: 'sage' | 'warm' | 'earth'; active: boolean; lastTrigger?: string; pending?: number;
}) {
  const colors = {
    sage:  { dot: 'bg-sage-400',  text: 'text-sage-600 dark:text-sage-400',  bg: 'bg-sage-50 dark:bg-sage-500/10',  ring: 'ring-sage-400/30' },
    warm:  { dot: 'bg-warm-400',  text: 'text-warm-600 dark:text-warm-400',  bg: 'bg-warm-50 dark:bg-warm-500/10',   ring: 'ring-warm-400/30' },
    earth: { dot: 'bg-earth-400', text: 'text-earth-600 dark:text-earth-400', bg: 'bg-earth-50 dark:bg-earth-500/10', ring: 'ring-earth-400/30' },
  };
  const c = colors[color];
  const lastTime = lastTrigger ? new Date(lastTrigger).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="flex items-center gap-1.5" title={`${label}链路${active ? ' 激活中' : ''}${lastTime ? ` ${lastTime}` : ''}`}>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${c.bg} transition-colors duration-500`}>
        <span className={c.text}>{icon}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${c.dot} ${active ? `animate-breathe ring-2 ${c.ring}` : 'opacity-40'}`} />
        <span className="text-[10px] text-earth-500 dark:text-earth-400 font-medium">{label}</span>
        {pending !== undefined && pending > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-warm-400 text-earth-900 text-[9px] font-bold">{pending}</span>
        )}
      </div>
    </div>
  );
}