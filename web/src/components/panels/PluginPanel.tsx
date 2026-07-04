import { useEffect, useState } from 'react';
import { useAppStore } from '../../store';
import { api } from '../../api';
import { Puzzle, Play, ChevronDown, ChevronRight, Code2 } from 'lucide-react';

export default function PluginPanel() {
  const plugins = useAppStore((s) => s.plugins);
  const loadPlugins = useAppStore((s) => s.loadPlugins);
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);
  const [pluginResult, setPluginResult] = useState<Record<string, unknown>>({});
  const [pluginLoading, setPluginLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPlugins();
  }, [loadPlugins]);

  const handleExecute = async (pluginName: string, action: string) => {
    setPluginLoading((p) => ({ ...p, [pluginName]: true }));
    try {
      const res = await api.callPlugin(pluginName, action, { user_id: 'demo_user', city: '北京' });
      setPluginResult((p) => ({ ...p, [pluginName]: res }));
    } catch (err) {
      setPluginResult((p) => ({
        ...p,
        [pluginName]: { success: false, error: String(err) },
      }));
    }
    setPluginLoading((p) => ({ ...p, [pluginName]: false }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Puzzle size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-white/90">插件中心</h2>
          <span className="text-[10px] text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">{plugins.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {plugins.length === 0 && (
          <div className="text-center py-8 text-white/20 text-xs">暂无注册插件</div>
        )}
        {plugins.map((plugin) => {
          const isExpanded = expandedPlugin === plugin.name;
          const result = pluginResult[plugin.name];
          const loading = pluginLoading[plugin.name];

          return (
            <div key={plugin.name} className="bg-white/[0.02] border border-white/[0.04] rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedPlugin(isExpanded ? null : plugin.name)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center">
                  <Puzzle size={14} className="text-amber-400/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80">{plugin.name}</p>
                  <p className="text-[10px] text-white/30 truncate">{plugin.description}</p>
                </div>
                {isExpanded ? <ChevronDown size={14} className="text-white/30" /> : <ChevronRight size={14} className="text-white/30" />}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-white/[0.04]">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {plugin.actions.map((action) => (
                      <button
                        key={action}
                        onClick={() => handleExecute(plugin.name, action)}
                        disabled={loading}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/80 disabled:opacity-30 transition-colors"
                      >
                        <Play size={10} />
                        {action}
                      </button>
                    ))}
                  </div>

                  {loading && (
                    <div className="text-[10px] text-white/30 py-2">执行中...</div>
                  )}

                  {result && !loading && (
                    <div className="bg-black/20 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Code2 size={10} className="text-white/30" />
                        <span className="text-[10px] text-white/30">执行结果</span>
                      </div>
                      <pre className="text-[10px] text-white/60 leading-relaxed whitespace-pre-wrap font-mono">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}