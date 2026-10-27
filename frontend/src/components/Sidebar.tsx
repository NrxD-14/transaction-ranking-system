import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, PlusCircle, Trophy, User, ScrollText,
  Settings, ChevronRight, Zap, Moon, Sun, X, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/new-transaction', icon: PlusCircle, label: 'New Transaction' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/user-summary', icon: User, label: 'User Summary' },
  { path: '/history', icon: ScrollText, label: 'Transaction History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { settings, updateSettings, sidebarOpen, setSidebarOpen, authUser } = useApp();
  const location = useLocation();

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        className={`
          fixed left-0 top-0 h-full w-64 bg-[#0F172A] flex flex-col z-50
          transition-transform duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-white font-bold text-sm tracking-tight">TRS</span>
              <p className="text-white/40 text-[10px] leading-none mt-0.5">Transaction Ranking</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/40 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-3 pb-2">Menu</p>
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className="block"
              >
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative
                    ${isActive
                      ? 'bg-violet-600/20 text-violet-400'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-violet-600/15 rounded-xl border border-violet-500/20"
                    />
                  )}
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className="flex-shrink-0 relative z-10" />
                  <span className="text-sm font-medium relative z-10">{label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto opacity-50 relative z-10" />}
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
          {authUser?.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-150"
            >
              <Shield size={18} strokeWidth={1.5} />
              <span className="text-sm font-medium">Admin Panel</span>
            </Link>
          )}
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-150"
          >
            {settings.darkMode ? (
              <Sun size={18} strokeWidth={1.5} />
            ) : (
              <Moon size={18} strokeWidth={1.5} />
            )}
            <span className="text-sm font-medium">{settings.darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {authUser && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
              <div className={`w-8 h-8 rounded-full ${authUser.avatar} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {authUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-medium truncate">{authUser.name}</p>
                <p className="text-white/35 text-[10px] truncate">{authUser.email}</p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
