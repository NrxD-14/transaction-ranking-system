/** Leaderboard — displays GET /ranking results with search, sort, and pagination. */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import { Card } from '../components/Card';
import { Loader } from '../components/Loader';
import { SearchBar } from '../components/SearchBar';
import { Avatar, Badge } from '../components/UI';
import { useApp } from '../context/AppContext';
import { formatDistanceToNow } from '../lib/utils';
import type { User } from '../types';

const badgeIcons: Record<string, { icon: typeof Trophy; color: string; bg: string }> = {
  gold: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/15' },
  silver: { icon: Trophy, color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-white/10' },
  bronze: { icon: Medal, color: 'text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/15' },
};

function PodiumCard({ user, position }: { user: User; position: number }) {
  const badgeInfo = badgeIcons[user.badge] ?? badgeIcons.gold;
  const Icon = badgeInfo.icon;
  const heights = ['h-28', 'h-20', 'h-16'];
  const scales = ['scale-105', 'scale-100', 'scale-95'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: position * 0.1 }}
      whileHover={{ y: -6 }}
      className={`flex flex-col items-center ${scales[position]} flex-1`}
    >
      <div className={`w-10 h-10 rounded-xl ${badgeInfo.bg} flex items-center justify-center mb-3`}>
        <Icon size={20} className={badgeInfo.color} />
      </div>
      <Avatar name={user.name} colorClass={user.avatar} size="lg" />
      <p className="text-sm font-bold text-white mt-3 text-center leading-tight">{user.name.split(' ')[0]}</p>
      <p className="text-violet-300 text-xs mt-0.5 font-medium">{user.score.toLocaleString()} pts</p>
      <div className={`w-full ${heights[position]} ${position === 0 ? 'bg-gradient-to-t from-violet-600 to-violet-500' : position === 1 ? 'bg-gradient-to-t from-slate-600 to-slate-500' : 'bg-gradient-to-t from-orange-600 to-orange-500'} rounded-t-2xl mt-4 flex items-start justify-center pt-3`}>
        <span className="text-2xl font-black text-white/70">{position + 1}</span>
      </div>
    </motion.div>
  );
}

type SortKey = 'rank' | 'score' | 'totalAmount' | 'transactionCount' | 'consistency';

export default function Leaderboard() {
  const { users, dataLoading, reloadData } = useApp();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'rank' ? 'asc' : 'desc'); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const mult = sortDir === 'asc' ? 1 : -1;
    return (a[sortKey] - b[sortKey]) * mult;
  });

  const paginated = sorted.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(sorted.length / perPage);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reloadData();
    setRefreshing(false);
  };

  useEffect(() => { setPage(1); }, [search, sortKey]);

  const columns: { key: SortKey; label: string }[] = [
    { key: 'rank', label: 'Rank' },
    { key: 'score', label: 'Score' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'transactionCount', label: 'Transactions' },
    { key: 'consistency', label: 'Consistency' },
  ];

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className={`ml-1 inline-block transition-opacity ${sortKey === k ? 'opacity-100' : 'opacity-30'}`}>
      {sortKey === k && sortDir === 'desc' ? '↓' : '↑'}
    </span>
  );

  if (dataLoading) return <Loader />;

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Podium */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#0F172A] to-[#1E1B4B] rounded-2xl p-6 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Trophy size={20} className="text-amber-400" /> Top Performers
              </h2>
              <p className="text-white/40 text-xs mt-0.5">Ranked by total score</p>
            </div>
            <Badge variant="purple">{users.length} users</Badge>
          </div>
          <div className="flex items-end justify-center gap-4 max-w-md mx-auto">
            {users[1] && <PodiumCard user={users[1]} position={1} />}
            {users[0] && <PodiumCard user={users[0]} position={0} />}
            {users[2] && <PodiumCard user={users[2]} position={2} />}
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <SearchBar value={search} onChange={setSearch} placeholder="Search users..." className="w-full sm:w-64" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{filtered.length} results</span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-xl transition-colors disabled:opacity-60"
            >
              <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
                <RefreshCw size={13} />
              </motion.div>
              Refresh
            </motion.button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                {columns.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 transition-colors select-none whitespace-nowrap">
                    {col.label} <SortIcon k={col.key} />
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">User</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Recent Activity</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paginated.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${user.rank === 1 ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400' : user.rank === 2 ? 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300' : user.rank === 3 ? 'bg-orange-100 dark:bg-orange-500/15 text-orange-500 dark:text-orange-400' : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500'}`}>
                        {user.rank <= 3 ? (user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉') : user.rank}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Zap size={13} className="text-violet-500 dark:text-violet-400" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{user.score.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">${user.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-blue-500 dark:text-blue-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">{user.transactionCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-16 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${user.consistency}%` }}
                            transition={{ duration: 0.6, delay: i * 0.04 }}
                            className="h-full bg-emerald-400 rounded-full"
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300 w-8">{user.consistency}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={user.name} colorClass={user.avatar} size="sm" />
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(user.recentActivity)}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, sorted.length)} of {sorted.length} users
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === i + 1 ? 'bg-violet-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
