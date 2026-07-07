import ReactMarkdown from 'react-markdown';
import type { Message } from '../../types';
import { MessageCircle, Bell, Compass, User, Leaf } from 'lucide-react';

const chainConfig = {
  passive: { label: '被动回复', icon: <MessageCircle size={10} />, color: 'text-sage-600 dark:text-sage-400', bg: 'bg-sage-50 dark:bg-sage-500/10' },
  active:  { label: '主动推送', icon: <Bell size={10} />,            color: 'text-warm-600 dark:text-warm-400', bg: 'bg-warm-50 dark:bg-warm-500/10' },
  drift:   { label: 'Drift探索', icon: <Compass size={10} />,       color: 'text-earth-600 dark:text-earth-400', bg: 'bg-earth-50 dark:bg-earth-500/10' },
  system:  { label: '系统',     icon: <MessageCircle size={10} />,  color: 'text-earth-400 dark:text-earth-500', bg: 'bg-earth-50 dark:bg-earth-800' },
};

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const chain = chainConfig[message.chain] || chainConfig.system;

  return (
    <div className={`flex gap-3 px-4 py-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-blob-sm bg-gradient-to-br from-warm-400 to-earth-700 flex items-center justify-center shrink-0 animate-morph">
          <Leaf size={14} className="text-earth-50" />
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`px-4 py-2.5 rounded-organic text-sm leading-relaxed transition-colors duration-500 ${
            isUser
              ? 'bg-earth-700 text-earth-50 rounded-br-lg'
              : 'bg-white dark:bg-earth-800 text-earth-700 dark:text-earth-200 rounded-bl-lg shadow-sm border border-earth-200 dark:border-earth-700'
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
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] ${chain.bg} ${chain.color} transition-colors duration-500`}>
            {chain.icon}
            {chain.label}
          </span>
          {message.memoryWrites && message.memoryWrites.length > 0 && (
            <span className="text-[10px] text-earth-400 dark:text-earth-500 flex items-center gap-0.5">
              <Leaf size={10} />
              +{message.memoryWrites.length} 记忆
            </span>
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-blob-sm bg-earth-200 dark:bg-earth-700 flex items-center justify-center shrink-0">
          <User size={14} className="text-earth-500 dark:text-earth-300" />
        </div>
      )}
    </div>
  );
}