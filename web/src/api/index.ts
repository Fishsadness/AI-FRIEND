// API服务层 - 与后端FastAPI通信
import type {
  MessageResponse,
  PushCheckResponse,
  DriftCheckResponse,
  MemoryEntry,
  PluginInfo,
  StatusResponse,
  TokenUsageMonth,
} from '../types';

const API_BASE = ''; // 使用 Vite proxy 代理到后端

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // 对话
  sendMessage(userId: string, message: string, sessionId: string = '') {
    return request<MessageResponse>('/api/agent/message', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, message, session_id: sessionId }),
    });
  },

  // 主动推送
  checkPush(userId: string) {
    return request<PushCheckResponse>(`/api/agent/push/check?user_id=${userId}`);
  },

  pushFeedback(userId: string, pushTimestamp: string, accepted: boolean) {
    return request<{ success: boolean }>('/api/agent/push/feedback', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, push_timestamp: pushTimestamp, accepted }),
    });
  },

  // Drift探索
  checkDrift(userId: string) {
    return request<DriftCheckResponse>(`/api/agent/drift/check?user_id=${userId}`);
  },

  // 记忆
  getMemories(userId: string, query: string = '', limit: number = 20) {
    const params = new URLSearchParams({ query, limit: String(limit) });
    return request<{ memories: MemoryEntry[] }>(`/api/agent/memory/${userId}?${params}`);
  },

  deleteMemory(userId: string, memoryId: string) {
    return request<{ success: boolean }>(`/api/agent/memory/${userId}/${memoryId}`, {
      method: 'DELETE',
    });
  },

  // 隐私
  recordConsent(userId: string, purposes: string[] = ['对话记忆']) {
    return request<{ success: boolean }>('/api/agent/consent', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, purposes }),
    });
  },

  withdrawConsent(userId: string) {
    return request<{ success: boolean }>(`/api/agent/consent/${userId}`, {
      method: 'DELETE',
    });
  },

  // 插件
  callPlugin(pluginName: string, action: string, params: Record<string, unknown> = {}) {
    return request<{ success: boolean; result: unknown; error?: string }>('/api/agent/plugin', {
      method: 'POST',
      body: JSON.stringify({ plugin_name: pluginName, action, params }),
    });
  },

  getPlugins() {
    return request<{ plugins: PluginInfo[] }>('/api/agent/plugins');
  },

  // 系统状态
  getStatus() {
    return request<StatusResponse>('/status');
  },

  // Token使用量
  getTokenUsage(year: number, month: number) {
    return request<TokenUsageMonth>(`/api/agent/token/usage?year=${year}&month=${month}`);
  },
};