/** User Summary — fetches GET /summary/{userId} for score breakdown and transaction history. */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Calendar, DollarSign, Hash, Zap, TrendingUp, Activity, Clock } from 'lucide-react';
import { Card } from '../components/Card';
import { Loader } from '../components/Loader';
import { Avatar, TypeBadge, StatusBadge, ProgressBar } from '../components/UI';
import { useApp } from '../context/AppContext';
import { userApi } from '../lib/api';
import { formatDate, formatDistanceToNow, formatCurrency } from '../lib/utils';
import type { Transaction, User as UserType } from '../types';

interface SummaryData {
  rank: number;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  activeDays: number;
  scoreFactors: {
    volumeScore: number;
    countScore: number;
    consistencyScore: number;
    recencyScore: number;
    diversityScore: number;
    totalScore: number;
  };
  recentTransactions: Transaction[];
}

function ScoreBreakdownSection({ factors }: { factors: { volumeScore: number; countScore: number; consistencyScore: number; recencyScore: number; diversityScore: number } }) {
  const categories = [
    { label: 'Transaction Volume', value: factors.volumeScore, max: 100, color: 'bg-violet-500' },
    { label: 'Transaction Count', value: factors.countScore, max: 100, color: 'bg-blue-500' },
    { label: 'Consistency Score', value: factors.consistencyScore, max: 100, color: 'bg-emerald-500' },
    { label: 'Recency Bonus', value: factors.recencyScore, max: 100, color: 'bg-amber-500' },
    { label: 'Diversity Bonus', value: factors.diversityScore, max: 100, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-4">
      {categories.map((cat, i) => (
        <motion.div key={cat.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
          <ProgressBar label={cat.label} value={cat.value} max={cat.max} color={cat.color} showValue />
        </motion.div>
      ))}
    </div>
  );
}

export default function UserSummary() {
  const { users, dataLoading } = useApp();
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<SummaryData | null>(null);
  const [suggestions, setSuggestions] = useState<UserType[]>([]);
  const [focused, setFocused] = useState(false);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (val.trim().length < 1) { setSuggestions([]); return; }
    setSuggestions(users.filter(u => u.name.toLowerCase().includes(val.toLowerCase()) || u.id.toLowerCase().includes(val.toLowerCase())).slice(0, 6));
  };

  const selectUser = async (user: UserType) => {
    setQuery(user.name);
    setSuggestions([]);
    setFocused(false);
    const res = await userApi.getSummary(user.id);
    const summary = res.data as SummaryData;
    setSelectedSummary(summary);
    setSelectedUser({
      ...user,
      rank: summary.rank,
      score: summary.scoreFactors.totalScore,
    });
  };

  const userTransactions = selectedSummary?.recentTransactions ?? [];
  const uniqueDays = selectedSummary?.activeDays ?? 0;
  const avgAmount = selectedSummary?.averageAmount ?? 0;

  if (dataLoading) return <Loader />;

  return (
    <div className="max-w-[1400px] space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User size={18} className="text-violet-600 dark:text-violet-400" /> Search User
          </h2>
          <div className="relative max-w-lg">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              value={query}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="Search by name or User ID (e.g. USR-0001)..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/20 transition-all"
            />
            <AnimatePresence>
              {focused && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {suggestions.map(user => (
                    <button key={user.id} onMouseDown={() => selectUser(user)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
                      <Avatar name={user.name} colorClass={user.avatar} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{user.id} · Score: {user.score.toLocaleString()}</p>
                      </div>
                      <span className="ml-auto text-xs text-violet-500 dark:text-violet-400 font-semibold">Rank #{user.rank}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!selectedUser && (
            <div className="mt-4 flex flex-wrap gap-2">
              <p className="text-xs text-gray-400 dark:text-gray-500 mr-2 self-center">Quick select:</p>
              {users.slice(0, 5).map(u => (
                <button key={u.id} onClick={() => selectUser(u)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-violet-50 dark:hover:bg-violet-500/15 hover:text-violet-700 dark:hover:text-violet-300 text-gray-600 dark:text-gray-300 transition-colors font-medium">
                  {u.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedUser && (
          <motion.div key={selectedUser.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            {/* Profile Header */}
            <Card className="p-6 bg-gradient-to-r from-[#0F172A] to-[#1e1b4b] overflow-hidden relative">
              <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl" />
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="relative">
                  <Avatar name={selectedUser.name} colorClass={selectedUser.avatar} size="xl" />
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${selectedUser.badge === 'gold' ? 'bg-amber-400 text-amber-900' : selectedUser.badge === 'silver' ? 'bg-gray-300 text-gray-700' : selectedUser.badge === 'bronze' ? 'bg-orange-400 text-orange-900' : 'bg-violet-500 text-white'}`}>
                    #{selectedUser.rank}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{selectedUser.name}</h2>
                  <p className="text-white/50 text-sm">{selectedUser.email}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="text-xs text-white/40 flex items-center gap-1"><Hash size={11} />{selectedUser.id}</span>
                    <span className="text-xs text-white/40 flex items-center gap-1"><Calendar size={11} />Joined {formatDate(selectedUser.joinedAt)}</span>
                  </div>
                </div>
                <div className="text-right sm:text-left">
                  <p className="text-3xl font-black text-violet-400">{selectedUser.score.toLocaleString()}</p>
                  <p className="text-xs text-white/40 mt-0.5">Total Score</p>
                  <p className="text-sm font-semibold text-white mt-1">Rank #{selectedUser.rank}</p>
                </div>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Transactions', value: selectedSummary?.transactionCount ?? 0, icon: Hash, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                { label: 'Average Amount', value: formatCurrency(avgAmount), icon: DollarSign, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                  { label: 'Total Amount', value: formatCurrency(selectedSummary?.totalAmount ?? 0), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                { label: 'Unique Active Days', value: uniqueDays, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
              ].map(stat => (
                <Card key={stat.label} className="p-5">
                  <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon size={18} className={stat.color} />
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
                </Card>
              ))}
            </div>

            {/* Score + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Zap size={15} className="text-violet-500 dark:text-violet-400" /> Score Breakdown
                </h3>
                {selectedSummary && <ScoreBreakdownSection factors={selectedSummary.scoreFactors} />}
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Activity size={15} className="text-blue-500 dark:text-blue-400" /> Recent Activities
                </h3>
                {userTransactions.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">No transactions found</p>
                ) : (
                  <div className="space-y-2.5">
                    {userTransactions.slice(0, 6).map(tx => (
                      <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                          <DollarSign size={13} className="text-violet-500 dark:text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{formatCurrency(tx.amount)}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">{tx.id}</p>
                        </div>
                        <TypeBadge type={tx.type} />
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block">{formatDistanceToNow(tx.date)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Transaction Table */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-white/10">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock size={15} className="text-gray-400 dark:text-gray-500" /> Transaction History
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">({userTransactions.length} records)</span>
                </h3>
              </div>
              {userTransactions.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">No transactions for this user.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                        {['Transaction ID', 'Amount', 'Type', 'Status', 'Score', 'Date'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {userTransactions.slice(0, 10).map((tx, i) => (
                        <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">{tx.id}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(tx.amount)}</td>
                          <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                          <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                          <td className="px-4 py-3 text-xs font-semibold text-violet-600 dark:text-violet-400">{tx.score}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(tx.date)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
