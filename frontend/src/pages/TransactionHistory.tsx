/** Transaction History — filters and displays all transactions from AppContext. */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import { Card } from '../components/Card';
import { Loader } from '../components/Loader';
import { SearchBar } from '../components/SearchBar';
import { Avatar, TypeBadge, StatusBadge, Button } from '../components/UI';
import { useApp } from '../context/AppContext';
import { formatDate, formatCurrency, exportToCsv } from '../lib/utils';
import type { TransactionType } from '../types';

const allTypes: (TransactionType | 'all')[] = ['all', 'transfer', 'payment', 'deposit', 'withdrawal', 'refund'];
const allStatuses = ['all', 'completed', 'pending', 'failed'] as const;

export default function TransactionHistory() {
  const { transactions, dataLoading } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const perPage = 12;

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const s = search.toLowerCase();
      if (search && !tx.id.toLowerCase().includes(s) && !tx.userName.toLowerCase().includes(s) && !tx.userId.toLowerCase().includes(s)) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      if (dateFrom && new Date(tx.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(tx.date) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [transactions, search, typeFilter, statusFilter, dateFrom, dateTo]);

  if (dataLoading) return <Loader />;

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);
  const hasFilters = search || typeFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo;

  const resetFilters = () => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setDateFrom(''); setDateTo(''); setPage(1); };

  const handleExport = () => {
    exportToCsv('transactions.csv', filtered.map(tx => ({
      ID: tx.id, User: tx.userName, UserID: tx.userId, Amount: tx.amount,
      Type: tx.type, Status: tx.status, Score: tx.score, Date: formatDate(tx.date), Description: tx.description,
    })));
  };

  const selectClass = "w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 focus:outline-none focus:border-violet-400 transition-colors";
  const inputClass = "w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 focus:outline-none focus:border-violet-400 transition-colors";

  return (
    <div className="max-w-[1400px] space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by ID, user..." className="w-full sm:w-64" />
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowFilters(f => !f)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap ${showFilters || hasFilters ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'}`}
              >
                <Filter size={13} />
                Filters {hasFilters && <span className="bg-violet-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">!</span>}
              </motion.button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} records</span>
              <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={handleExport}>Export CSV</Button>
            </div>
          </div>

          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-3 border-t border-gray-100 dark:border-white/10 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</label>
                  <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value as TransactionType | 'all'); setPage(1); }} className={selectClass}>
                    {allTypes.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</label>
                  <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={selectClass}>
                    {allStatuses.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">From Date</label>
                  <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">To Date</label>
                  <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className={inputClass} />
                </div>
              </div>
              {hasFilters && <button onClick={resetFilters} className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium">Clear all filters</button>}
            </motion.div>
          )}
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                  {['Transaction', 'User', 'Amount', 'Type', 'Status', 'Score', 'Date', 'Description'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                          <ScrollText size={20} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No transactions found</p>
                        <button onClick={resetFilters} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">Clear filters</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((tx, i) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg">{tx.id}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={tx.userName} colorClass={tx.userAvatar} size="sm" />
                          <div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{tx.userName}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{tx.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-3.5"><TypeBadge type={tx.type} /></td>
                      <td className="px-4 py-3.5"><StatusBadge status={tx.status} /></td>
                      <td className="px-4 py-3.5"><span className="text-xs font-bold text-violet-600 dark:text-violet-400">{tx.score}</span></td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 dark:text-gray-500 max-w-[160px] truncate">{tx.description}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3.5 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  const pn = totalPages <= 7 ? i + 1 : (page <= 4 ? i + 1 : page - 3 + i);
                  if (pn < 1 || pn > totalPages) return null;
                  return (
                    <button key={pn} onClick={() => setPage(pn)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === pn ? 'bg-violet-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                      {pn}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
