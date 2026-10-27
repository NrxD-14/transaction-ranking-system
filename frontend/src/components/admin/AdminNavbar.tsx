/** Admin top navbar with page titles. */
import { Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLocation } from 'react-router-dom';
import { AccountMenu } from '../AccountMenu';

const titles: Record<string, { title: string; subtitle: string }> = {
  '/admin/dashboard': { title: 'Admin Dashboard', subtitle: 'System overview and health metrics' },
  '/admin/users': { title: 'Users', subtitle: 'Manage registered accounts and roles' },
  '/admin/transactions': { title: 'Transactions', subtitle: 'Complete transaction history' },
  '/admin/leaderboard': { title: 'Leaderboard', subtitle: 'Live rankings and score breakdown' },
  '/admin/analytics': { title: 'Analytics', subtitle: 'Revenue, growth, and activity insights' },
  '/admin/logs': { title: 'System Logs', subtitle: 'Audit trail and event history' },
  '/admin/settings': { title: 'Settings', subtitle: 'System configuration and about' },
};

export function AdminNavbar() {
  const { setSidebarOpen } = useApp();
  const location = useLocation();
  const pageInfo = titles[location.pathname] ?? { title: 'Admin', subtitle: '' };

  return (
    <header className="h-16 bg-white dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-white/10 px-4 lg:px-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <Menu size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white">{pageInfo.title}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{pageInfo.subtitle}</p>
        </div>
      </div>
      <AccountMenu />
    </header>
  );
}
