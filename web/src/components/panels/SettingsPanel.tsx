import { useState } from 'react';
import { useAppStore } from '../../store';
import { Settings, Shield, User, Cpu, Trash2, Download, ToggleLeft, ToggleRight } from 'lucide-react';

export default function SettingsPanel() {
  const userId = useAppStore((s) => s.userId);
  const setUserId = useAppStore((s) => s.setUserId);
  const isConnected = useAppStore((s) => s.isConnected);
  const clearMessages = useAppStore((s) => s.clearMessages);
  const recordConsent = useAppStore((s) => s.recordConsent);
  const messages = useAppStore((s) => s.messages);
  const memories = useAppStore((s) => s.memories);

  const [consentGiven, setConsentGiven] = useState(false);
  const [agentName, setAgentName] = useState('小艾');
  const [modelName, setModelName] = useState('gpt-4o-mini');

  const handleConsent = () => {
    recordConsent();
    setConsentGiven(true);
  };

  const handleExport = () => {
    const data = {
      messages,
      memories,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-friend-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-white/90">系统设置</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Agent人格 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <User size={14} className="text-blue-400/70" />
            <h3 className="text-xs font-medium text-white/70">Agent 人格</h3>
          </div>
          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] text-white/30 block mb-1">名称</label>
              <input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/80 outline-none focus:border-white/[0.15] transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/30 block mb-1">人格描述</label>
              <textarea
                defaultValue="你是一个温暖、善解人意的AI好友，像真正的朋友一样陪伴用户。"
                rows={2}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/80 outline-none focus:border-white/[0.15] transition-colors resize-none"
              />
            </div>
          </div>
        </section>

        {/* LLM设置 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={14} className="text-purple-400/70" />
            <h3 className="text-xs font-medium text-white/70">模型设置</h3>
          </div>
          <div>
            <label className="text-[10px] text-white/30 block mb-1">模型</label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/80 outline-none focus:border-white/[0.15] transition-colors"
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="deepseek-chat">DeepSeek Chat</option>
              <option value="qwen-turbo">通义千问 Turbo</option>
            </select>
          </div>
        </section>

        {/* 隐私 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-emerald-400/70" />
            <h3 className="text-xs font-medium text-white/70">隐私与数据</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2.5">
              <div>
                <p className="text-xs text-white/70">数据收集同意</p>
                <p className="text-[10px] text-white/30">允许收集对话数据用于个性化</p>
              </div>
              <button onClick={handleConsent} className="text-white/40 hover:text-white/70 transition-colors">
                {consentGiven ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} />}
              </button>
            </div>
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-white/50 text-xs hover:bg-white/[0.06] hover:text-white/70 transition-colors"
            >
              <Download size={12} />
              导出对话数据
            </button>
            <button
              onClick={clearMessages}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/[0.06] border border-red-500/[0.1] text-red-400/70 text-xs hover:bg-red-500/[0.1] transition-colors"
            >
              <Trash2 size={12} />
              清除当前对话
            </button>
          </div>
        </section>

        {/* 连接状态 */}
        <section>
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">后端连接</span>
              <span className={`text-[10px] ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                {isConnected ? '已连接' : '未连接'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-white/50">用户ID</span>
              <span className="text-[10px] text-white/30 font-mono">{userId}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}