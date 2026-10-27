/** Admin analytics — Recharts dashboards for revenue, growth, and activity. */
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ChartCard } from '../../components/Card';
import { Loader } from '../../components/Loader';
import { adminApi } from '../../lib/api';
import { useAdminPolling } from '../../hooks/useAdminPolling';
import type { AdminAnalytics } from '../../types';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-gray-600 dark:text-gray-300">
          {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('revenue') ? `$${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await adminApi.getAnalytics();
      setData(res.data);
    } catch (error) {
      console.error('Failed to load admin analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useAdminPolling(load);

  if (loading) return <Loader />;
  if (!data) return <p className="text-sm text-red-500">Failed to load analytics</p>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue" subtitle="Daily revenue over last 30 days">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.revenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="amount" name="Revenue" stroke="#10B981" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Transactions" subtitle="Daily transaction count">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.transactions}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Transactions" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User Growth" subtitle="Cumulative registered users">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="users" name="Users" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily Activity" subtitle="Last 14 days">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Activity" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Transaction Types" subtitle="Distribution by type">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data.transactionTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {data.transactionTypes.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Users" subtitle="By score">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.topUsers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="score" name="Score" fill="#7C3AED" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Monthly Trend" subtitle="Revenue and transaction volume by month">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="count" name="Count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </motion.div>
  );
}
