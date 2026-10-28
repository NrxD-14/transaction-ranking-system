/** Admin dashboard — system stats, health, and recent activity. */
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, ArrowUpDown, DollarSign, Activity, TrendingUp,
  Server, Database, Crown, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard, Card } from '../../components/Card';
import { Avatar, Badge, StatusBadge } from '../../components/UI';
import { Loader } from '../../components/Loader';
import { adminApi } from '../../lib/api';
import { useAdminPolling } from '../../hooks/useAdminPolling';
import type { AdminStats } from '../../types';
import { formatCurrency, formatDistanceToNow } from '../../lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await adminApi.getDashboard();
      setStats(res.data);
      setError('');
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useAdminPolling(load);

  if (loading) return <Loader />;
  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-500">{error || 'No data available'}</p>
      </div>
    );
  }

  const healthColor = stats.systemHealth.status === 'healthy' ? 'text-emerald-500' : stats.systemHealth.status === 'degraded' ? 'text-amber-500' : 'text-red-500';

  const chartData = stats.recentActivities.slice(0, 7).reverse().map((a, i) => ({
    name: `T${i + 1}`,
    amount: a.amount ?? 0,
  }));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4"
      >
        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={20} className="text-violet-600" />} iconBg="bg-violet-50 dark:bg-violet-500/10" />
        <StatCard title="Total Transactions" value={stats.totalTransactions.toLocaleString()} icon={<ArrowUpDown size={20} className="text-blue-500" />} iconBg="bg-blue-50 dark:bg-blue-500/10" />
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<DollarSign size={20} className="text-emerald-500" />} iconBg="bg-emerald-50 dark:bg-emerald-500/10" />
        <StatCard title="Avg Transaction" value={formatCurrency(stats.averageTransaction)} icon={<TrendingUp size={20} className="text-amber-500" />} iconBg="bg-amber-50 dark:bg-amber-500/10" />
        <StatCard title="Today's Transactions" value={stats.todayTransactions} icon={<Activity size={20} className="text-rose-500" />} iconBg="bg-rose-50 dark:bg-rose-500/10" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Activity Volume</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#7C3AED" fill="url(#adminGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={16} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Ranked User</h3>
            </div>
            {stats.topRankedUser ? (
              <div className="flex items-center gap-3">
                <Avatar name={stats.topRankedUser.name} colorClass={stats.topRankedUser.avatar} profilePicture={stats.topRankedUser.profilePicture} size="lg" />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.topRankedUser.name}</p>
                  <p className="text-xs text-gray-500">{stats.topRankedUser.score.toLocaleString()} pts · Rank #{stats.topRankedUser.rank}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No users yet</p>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <Server size={14} /> API Status
                </div>
                <Badge variant="success"><CheckCircle2 size={10} className="mr-1" />{stats.apiStatus}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <Database size={14} /> Database
                </div>
                <Badge variant="success">{stats.databaseStatus}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <Activity size={14} /> System Health
                </div>
                <span className={`text-xs font-bold capitalize ${healthColor}`}>
                  {stats.systemHealth.score}% · {stats.systemHealth.status}
                </span>
              </div>
              {(stats.systemHealth.errors > 0 || stats.systemHealth.warnings > 0) && (
                <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 pt-1">
                  <AlertTriangle size={12} />
                  {stats.systemHealth.errors} errors · {stats.systemHealth.warnings} warnings
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {stats.recentActivities.map(activity => (
              <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-white/5 last:border-0">
                <Avatar name={activity.userName} colorClass={activity.userAvatar} profilePicture={activity.userProfilePicture} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{activity.action}</p>
                  <p className="text-[11px] text-gray-400">{activity.userName} · {formatDistanceToNow(activity.time)}</p>
                </div>
                {activity.amount != null && (
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(activity.amount)}</span>
                )}
                {'status' in activity && activity.status && (
                  <StatusBadge status={activity.status as string} />
                )}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
