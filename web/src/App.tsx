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

  useTheme();

  useEffect(() => {
    checkConnection();
    recordConsent();
  }, [checkConnection, recordConsent]);

  useEffect(() => {
    const pushInterval = setInterval(() => { checkPush(); }, 30000);
    return () => clearInterval(pushInterval);
  }, [checkPush]);

  useEffect(() => {
    const driftInterval = setInterval(() => { checkDrift(); }, 60000);
    return () => clearInterval(driftInterval);
  }, [checkDrift]);

  return (
    <div className="h-screen flex bg-paper dark:bg-earth-950 transition-colors duration-500">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatHeader />
        <MessageList />
        <ChatInput />
      </main>
      {error && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 bg-warm-50 dark:bg-warm-900/30 border border-warm-200 dark:border-warm-800 text-earth-700 dark:text-earth-200 px-4 py-2.5 rounded-organic shadow-sm text-sm animate-slide-up">
            <span>{error}</span>
            <button onClick={clearError} className="text-warm-400 dark:text-warm-500 hover:text-earth-700 dark:hover:text-earth-300 font-medium text-xs ml-1 transition-colors duration-300">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}