/**
 * Global application state: auth session, settings, users, transactions.
 * Loads ranking + transaction data from API after successful login/signup.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi, setAuthToken, getAuthToken, transactionApi, userApi } from '../lib/api';
import type { AuthUser, Settings, Transaction, UpdateProfilePayload, User } from '../types';

interface AppContextType {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  users: User[];
  transactions: Transaction[];
  dataLoading: boolean;
  reloadData: () => Promise<void>;
  authUser: AuthUser | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (name: string, email: string, password: string) => Promise<AuthUser>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  logout: () => void;
  evaluationUnlocked: boolean;
  unlockEvaluationAccess: () => void;
  resetEvaluationAccess: () => void;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

const defaultSettings: Settings = {
  darkMode: false,
  autoRefresh: true,
  refreshInterval: 30,
  notifications: {
    email: true,
    push: false,
    transactionAlerts: true,
    rankChanges: true,
    weeklyReport: false,
  },
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem('trs-settings');
      return stored ? JSON.parse(stored) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [evaluationUnlocked, setEvaluationUnlocked] = useState(false);

  // Remove legacy persisted evaluation keys from earlier versions
  useEffect(() => {
    sessionStorage.removeItem('trs-evaluation-unlocked');
    localStorage.removeItem('trs-evaluation-unlocked');
  }, []);

  const unlockEvaluationAccess = useCallback(() => {
    setEvaluationUnlocked(true);
  }, []);

  const resetEvaluationAccess = useCallback(() => {
    setEvaluationUnlocked(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('trs-settings', JSON.stringify(settings));
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const addToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => removeToast(id), 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const reloadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [usersRes, txRes] = await Promise.all([
        userApi.getRanking(),
        transactionApi.getAll(),
      ]);
      setUsers(usersRes.data.users);
      setTransactions(txRes.data.transactions);
    } catch {
      addToast({ type: 'error', title: 'Failed to load data', message: 'Could not fetch backend data.' });
    } finally {
      setDataLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const user = { ...res.data.user, role: res.data.user.role ?? 'user' };
    setAuthToken(res.data.accessToken);
    setAuthUser(user);
    await reloadData();
    return user;
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await authApi.signup({ name, email, password });
    const user = { ...res.data.user, role: res.data.user.role ?? 'user' };
    setAuthToken(res.data.accessToken);
    setAuthUser(user);
    await reloadData();
    return user;
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    const res = await authApi.updateProfile(payload);
    setAuthUser(res.data);
    await reloadData();
  };

  const logout = () => {
    setAuthToken(null);
    setAuthUser(null);
    setUsers([]);
    setTransactions([]);
    resetEvaluationAccess();
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await authApi.me();
        setAuthUser({ ...res.data, role: res.data.role ?? 'user' });
        await reloadData();
      } catch {
        setAuthToken(null);
        setAuthUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    void initAuth();
  }, [reloadData]);

  return (
    <AppContext.Provider value={{
      settings,
      updateSettings,
      toasts,
      addToast,
      removeToast,
      sidebarOpen,
      setSidebarOpen,
      users,
      transactions,
      dataLoading,
      reloadData,
      authUser,
      authLoading,
      login,
      signup,
      updateProfile,
      logout,
      evaluationUnlocked,
      unlockEvaluationAccess,
      resetEvaluationAccess,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
