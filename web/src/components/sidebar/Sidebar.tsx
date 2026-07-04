import SidebarNav from './SidebarNav';
import MemoryPanel from '../panels/MemoryPanel';
import PluginPanel from '../panels/PluginPanel';
import PushPanel from '../panels/PushPanel';
import TokenPanel from '../panels/TokenPanel';
import SettingsPanel from '../panels/SettingsPanel';
import { useAppStore } from '../../store';

export default function Sidebar() {
  const activePanel = useAppStore((s) => s.activePanel);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  if (!sidebarOpen) return null;

  return (
    <aside className="w-[260px] h-full flex flex-col bg-[#0f0f1a] dark:bg-[#0a0a0f] border-r border-white/[0.05] dark:border-white/[0.03] shrink-0 relative transition-colors duration-300">
      <div className="h-full flex flex-col">
        <SidebarNav />
      </div>
      {activePanel !== 'chat' && (
        <div className="absolute left-full top-0 bottom-0 w-[340px] bg-[#161625] dark:bg-[#0e0e14] border-l border-white/[0.06] dark:border-white/[0.03] z-10 shadow-2xl shadow-black/30 dark:shadow-black/50 flex flex-col animate-slide-in transition-colors duration-300">
          <div className="flex-1 overflow-y-auto">
            {activePanel === 'memory' && <MemoryPanel />}
            {activePanel === 'plugins' && <PluginPanel />}
            {activePanel === 'push' && <PushPanel />}
            {activePanel === 'token' && <TokenPanel />}
            {activePanel === 'settings' && <SettingsPanel />}
          </div>
        </div>
      )}
    </aside>
  );
}