/**
 * Shared TypeScript interfaces matching backend Pydantic response shapes.
 * AuthUser = login account; User = ranking profile with score/rank.
 */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  userId: string;
  role: 'admin' | 'user';
  avatar: string;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  createdAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  avatar?: string;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedAt: string;
  rank: number;
  score: number;
  totalAmount: number;
  transactionCount: number;
  consistency: number;
  recentActivity: string;
  badge: 'gold' | 'silver' | 'bronze' | 'none';
}

export type TransactionType = 'transfer' | 'payment' | 'deposit' | 'withdrawal' | 'refund';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  amount: number;
  type: TransactionType;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  score: number;
  description: string;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  amount?: number;
  time: string;
  type: TransactionType;
  status?: string;
}

export interface ChartDataPoint {
  date: string;
  amount: number;
  count: number;
}

export interface TypeDistribution {
  name: string;
  value: number;
  color: string;
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface Settings {
  darkMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  notifications: {
    email: boolean;
    push: boolean;
    transactionAlerts: boolean;
    rankChanges: boolean;
    weeklyReport: boolean;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  averageTransaction: number;
  todayTransactions: number;
  topRankedUser: User | null;
  recentActivities: Activity[];
  systemHealth: { score: number; status: string; errors: number; warnings: number };
  apiStatus: string;
  databaseStatus: string;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  joinedAt: string;
  transactionCount: number;
  totalAmount: number;
}

export interface AdminLogEntry {
  id: number;
  level: string;
  category: string;
  message: string;
  userEmail: string | null;
  createdAt: string;
}

export interface AdminLogDetails {
  account: {
    userId: string;
    name: string;
    email: string;
    role: string;
    avatar: string;
    phone: string | null;
    location: string | null;
    bio: string | null;
    joinedAt: string;
    transactionCount: number;
    totalAmount: number;
  } | null;
  transactions: Transaction[];
  activities: AdminLogEntry[];
}

export interface AdminAnalytics {
  revenue: { date: string; amount: number }[];
  transactions: { date: string; count: number }[];
  userGrowth: { month: string; users: number }[];
  dailyActivity: { date: string; count: number }[];
  transactionTypes: TypeDistribution[];
  topUsers: { name: string; score: number; amount: number }[];
  monthlyTrend: { month: string; revenue: number; count: number }[];
}

export interface AdminSettingsInfo {
  applicationVersion: string;
  database: string;
  backendStatus: string;
  environment: string;
  apiVersion: string;
  developer: typeof import('../constants/app').DEVELOPER;
}
