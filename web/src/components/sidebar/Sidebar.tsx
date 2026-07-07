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
    <aside className="w-[260px] h-full flex flex-col bg-earth-800 dark:bg-earth-950 border-r border-earth-700/20 dark:border-earth-800/30 shrink-0 relative transition-colors duration-500">
      <div className="h-full flex flex-col">
        <SidebarNav />
      </div>
      {activePanel !== 'chat' && (
        <div className="absolute left-full top-0 bottom-0 w-[340px] bg-earth-50 dark:bg-earth-900 border-l border-earth-200 dark:border-earth-800 z-10 shadow-sm flex flex-col animate-leaf-in transition-colors duration-500">
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