import { useEffect, useState } from 'react';
import { useAppStore } from '../../store';
import { Search, Trash2, Brain, Star, Calendar, CheckSquare, FileText, RefreshCw } from 'lucide-react';

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  fact: { label: '事实', icon: <FileText size={12} />, color: 'text-blue-500 bg-blue-50' },
  preference: { label: '偏好', icon: <Star size={12} />, color: 'text-purple-500 bg-purple-50' },
  event: { label: '事件', icon: <Calendar size={12} />, color: 'text-emerald-500 bg-emerald-50' },
  todo: { label: '待办', icon: <CheckSquare size={12} />, color: 'text-amber-500 bg-amber-50' },
  conversation_summary: { label: '摘要', icon: <FileText size={12} />, color: 'text-gray-500 bg-gray-50' },
  tentative_fact: { label: '待确认', icon: <FileText size={12} />, color: 'text-orange-500 bg-orange-50' },
};

export default function MemoryPanel() {
  const memories = useAppStore((s) => s.memories);
  const loadMemories = useAppStore((s) => s.loadMemories);
  const deleteMemory = useAppStore((s) => s.deleteMemory);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const filtered = memories.filter((m) => {
    if (search && !m.content.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && m.type !== typeFilter) return false;
    return true;
  });

  const types = [...new Set(memories.map((m) => m.type))];

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} className="text-purple-400" />
          <h2 className="text-sm font-semibold text-white/90">记忆管理</h2>
          <span className="text-[10px] text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">{memories.length}</span>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索记忆..."
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-white/[0.15] transition-colors"
          />
        </div>

        {/* 类型筛选 */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              !typeFilter ? 'bg-white/[0.1] text-white/80' : 'text-white/30 hover:text-white/50'
            }`}
          >
            全部
          </button>
          {types.map((t) => {
            const cfg = typeConfig[t] || { label: t, icon: <FileText size={10} />, color: 'text-gray-400' };
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t === typeFilter ? '' : t)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  t === typeFilter ? 'bg-white/[0.1] text-white/80' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
          <button
            onClick={() => loadMemories(search || undefined)}
            className="ml-auto p-1 rounded hover:bg-white/[0.04] text-white/30 hover:text-white/60 transition-colors"
            title="刷新"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* 记忆列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-white/20 text-xs">
            {search ? '无匹配记忆' : '暂无记忆数据'}
          </div>
        )}
        {filtered.map((m) => {
          const cfg = typeConfig[m.type] || { label: m.type, icon: <FileText size={12} />, color: 'text-gray-400 bg-gray-800' };
          return (
            <div key={m.id} className="group bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 hover:border-white/[0.08] transition-colors">
              <p className="text-xs text-white/70 leading-relaxed mb-2 line-clamp-3">{m.content}</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${cfg.color}`}>
                  {cfg.icon}
                  {cfg.label}
                </span>
                <span className="text-[10px] text-white/20">
                  {Math.round(m.confidence * 100)}% 置信度
                </span>
                <button
                  onClick={() => deleteMemory(m.id)}
                  className="ml-auto p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all"
                  title="删除"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}