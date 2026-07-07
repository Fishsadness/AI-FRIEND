import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useAppStore } from '../../store';
import { Send, Leaf } from 'lucide-react';

export default function ChatInput() {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const isLoading = useAppStore((s) => s.isLoading);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  }, [text]);

  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-earth-200 dark:border-earth-800 bg-earth-50/80 dark:bg-earth-900/80 backdrop-blur-sm transition-colors duration-500">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-end gap-2 bg-white dark:bg-earth-800 rounded-organic border border-earth-200 dark:border-earth-700 focus-within:border-sage-400 dark:focus-within:border-sage-500 focus-within:ring-2 focus-within:ring-sage-100 dark:focus-within:ring-sage-500/20 transition-all duration-500 px-4 py-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="给小艾发消息... (Enter 发送, Shift+Enter 换行)"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-earth-700 dark:text-earth-200 placeholder:text-earth-400 dark:placeholder:text-earth-500 py-1 max-h-[160px]"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || isLoading}
            className="shrink-0 p-2 rounded-organic bg-earth-700 text-earth-50 hover:bg-earth-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500 active:translate-y-0.5"
          >
            {isLoading ? <Leaf size={16} className="animate-breathe" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-[10px] text-earth-400 dark:text-earth-500 text-center mt-1.5">
          小艾是AI助手，仅供参考。请勿分享敏感信息。
        </p>
      </div>
    </div>
  );
}