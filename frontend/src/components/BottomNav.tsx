import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Trophy, User, ScrollText } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { path: '/new-transaction', icon: PlusCircle, label: 'New' },
  { path: '/user-summary', icon: User, label: 'Users' },
  { path: '/history', icon: ScrollText, label: 'History' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-white/10 z-40 pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          const isNew = path === '/new-transaction';
          return (
            <NavLink key={path} to={path} className="flex flex-col items-center gap-1 px-3 py-1 relative">
              {isNew ? (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 -mt-5 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-400/40"
                >
                  <Icon size={22} className="text-white" strokeWidth={2} />
                </motion.div>
              ) : (
                <div className={`flex flex-col items-center gap-1 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium">{label}</span>
                  {isActive && <motion.div layoutId="bottom-nav-dot" className="absolute -top-0.5 w-4 h-0.5 bg-violet-600 dark:bg-violet-400 rounded-full" />}
                </div>
              )}
              {isNew && <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">New</span>}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
