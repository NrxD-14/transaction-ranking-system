/** Admin system logs — login, signup, transactions, admin actions, warnings, errors. */
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, AlertCircle, AlertTriangle, Info, Shield, LogIn, UserPlus, ArrowUpDown, X } from 'lucide-react';
import { Card } from '../../components/Card';
import { Avatar, Badge, StatusBadge, TypeBadge } from '../../components/UI';
import { Loader } from '../../components/Loader';
import { Pagination } from '../../components/admin/Pagination';
import { adminApi } from '../../lib/api';
import { useAdminPolling } from '../../hooks/useAdminPolling';
import type { AdminLogDetails, AdminLogEntry } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils';

const levelConfig: Record<string, { variant: 'success' | 'error' | 'warning' | 'info' | 'purple'; icon: typeof Info }> = {
  info: { variant: 'info', icon: Info },
  warning: { variant: 'warning', icon: AlertTriangle },
  error: { variant: 'error', icon: AlertCircle },
};

const categoryIcons: Record<string, typeof Info> = {
  login: LogIn,
  signup: UserPlus,
  transaction: ArrowUpDown,
  admin: Shield,
  system: AlertCircle,
};

const CATEGORIES = ['', 'login', 'signup', 'transaction', 'admin', 'system'];
const LEVELS = ['', 'info', 'warning', 'error'];

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [selectedLog, setSelectedLog] = useState<AdminLogEntry | null>(null);
  const [details, setDetails] = useState<AdminLogDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const pageSize = 20;

  const load = useCallback(async () => {
    try {
      const res = await adminApi.getLogs({
        search: search || undefined,
        category: category || undefined,
        level: level || undefined,
        page,
        pageSize,
      });
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Failed to load admin logs:', error);
    } finally {
      setLoading(false);
    }
  }, [search, category, level, page]);

  useEffect(() => { void load(); }, [load]);
  useAdminPolling(load);

  const openDetails = async (log: AdminLogEntry) => {
    setSelectedLog(log);
    setDetails(null);
    setDetailsError('');
    setDetailsLoading(true);
    try {
      const response = await adminApi.getLogDetails(log.id);
      setDetails(response.data);
    } catch {
      setDetailsError('Could not load the account activity details. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedLog(null);
    setDetails(null);
    setDetailsError('');
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search logs..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30"
            />
          </div>
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm">
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All Categories'}</option>
            ))}
          </select>
          <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm">
            {LEVELS.map(l => (
              <option key={l} value={l}>{l ? l.charAt(0).toUpperCase() + l.slice(1) : 'All Levels'}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="p-4">
        {loading ? (
          <div className="p-8"><Loader /></div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => {
              const cfg = levelConfig[log.level] ?? levelConfig.info;
              const LevelIcon = cfg.icon;
              const CatIcon = categoryIcons[log.category] ?? Info;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/5"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    log.level === 'error' ? 'bg-red-50 dark:bg-red-500/10' :
                    log.level === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10' :
                    'bg-blue-50 dark:bg-blue-500/10'
                  }`}>
                    <LevelIcon size={14} className={
                      log.level === 'error' ? 'text-red-500' :
                      log.level === 'warning' ? 'text-amber-500' : 'text-blue-500'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {log.level === 'info' ? (
                        <button
                          type="button"
                          onClick={() => void openDetails(log)}
                          aria-label={`Show account activity for ${log.userEmail ?? 'system event'}`}
                          className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <Badge variant={cfg.variant}>{log.level}</Badge>
                        </button>
                      ) : (
                        <Badge variant={cfg.variant}>{log.level}</Badge>
                      )}
                      <Badge variant="default">
                        <CatIcon size={10} className="mr-1" />{log.category}
                      </Badge>
                      <span className="text-[10px] text-gray-400">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{log.message}</p>
                    {log.userEmail && (
                      <p className="text-[11px] text-gray-400 mt-1 font-mono">{log.userEmail}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        <div className="pt-4">
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Close account activity details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetails}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="account-activity-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 dark:border-white/10 bg-white/95 dark:bg-[#111827]/95 backdrop-blur">
                <div>
                  <h2 id="account-activity-title" className="text-base font-bold text-gray-900 dark:text-white">Account activity</h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{selectedLog.message}</p>
                </div>
                <button type="button" onClick={closeDetails} aria-label="Close" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              {detailsLoading ? (
                <div className="p-12"><Loader /></div>
              ) : detailsError ? (
                <p role="alert" className="p-6 text-sm text-red-500">{detailsError}</p>
              ) : details ? (
                <div className="p-5 space-y-6">
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Account details</h3>
                    {details.account ? (
                      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                        <Avatar name={details.account.name} colorClass={details.account.avatar} size="lg" />
                        <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                          <Detail label="Name" value={details.account.name} />
                          <Detail label="Email" value={details.account.email} />
                          <Detail label="User ID" value={details.account.userId} />
                          <Detail label="Role" value={details.account.role} />
                          <Detail label="Phone" value={details.account.phone || 'Not provided'} />
                          <Detail label="Location" value={details.account.location || 'Not provided'} />
                          <Detail label="Member since" value={formatDate(details.account.joinedAt)} />
                          <Detail label="Transactions" value={`${details.account.transactionCount} · ${formatCurrency(details.account.totalAmount)} total`} />
                          {details.account.bio && <Detail label="Bio" value={details.account.bio} />}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">This log entry is not linked to a registered account.</p>
                    )}
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Related transactions ({details.transactions.length})</h3>
                    {details.transactions.length ? (
                      <div className="space-y-2">
                        {details.transactions.map(tx => (
                          <div key={tx.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/10">
                            <span className="min-w-[7rem] font-mono text-xs text-gray-500">{tx.id}</span>
                            <TypeBadge type={tx.type} />
                            <span className="text-xs font-semibold text-gray-900 dark:text-white">{formatCurrency(tx.amount)}</span>
                            <StatusBadge status={tx.status} />
                            <span className="ml-auto text-[11px] text-gray-400">{formatDateTime(tx.date)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No transactions are linked to this account.</p>
                    )}
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Related system activity ({details.activities.length})</h3>
                    <div className="space-y-2">
                      {details.activities.map(activity => (
                        <div key={activity.id} className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                          <Badge variant={levelConfig[activity.level]?.variant ?? 'default'}>{activity.level}</Badge>
                          <Badge variant="default">{activity.category}</Badge>
                          <span className="text-xs text-gray-800 dark:text-gray-200">{activity.message}</span>
                          <time className="ml-auto text-[10px] text-gray-400">{formatDateTime(activity.createdAt)}</time>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              ) : null}
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 break-words font-medium text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  );
}
