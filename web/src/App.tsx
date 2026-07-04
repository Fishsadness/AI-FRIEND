import { useEffect } from 'react';
import Sidebar from './components/sidebar/Sidebar';
import ChatHeader from './components/chat/ChatHeader';
import MessageList from './components/chat/MessageList';
import ChatInput from './components/chat/ChatInput';
import { useAppStore } from './store';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const checkConnection = useAppStore((s) => s.checkConnection);
  const checkPush = useAppStore((s) => s.checkPush);
  const checkDrift = useAppStore((s) => s.checkDrift);
  const recordConsent = useAppStore((s) => s.recordConsent);
  const error = useAppStore((s) => s.error);
  const clearError = useAppStore((s) => s.clearError);

  // 自动跟随系统主题
  useTheme();

  // 初始化连接
  useEffect(() => {
    checkConnection();
    recordConsent();
  }, [checkConnection, recordConsent]);

  // 定时检查推送（每30秒）
  useEffect(() => {
    const pushInterval = setInterval(() => {
      checkPush();
    }, 30000);
    return () => clearInterval(pushInterval);
  }, [checkPush]);

  // 定时检查Drift（每60秒）
  useEffect(() => {
    const driftInterval = setInterval(() => {
      checkDrift();
    }, 60000);
    return () => clearInterval(driftInterval);
  }, [checkDrift]);

  return (
    <div className="h-screen flex bg-[#f8f8fa] dark:bg-[#1a1a1f] transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatHeader />
        <MessageList />
        <ChatInput />
      </main>
      {error && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2.5 rounded-xl shadow-lg text-sm animate-slide-up">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-medium text-xs ml-1">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}