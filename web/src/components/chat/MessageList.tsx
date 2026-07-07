import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store';
import MessageBubble from './MessageBubble';
import { Leaf } from 'lucide-react';

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
          <div className="w-16 h-16 rounded-blob bg-gradient-to-br from-warm-400 to-earth-700 flex items-center justify-center mx-auto mb-4 animate-morph">
            <span className="text-2xl">🌿</span>
          </div>
          <h2 className="text-lg font-serif font-semibold text-earth-700 dark:text-earth-200 mb-2">你好，我是小艾</h2>
          <p className="text-sm text-earth-400 dark:text-earth-500 leading-relaxed">
            我是你的AI好友，你可以随时和我聊天。我会记住你的喜好，主动提醒重要事项，还会在合适的时候开启新话题。
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-6">
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
          <div className="w-8 h-8 rounded-blob-sm bg-gradient-to-br from-warm-400 to-earth-700 flex items-center justify-center animate-morph">
            <Leaf size={14} className="text-earth-50 animate-breathe" />
          </div>
          <div className="flex gap-1 px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-earth-300 dark:bg-earth-600 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-earth-300 dark:bg-earth-600 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-earth-300 dark:bg-earth-600 animate-bounce [animation-delay:300ms]" />
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
      className="px-3 py-1.5 text-xs text-earth-500 dark:text-earth-400 bg-white dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-full hover:border-earth-300 dark:hover:border-earth-600 hover:text-earth-700 dark:hover:text-earth-200 hover:translate-y-0.5 transition-all duration-500"
    >
      {text}
    </button>
  );
}