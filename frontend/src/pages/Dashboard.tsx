/** Dashboard — stats, charts, and recent activity computed from AppContext API data. */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Users, ArrowUpDown, DollarSign, Star, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard, ChartCard, Card } from '../components/Card';
import { Avatar, TypeBadge, StatusBadge, Badge } from '../components/UI';
import { Loader } from '../components/Loader';
import { useApp } from '../context/AppContext';
import { formatDistanceToNow } from '../lib/utils';
import type { ChartDataPoint, TypeDistribution } from '../types';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600 dark:text-gray-300">
          <span className="font-medium">{p.name === 'amount' ? `$${Number(p.value).toLocaleString()}` : p.value}</span>
          {' '}{p.name === 'amount' ? 'volume' : 'transactions'}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { users, transactions, dataLoading } = useApp();
  const chartData: ChartDataPoint[] = useMemo(() => {
    const dateMap = new Map<string, { amount: number; count: number }>();
    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      dateMap.set(key, { amount: 0, count: 0 });
    }
    transactions.forEach((tx) => {
      const key = tx.date.split('T')[0];
      const row = dateMap.get(key);
      if (row) {
        row.amount += tx.amount;
        row.count += 1;
      }
    });
    return Array.from(dateMap.entries()).map(([key, value]) => ({
      date: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: value.amount,
      count: value.count,
    }));
  }, [transactions]);

  const typeDistributionData: TypeDistribution[] = useMemo(() => {
    const total = transactions.length || 1;
    const labels: Record<string, string> = {
      transfer: 'Transfer',
      payment: 'Payment',
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      refund: 'Refund',
    };
    const colors: Record<string, string> = {
      transfer: '#7C3AED',
      payment: '#3B82F6',
      deposit: '#10B981',
      withdrawal: '#F59E0B',
      refund: '#EF4444',
    };
    return Object.keys(labels).map((k) => {
      const count = transactions.filter((tx) => tx.type === k).length;
      return { name: labels[k], value: Math.round((count / total) * 100), color: colors[k] };
    });
  }, [transactions]);

  const activities = useMemo(() => transactions.slice(0, 20).map((tx, i) => ({
    id: `${tx.id}-${i}`,
    userName: tx.userName,
    userAvatar: tx.userAvatar,
    action: `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} of $${tx.amount.toLocaleString()}`,
    time: tx.date,
    type: tx.type,
  })), [transactions]);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalTx: transactions.length,
    totalAmount: transactions.reduce((s, t) => s + t.amount, 0),
    avgScore: users.length ? Math.round(users.reduce((s, u) => s + u.score, 0) / users.length) : 0,
  }), [users, transactions]);

  const top3 = users.slice(0, 3);
  const recent = transactions.slice(0, 8);

  if (dataLoading) return <Loader />;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-[1400px]">
      {/* Welcome */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/50 text-sm font-medium">Good morning</p>
            <h2 className="text-2xl font-bold mt-1">Transaction Ranking System</h2>
            <p className="text-white/60 text-sm mt-1">You have <span className="text-violet-400 font-semibold">{stats.totalTx} transactions</span> across {stats.totalUsers} users</p>
          </div>
          <Link to="/new-transaction">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-900/40 transition-colors whitespace-nowrap">
              New Transaction <ArrowRight size={15} />
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} change="+4 this week" changeType="up" icon={<Users size={20} className="text-violet-600 dark:text-violet-400" />} iconBg="bg-violet-50 dark:bg-violet-500/10" subtitle="Active participants" />
        <StatCard title="Total Transactions" value={stats.totalTx} change="+12 today" changeType="up" icon={<ArrowUpDown size={20} className="text-blue-600 dark:text-blue-400" />} iconBg="bg-blue-50 dark:bg-blue-500/10" subtitle="All time" />
        <StatCard title="Total Volume" value={`$${(stats.totalAmount / 1000000).toFixed(2)}M`} change="+8.3%" changeType="up" icon={<DollarSign size={20} className="text-emerald-600 dark:text-emerald-400" />} iconBg="bg-emerald-50 dark:bg-emerald-500/10" subtitle="Transaction volume" />
        <StatCard title="Avg Score" value={stats.avgScore.toLocaleString()} change="+62 pts" changeType="up" icon={<Star size={20} className="text-amber-500" />} iconBg="bg-amber-50 dark:bg-amber-500/10" subtitle="Per user average" />
      </motion.div>

      {/* Top 3 + Recent */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Performers</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Highest ranked users</p>
            </div>
            <Link to="/leaderboard">
              <motion.span whileHover={{ x: 2 }} className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1 hover:text-violet-700">
                View all <ArrowRight size={12} />
              </motion.span>
            </Link>
          </div>
          <div className="space-y-3">
            {top3.map((user, i) => (
              <motion.div key={user.id} whileHover={{ x: 2 }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400' : i === 1 ? 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300' : 'bg-orange-100 dark:bg-orange-500/15 text-orange-500 dark:text-orange-400'}`}>
                  {i + 1}
                </div>
                <Avatar name={user.name} colorClass={user.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{user.transactionCount} transactions</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-violet-600 dark:text-violet-400">{user.score.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">pts</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Latest activity</p>
            </div>
            <Link to="/history">
              <motion.span whileHover={{ x: 2 }} className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
                View all <ArrowRight size={12} />
              </motion.span>
            </Link>
          </div>
          <div className="space-y-2">
            {recent.map(tx => (
              <motion.div key={tx.id} whileHover={{ x: 1 }} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <Avatar name={tx.userName} colorClass={tx.userAvatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{tx.userName}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{tx.id}</p>
                </div>
                <TypeBadge type={tx.type} />
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">${tx.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatDistanceToNow(tx.date)}</p>
                </div>
                <StatusBadge status={tx.status} />
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard title="Transaction Volume" subtitle="Last 30 days" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="amount" stroke="#7C3AED" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#7C3AED' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Type Distribution" subtitle="By transaction type">
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={typeDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {typeDistributionData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${Number(v ?? 0)}%`, 'Share']} contentStyle={{ background: 'var(--tooltip-bg, white)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 w-full mt-2">
              {typeDistributionData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[11px] text-gray-600 dark:text-gray-300 truncate">{d.name} <span className="text-gray-400 dark:text-gray-500">{d.value}%</span></span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div variants={itemVariants}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={15} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Latest Activity</h3>
                <Badge variant="purple">{activities.length}</Badge>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100 dark:bg-white/10" />
            <div className="space-y-3">
              {activities.slice(0, 8).map((act, i) => (
                <motion.div key={act.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-start gap-4 pl-10 relative">
                  <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-violet-500 border-2 border-white dark:border-[#1E293B] shadow-sm" />
                  <Avatar name={act.userName} colorClass={act.userAvatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 dark:text-gray-100">
                      <span className="font-semibold">{act.userName}</span>
                      {' '}<span className="text-gray-500 dark:text-gray-400">completed</span>{' '}
                      <span className="font-medium text-violet-600 dark:text-violet-400">{act.action}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{formatDistanceToNow(act.time)}</p>
                  </div>
                  <TypeBadge type={act.type} />
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
