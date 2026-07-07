import { useEffect, useState } from 'react';
import { useAppStore } from '../../store';
import { Search, Trash2, Brain, Star, Calendar, CheckSquare, FileText, RefreshCw } from 'lucide-react';

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  fact: { label: '事实', icon: <FileText size={12} />, color: 'text-sage-600 dark:text-sage-400 bg-sage-50 dark:bg-sage-500/10' },
  preference: { label: '偏好', icon: <Star size={12} />, color: 'text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-warm-500/10' },
  event: { label: '事件', icon: <Calendar size={12} />, color: 'text-sage-500 dark:text-sage-400 bg-sage-50 dark:bg-sage-500/10' },
  todo: { label: '待办', icon: <CheckSquare size={12} />, color: 'text-warm-500 dark:text-warm-400 bg-warm-50 dark:bg-warm-500/10' },
  conversation_summary: { label: '摘要', icon: <FileText size={12} />, color: 'text-earth-500 dark:text-earth-400 bg-earth-50 dark:bg-earth-800' },
  tentative_fact: { label: '待确认', icon: <FileText size={12} />, color: 'text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-warm-500/10' },
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
      <div className="px-4 py-4 border-b border-earth-200 dark:border-earth-800">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} className="text-sage-500 dark:text-sage-400" />
          <h2 className="text-sm font-serif font-semibold text-earth-700 dark:text-earth-200">记忆管理</h2>
          <span className="text-[10px] text-earth-400 dark:text-earth-500 bg-earth-100 dark:bg-earth-800 px-1.5 py-0.5 rounded-full">{memories.length}</span>
        </div>

        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-earth-400 dark:text-earth-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索记忆..."
            className="w-full bg-earth-50 dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-organic pl-8 pr-3 py-1.5 text-xs text-earth-700 dark:text-earth-200 placeholder:text-earth-400 dark:placeholder:text-earth-500 outline-none focus:border-sage-400 dark:focus:border-sage-500 transition-colors duration-300"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-2 py-0.5 rounded-full text-[10px] transition-all duration-300 ${
              !typeFilter ? 'bg-earth-700 text-earth-50 dark:bg-earth-200 dark:text-earth-800' : 'text-earth-400 dark:text-earth-500 hover:text-earth-600 dark:hover:text-earth-300'
            }`}
          >
            全部
          </button>
          {types.map((t) => {
            const cfg = typeConfig[t] || { label: t, icon: <FileText size={10} />, color: 'text-earth-400' };
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t === typeFilter ? '' : t)}
                className={`px-2 py-0.5 rounded-full text-[10px] transition-all duration-300 ${
                  t === typeFilter ? 'bg-earth-700 text-earth-50 dark:bg-earth-200 dark:text-earth-800' : 'text-earth-400 dark:text-earth-500 hover:text-earth-600 dark:hover:text-earth-300'
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
          <button
            onClick={() => loadMemories(search || undefined)}
            className="ml-auto p-1 rounded-full hover:bg-earth-100 dark:hover:bg-earth-800 text-earth-400 dark:text-earth-500 hover:text-earth-600 dark:hover:text-earth-300 transition-colors duration-300"
            title="刷新"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* 瀑布流记忆列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-earth-300 dark:text-earth-600 text-xs">
            {search ? '无匹配记忆' : '暂无记忆数据'}
          </div>
        ) : (
          <div className="masonry">
            {filtered.map((m) => {
              const cfg = typeConfig[m.type] || { label: m.type, icon: <FileText size={12} />, color: 'text-earth-400 bg-earth-100 dark:bg-earth-800' };
              return (
                <div key={m.id} className="group bg-white dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-organic p-3 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-500">
                  <p className="text-xs text-earth-600 dark:text-earth-300 leading-relaxed mb-2 line-clamp-3">{m.content}</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] ${cfg.color}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-earth-400 dark:text-earth-500">
                      {Math.round(m.confidence * 100)}% 置信度
                    </span>
                    <button
                      onClick={() => deleteMemory(m.id)}
                      className="ml-auto p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-warm-100 dark:hover:bg-warm-500/10 text-warm-400/60 hover:text-warm-500 transition-all duration-300"
                      title="删除"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}