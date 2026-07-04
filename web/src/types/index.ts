// 核心类型定义

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  chain: 'passive' | 'active' | 'drift' | 'system';
  timestamp: string;
  memoryWrites?: MemoryWrite[];
}

export interface MemoryWrite {
  type: string;
  content: string;
  id?: string;
  confidence?: number;
}

export interface MemoryEntry {
  id: string;
  content: string;
  type: string;
  confidence: number;
  createdAt: string;
}

export interface ChainStatus {
  passive: { active: boolean; lastTrigger: string };
  active: { active: boolean; pendingCount: number };
  drift: { active: boolean; lastTrigger: string };
}

export interface PluginInfo {
  name: string;
  version: string;
  description: string;
  actions: string[];
}

export interface PushRecord {
  push_type: string;
  message: string;
  priority_score: number;
  cost_score: number;
  timestamp: string;
  feedback?: string;
}

export interface MessageResponse {
  reply: string;
  chain: string;
  memory_writes: MemoryWrite[];
  session_id: string;
  timestamp: string;
}

export interface PushCheckResponse {
  has_push: boolean;
  push: PushRecord | null;
}

export interface DriftCheckResponse {
  has_drift: boolean;
  drift: {
    message: string;
    drift_type: string;
    topic: string;
    confidence: number;
    chain: string;
    timestamp: string;
  } | null;
}

export interface StatusResponse {
  status: string;
  version: string;
  uptime: string;
  active_sessions: number;
  memory_count: number;
}

export type PanelType = 'chat' | 'memory' | 'plugins' | 'push' | 'token' | 'settings';

export interface TokenUsageDay {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface TokenUsageMonth {
  year: number;
  month: number;
  total_prompt: number;
  total_completion: number;
  total: number;
  daily: TokenUsageDay[];
}