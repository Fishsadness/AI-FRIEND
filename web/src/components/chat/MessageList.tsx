import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store';
import MessageBubble from './MessageBubble';
import { Loader2 } from 'lucide-react';

export default function MessageList() {
  const messages = useAppStore((s) => s.messages);
  const isLoading = useAppStore((s) => s.isLoading);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <span className="text-2xl text-white">✨</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">你好，我是小艾</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
            我是你的AI好友，你可以随时和我聊天。我会记住你的喜好，主动提醒重要事项，还会在合适的时候开启新话题。
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Suggestion text="帮我制定一个学习计划" />
            <Suggestion text="最近有什么有趣的新闻？" />
            <Suggestion text="提醒我每天运动" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && (
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Loader2 size={14} className="text-white animate-spin" />
          </div>
          <div className="flex gap-1 px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function Suggestion({ text }: { text: string }) {
  const sendMessage = useAppStore((s) => s.sendMessage);
  return (
    <button
      onClick={() => sendMessage(text)}
      className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-[#2a2a33] border border-gray-200 dark:border-gray-700 rounded-full hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 hover:shadow-sm transition-all"
    >
      {text}
    </button>
  );
}