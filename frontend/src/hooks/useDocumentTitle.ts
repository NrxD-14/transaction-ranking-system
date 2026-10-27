/** Syncs document title with current route. */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_NAME } from '../constants/app';

const titles: Record<string, string> = {
  '/login': 'Sign In',
  '/signup': 'Create Account',
  '/access-denied': 'Access Denied',
  '/dashboard': 'Dashboard',
  '/new-transaction': 'New Transaction',
  '/leaderboard': 'Leaderboard',
  '/user-summary': 'User Summary',
  '/history': 'Transaction History',
  '/settings': 'Settings',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'Users',
  '/admin/transactions': 'Transactions',
  '/admin/leaderboard': 'Leaderboard',
  '/admin/analytics': 'Analytics',
  '/admin/logs': 'System Logs',
  '/admin/settings': 'Settings',
};

export function useDocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = titles[pathname] ?? 'App';
    document.title = `${page} — ${APP_NAME}`;
  }, [pathname]);
}
