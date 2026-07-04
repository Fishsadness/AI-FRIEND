// Zustand 全局状态管理
import { create } from 'zustand';
import type { Message, PanelType, ChainStatus, MemoryEntry, PluginInfo } from '../types';
import { api } from '../api';

interface AppState {
  // 用户
  userId: string;
  setUserId: (id: string) => void;

  // 侧边栏
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // 对话
  messages: Message[];
  currentSessionId: string;
  isLoading: boolean;
  isStreaming: boolean;

  // 链路状态
  chainStatus: ChainStatus;

  // 记忆
  memories: MemoryEntry[];

  // 插件
  plugins: PluginInfo[];

  // 系统
  isConnected: boolean;
  error: string | null;

  // 操作
  sendMessage: (text: string) => Promise<void>;
  checkPush: () => Promise<void>;
  checkDrift: () => Promise<void>;
  loadMemories: (query?: string) => Promise<void>;
  loadPlugins: () => Promise<void>;
  checkConnection: () => Promise<void>;
  recordConsent: () => Promise<void>;
  deleteMemory: (memoryId: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useAppStore = create<AppState>((set, get) => ({
  // 默认状态
  userId: 'demo_user',
  setUserId: (id) => set({ userId: id }),

  activePanel: 'chat',
  setActivePanel: (panel) => set({ activePanel: panel }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  messages: [],
  currentSessionId: '',
  isLoading: false,
  isStreaming: false,

  chainStatus: {
    passive: { active: false, lastTrigger: '' },
    active: { active: false, pendingCount: 0 },
    drift: { active: false, lastTrigger: '' },
  },

  memories: [],
  plugins: [],
  isConnected: false,
  error: null,

  clearError: () => set({ error: null }),

  clearMessages: () => set({ messages: [], currentSessionId: '' }),

  // 发送消息
  sendMessage: async (text: string) => {
    const { userId, messages, currentSessionId } = get();
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      chain: 'passive',
      timestamp: new Date().toISOString(),
    };

    set({ messages: [...messages, userMsg], isLoading: true, error: null });
    set((s) => ({
      chainStatus: {
        ...s.chainStatus,
        passive: { active: true, lastTrigger: new Date().toISOString() },
      },
    }));

    try {
      const res = await api.sendMessage(userId, text, currentSessionId);
      const aiMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: res.reply,
        chain: (res.chain as Message['chain']) || 'passive',
        timestamp: res.timestamp,
        memoryWrites: res.memory_writes,
      };

      set((s) => ({
        messages: [...s.messages, aiMsg],
        isLoading: false,
        currentSessionId: res.session_id || s.currentSessionId,
        chainStatus: {
          ...s.chainStatus,
          passive: { active: false, lastTrigger: s.chainStatus.passive.lastTrigger },
        },
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '发送失败，请检查后端服务是否启动',
      });
    }
  },

  // 检查主动推送
  checkPush: async () => {
    const { userId } = get();
    try {
      const res = await api.checkPush(userId);
      if (res.has_push && res.push) {
        set((s) => ({
          chainStatus: {
            ...s.chainStatus,
            active: { active: true, pendingCount: s.chainStatus.active.pendingCount + 1 },
          },
        }));
        // 推送消息作为系统消息插入对话
        const pushMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: res.push.message,
          chain: 'active',
          timestamp: res.push.timestamp,
        };
        set((s) => ({ messages: [...s.messages, pushMsg] }));
      } else {
        set((s) => ({
          chainStatus: {
            ...s.chainStatus,
            active: { active: false, pendingCount: s.chainStatus.active.pendingCount },
          },
        }));
      }
    } catch {
      // 静默失败
    }
  },

  // 检查Drift探索
  checkDrift: async () => {
    const { userId } = get();
    try {
      const res = await api.checkDrift(userId);
      if (res.has_drift && res.drift) {
        set((s) => ({
          chainStatus: {
            ...s.chainStatus,
            drift: { active: true, lastTrigger: new Date().toISOString() },
          },
        }));
        const driftMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: res.drift.message,
          chain: 'drift',
          timestamp: res.drift.timestamp,
        };
        set((s) => ({ messages: [...s.messages, driftMsg] }));
      } else {
        set((s) => ({
          chainStatus: {
            ...s.chainStatus,
            drift: { active: false, lastTrigger: s.chainStatus.drift.lastTrigger },
          },
        }));
      }
    } catch {
      // 静默失败
    }
  },

  // 加载记忆
  loadMemories: async (query?: string) => {
    const { userId } = get();
    try {
      const res = await api.getMemories(userId, query || '');
      set({ memories: res.memories || [] });
    } catch {
      set({ memories: [] });
    }
  },

  // 删除记忆
  deleteMemory: async (memoryId: string) => {
    const { userId } = get();
    try {
      await api.deleteMemory(userId, memoryId);
      set((s) => ({ memories: s.memories.filter((m) => m.id !== memoryId) }));
    } catch (err) {
      set({ error: '删除失败' });
    }
  },

  // 加载插件
  loadPlugins: async () => {
    try {
      const res = await api.getPlugins();
      set({ plugins: res.plugins || [] });
    } catch {
      set({ plugins: [] });
    }
  },

  // 检查连接
  checkConnection: async () => {
    try {
      const res = await api.getStatus();
      set({ isConnected: res.status === 'running', error: null });
    } catch {
      set({ isConnected: false });
    }
  },

  // 隐私同意
  recordConsent: async () => {
    const { userId } = get();
    try {
      await api.recordConsent(userId);
    } catch {
      // 静默
    }
  },
}));