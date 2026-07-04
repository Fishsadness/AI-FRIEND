import ReactMarkdown from 'react-markdown';
import type { Message } from '../../types';
import { MessageCircle, Bell, Compass, User, Brain } from 'lucide-react';

const chainConfig = {
  passive: { label: '被动回复', icon: <MessageCircle size={10} />, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  active:  { label: '主动推送', icon: <Bell size={10} />,            color: 'text-blue-500 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
  drift:   { label: 'Drift探索', icon: <Compass size={10} />,       color: 'text-amber-500 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-500/10' },
  system:  { label: '系统',     icon: <MessageCircle size={10} />,  color: 'text-gray-400 dark:text-gray-500',     bg: 'bg-gray-50 dark:bg-gray-800' },
};

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const chain = chainConfig[message.chain] || chainConfig.system;

  return (
    <div className={`flex gap-3 px-4 py-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
          <Brain size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-colors ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-white dark:bg-[#2a2a33] text-gray-700 dark:text-gray-200 rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-1 prose-ul:my-0.5 prose-li:my-0 prose-code:text-xs">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${chain.bg} ${chain.color} transition-colors`}>
            {chain.icon}
            {chain.label}
          </span>
          {message.memoryWrites && message.memoryWrites.length > 0 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
              <Brain size={10} />
              +{message.memoryWrites.length} 记忆
            </span>
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
          <User size={14} className="text-gray-500 dark:text-gray-400" />
        </div>
      )}
    </div>
  );
}