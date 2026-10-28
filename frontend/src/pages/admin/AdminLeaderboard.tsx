/** Admin leaderboard — podium, live rankings, score breakdown, formula preview. */
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Medal, RefreshCw, Zap, Info } from 'lucide-react';
import { Card } from '../../components/Card';
import { Avatar, Badge } from '../../components/UI';
import { Loader } from '../../components/Loader';
import { adminApi } from '../../lib/api';
import { useAdminPolling } from '../../hooks/useAdminPolling';
import type { User } from '../../types';
import { formatCurrency, formatDistanceToNow } from '../../lib/utils';

const badgeIcons = {
  gold: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/15' },
  silver: { icon: Trophy, color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-white/10' },
  bronze: { icon: Medal, color: 'text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/15' },
};

function PodiumCard({ user, position }: { user: User; position: number }) {
  const badgeInfo = badgeIcons[user.badge as keyof typeof badgeIcons] ?? badgeIcons.gold;
  const Icon = badgeInfo.icon;
  const heights = ['h-28', 'h-20', 'h-16'];
  const scales = ['scale-105', 'scale-100', 'scale-95'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.1 }}
      className={`flex flex-col items-center ${scales[position]} flex-1`}
    >
      <div className={`w-10 h-10 rounded-xl ${badgeInfo.bg} flex items-center justify-center mb-3`}>
        <Icon size={20} className={badgeInfo.color} />
      </div>
      <Avatar name={user.name} colorClass={user.avatar} profilePicture={user.profilePicture} size="lg" />
      <p className="text-sm font-bold text-white mt-3 text-center">{user.name.split(' ')[0]}</p>
      <p className="text-violet-300 text-xs font-medium">{user.score.toLocaleString()} pts</p>
      <div className={`w-full ${heights[position]} ${position === 0 ? 'bg-gradient-to-t from-violet-600 to-violet-500' : position === 1 ? 'bg-gradient-to-t from-slate-600 to-slate-500' : 'bg-gradient-to-t from-orange-600 to-orange-500'} rounded-t-2xl mt-4 flex items-start justify-center pt-3`}>
        <span className="text-2xl font-black text-white/70">{position + 1}</span>
      </div>
    </motion.div>
  );
}

export default function AdminLeaderboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [formula, setFormula] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<Record<string, number> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminApi.getLeaderboard();
      setUsers(res.data.users);
      setFormula(res.data.formula);
    } catch (error) {
      console.error('Failed to load admin leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useAdminPolling(load);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelect = async (userId: string) => {
    setSelectedId(userId);
    const res = await adminApi.getScoreBreakdown(userId);
    setBreakdown(res.data.factors);
  };

  if (loading) return <Loader />;

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 rounded-xl hover:bg-violet-100 transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Live Refresh
        </button>
      </div>

      {top3.length >= 3 && (
        <Card className="p-6 bg-gradient-to-br from-[#0F172A] to-[#1E1B4B] border-0">
          <div className="flex items-end justify-center gap-4 pt-4">
            <PodiumCard user={top3[1]} position={1} />
            <PodiumCard user={top3[0]} position={0} />
            <PodiumCard user={top3[2]} position={2} />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          {rest.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                hover
                onClick={() => handleSelect(user.id)}
                className={`p-4 flex items-center gap-4 ${selectedId === user.id ? 'border-violet-400 dark:border-violet-500/50' : ''}`}
              >
                <span className="w-8 text-center text-sm font-bold text-gray-400">#{user.rank}</span>
                <Avatar name={user.name} colorClass={user.avatar} profilePicture={user.profilePicture} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.transactionCount} tx · {formatCurrency(user.totalAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-violet-600 dark:text-violet-400">{user.score.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">{formatDistanceToNow(user.recentActivity)}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={16} className="text-violet-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Score Breakdown</h3>
            </div>
            {breakdown ? (
              <div className="space-y-3">
                {Object.entries(breakdown).filter(([k]) => k !== 'total_score').map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{val}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(val, 100)}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Total Score</span>
                  <span className="text-sm font-bold text-violet-600">{breakdown.total_score?.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Select a user to view score breakdown</p>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Info size={16} className="text-blue-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Ranking Formula</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(formula).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 capitalize">{key}</span>
                  <Badge variant="purple"><span className="font-mono text-[10px]">{val}</span></Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
