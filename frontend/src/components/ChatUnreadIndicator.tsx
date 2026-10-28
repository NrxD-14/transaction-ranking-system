import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { chatApi } from '../lib/api';

export function ChatUnreadIndicator({ admin = false }: { admin?: boolean }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const response = await chatApi.getUnreadCounts();
      const directTotal = Object.values(response.data.directCounts).reduce((total, count) => total + count, 0);
      setUnreadCount(response.data.groupCount + directTotal);
    } catch (error) {
      console.error('Failed to refresh unread chat indicator:', error);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 10_000);
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', refreshOnVisible);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, [refresh]);

  return (
    <Link
      to={admin ? '/admin/chat' : '/chat'}
      aria-label={`Chat${unreadCount ? `, ${unreadCount} unread messages` : ''}`}
      title={unreadCount ? `${unreadCount} unread chat messages` : 'Chat'}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
    >
      <MessageCircle size={18} className="text-gray-600 dark:text-gray-300" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
