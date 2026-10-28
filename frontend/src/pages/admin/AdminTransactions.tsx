/** Admin transactions — full history with filters, export, and detail drawer. */
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, X, Filter, Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { Avatar, Button, StatusBadge, TypeBadge } from '../../components/UI';
import { Loader } from '../../components/Loader';
import { Pagination } from '../../components/admin/Pagination';
import { adminApi, transactionApi } from '../../lib/api';
import { useAdminPolling } from '../../hooks/useAdminPolling';
import type { Transaction, TransactionDeletionRequest } from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/utils';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<TransactionDeletionRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionActionLoading, setDeletionActionLoading] = useState(false);
  const [deletionError, setDeletionError] = useState('');
  const pageSize = 15;

  const load = useCallback(async () => {
    try {
      const [res, requestRes] = await Promise.all([
        adminApi.getTransactions({
        search: search || undefined,
        status: status || undefined,
        type: type || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        pageSize,
        }),
        transactionApi.getDeletionRequests(),
      ]);
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
      setDeletionRequests(requestRes.data.requests);
      setError('');
    } catch {
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, status, type, dateFrom, dateTo, page, pageSize]);

  useEffect(() => { void load(); }, [load]);
  useAdminPolling(load);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminApi.exportTransactions({
        search: search || undefined,
        status: status || undefined,
        type: type || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const selectedRequest = selected
    ? deletionRequests.find(request => request.transactionId === selected.id && ['pending', 'approved'].includes(request.status))
    : undefined;

  const submitDeletionRequest = async () => {
    if (!selected) return;
    setDeletionActionLoading(true);
    setDeletionError('');
    try {
      await transactionApi.requestDeletion(selected.id, deletionReason.trim());
      setDeletionReason('');
      await load();
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setDeletionError(message ?? 'Could not send the deletion request.');
    } finally {
      setDeletionActionLoading(false);
    }
  };

  const finalizeDeletion = async () => {
    if (!selectedRequest || selectedRequest.status !== 'approved') return;
    setDeletionActionLoading(true);
    setDeletionError('');
    try {
      await transactionApi.deleteApproved(selectedRequest.id);
      setSelected(null);
      await load();
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setDeletionError(message ?? 'Could not delete the approved transaction.');
    } finally {
      setDeletionActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search transactions..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30"
            />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm">
            <option value="">All Types</option>
            <option value="transfer">Transfer</option>
            <option value="payment">Payment</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="refund">Refund</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm" />
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm" />
          <Button icon={<Download size={14} />} loading={exporting} onClick={handleExport} variant="secondary">
            Export CSV
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {error && <p role="alert" className="px-4 pt-4 text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="p-12"><Loader /></div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            <Filter size={24} className="mx-auto mb-2 opacity-50" />
            No transactions match your filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                  {['ID', 'User', 'Amount', 'Type', 'Date', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelected(tx)}
                    className="border-b border-gray-50 dark:border-white/5 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{tx.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={tx.userName} colorClass={tx.userAvatar} profilePicture={tx.userProfilePicture} size="sm" />
                        <span className="text-gray-900 dark:text-white">{tx.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(tx.date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#1E293B] border-l border-gray-200 dark:border-white/10 z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Transaction Details</h3>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <Avatar name={selected.userName} colorClass={selected.userAvatar} profilePicture={selected.userProfilePicture} size="lg" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{selected.userName}</p>
                    <p className="text-xs text-gray-500">{selected.userId}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    ['Transaction ID', selected.id],
                    ['Amount', formatCurrency(selected.amount)],
                    ['Score', selected.score.toLocaleString()],
                    ['Description', selected.description],
                    ['Date', formatDateTime(selected.date)],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-white/5">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-gray-500">Type</span>
                    <TypeBadge type={selected.type} />
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-gray-500">Status</span>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
                <div className="mt-6 border-t border-gray-100 dark:border-white/10 pt-5">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Deletion approval</h4>
                  {selectedRequest ? (
                    <div className="mt-3 rounded-xl bg-gray-50 dark:bg-white/5 p-3">
                      <p className="text-xs font-semibold capitalize text-gray-800 dark:text-gray-200">
                        Request {selectedRequest.status}
                      </p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{selectedRequest.reason}</p>
                      {selectedRequest.status === 'approved' && (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deletionActionLoading}
                          icon={<Trash2 size={13} />}
                          onClick={() => void finalizeDeletion()}
                          className="mt-3"
                        >
                          Delete approved transaction
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Send the account owner a request. The transaction remains active unless they approve and an admin completes the deletion.
                      </p>
                      <textarea
                        value={deletionReason}
                        onChange={event => setDeletionReason(event.target.value)}
                        maxLength={500}
                        minLength={5}
                        rows={3}
                        placeholder="Explain why deletion is requested (at least 5 characters)"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deletionActionLoading}
                        disabled={deletionReason.trim().length < 5}
                        icon={<Trash2 size={13} />}
                        onClick={() => void submitDeletionRequest()}
                      >
                        Request deletion approval
                      </Button>
                    </div>
                  )}
                  {deletionError && <p role="alert" className="mt-2 text-xs text-red-500">{deletionError}</p>}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
