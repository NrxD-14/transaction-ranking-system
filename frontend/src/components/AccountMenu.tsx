import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LogOut, Settings, UserCircle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Avatar } from './UI';
import { AccountProfileModal } from './AccountProfileModal';

export function AccountMenu() {
  const { authUser, logout, addToast } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    addToast({ type: 'info', title: 'Signed out', message: 'You have been logged out.' });
    navigate('/login');
  };

  if (!authUser) return null;

  return (
    <>
      <div ref={menuRef} className="relative">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <Avatar name={authUser.name} colorClass={authUser.avatar} size="sm" />
          <div className="hidden sm:block text-left min-w-0">
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{authUser.name}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{authUser.email}</p>
          </div>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#111827] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50"
              role="menu"
            >
              <div className="px-4 py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <Avatar name={authUser.name} colorClass={authUser.avatar} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{authUser.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{authUser.email}</p>
                    {authUser.location && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{authUser.location}</p>
                    )}
                  </div>
                </div>
                {authUser.bio && (
                  <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">{authUser.bio}</p>
                )}
              </div>

              <div className="py-1.5">
                <MenuButton
                  icon={<UserCircle size={16} />}
                  label="Account details"
                  onClick={() => {
                    setOpen(false);
                    setProfileOpen(true);
                  }}
                />
                <MenuButton
                  icon={<Settings size={16} />}
                  label="Settings"
                  onClick={() => {
                    setOpen(false);
                    navigate('/settings');
                  }}
                />
                {authUser.role === 'admin' && (
                  <MenuButton
                    icon={<Shield size={16} />}
                    label="Admin Panel"
                    onClick={() => {
                      setOpen(false);
                      navigate('/admin/dashboard');
                    }}
                  />
                )}
              </div>

              <div className="border-t border-gray-100 dark:border-white/10 py-1.5">
                <MenuButton
                  icon={<LogOut size={16} />}
                  label="Sign out"
                  danger
                  onClick={handleLogout}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AccountProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
        danger
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
