import { Menu, Sparkles, MessageCircle, Bell, Compass } from 'lucide-react';
import { useAppStore } from '../../store';

export default function ChatHeader() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const chainStatus = useAppStore((s) => s.chainStatus);

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-[#1e1e24]/80 backdrop-blur-sm shrink-0 transition-colors duration-300">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
            <Menu size={18} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-blue-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">小艾</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">AI Friend</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ChainIndicator icon={<MessageCircle size={14} />} label="被动" color="emerald" active={chainStatus.passive.active} lastTrigger={chainStatus.passive.lastTrigger} />
        <ChainIndicator icon={<Bell size={14} />} label="主动" color="blue" active={chainStatus.active.active} pending={chainStatus.active.pendingCount} />
        <ChainIndicator icon={<Compass size={14} />} label="Drift" color="amber" active={chainStatus.drift.active} lastTrigger={chainStatus.drift.lastTrigger} />
      </div>
    </header>
  );
}

function ChainIndicator({ icon, label, color, active, lastTrigger, pending }: {
  icon: React.ReactNode; label: string; color: 'emerald' | 'blue' | 'amber'; active: boolean; lastTrigger?: string; pending?: number;
}) {
  const colors = {
    emerald: { dot: 'bg-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', ring: 'ring-emerald-400/30' },
    blue:    { dot: 'bg-blue-400',    text: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10',       ring: 'ring-blue-400/30' },
    amber:   { dot: 'bg-amber-400',   text: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10',     ring: 'ring-amber-400/30' },
  };
  const c = colors[color];
  const lastTime = lastTrigger ? new Date(lastTrigger).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="flex items-center gap-1.5" title={`${label}链路${active ? ' 激活中' : ''}${lastTime ? ` ${lastTime}` : ''}`}>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${c.bg} transition-colors`}>
        <span className={c.text}>{icon}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${c.dot} ${active ? `animate-pulse ring-2 ${c.ring}` : 'opacity-40'}`} />
        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{label}</span>
        {pending !== undefined && pending > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold">{pending}</span>
        )}
      </div>
    </div>
  );
}