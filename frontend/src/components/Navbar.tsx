import { Menu, Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useLocation } from 'react-router-dom';
import { AccountMenu } from './AccountMenu';

const titles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your transaction ecosystem' },
  '/new-transaction': { title: 'New Transaction', subtitle: 'Submit and record a new transaction' },
  '/leaderboard': { title: 'Leaderboard', subtitle: 'Top performers ranked by score' },
  '/user-summary': { title: 'User Summary', subtitle: 'Detailed profile and analytics per user' },
  '/history': { title: 'Transaction History', subtitle: 'Complete log of all transactions' },
  '/settings': { title: 'Settings', subtitle: 'Customize your experience' },
};

export function Navbar() {
  const { setSidebarOpen } = useApp();
  const location = useLocation();
  const pageInfo = titles[location.pathname] ?? { title: 'TRS', subtitle: '' };

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

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 text-sm hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
        >
          <Search size={14} />
          <span className="text-xs">Quick search...</span>
          <kbd className="text-[10px] bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 px-1.5 py-0.5 rounded font-mono text-gray-400">⌘K</kbd>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <Bell size={18} className="text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full" />
        </motion.button>

        <AccountMenu />
      </div>
    </header>
  );
}
