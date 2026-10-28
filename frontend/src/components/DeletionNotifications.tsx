import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, MessageSquareText, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { transactionApi } from '../lib/api';
import type { TransactionDeletionRequest } from '../types';
import { formatCurrency, formatDateTime } from '../lib/utils';

export function DeletionNotifications() {
  const { authUser, addToast } = useApp();
  const [requests, setRequests] = useState<TransactionDeletionRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [error, setError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!authUser || authUser.role !== 'user') return;
    try {
      const response = await transactionApi.getMyDeletionRequests();
      setRequests(response.data.requests);
      setError('');
    } catch (loadError) {
      console.error('Failed to load transaction deletion requests:', loadError);
      setError('Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (!authUser || authUser.role !== 'user') return;
    setLoading(true);
    void load();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 10_000);
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', refreshOnVisible);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, [authUser, load]);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, []);

  if (!authUser || authUser.role !== 'user') return null;

  const pendingCount = requests.filter(request => request.status === 'pending').length;
  const respond = async (request: TransactionDeletionRequest, approved: boolean) => {
    setRespondingTo(request.id);
    try {
      await transactionApi.respondToDeletionRequest(request.id, approved);
      await load();
      addToast({
        type: approved ? 'success' : 'info',
        title: approved ? 'Deletion approved' : 'Deletion declined',
        message: approved
          ? 'An admin may now delete this transaction.'
          : 'The transaction will not be deleted.',
      });
    } catch (responseError) {
      console.error('Failed to respond to transaction deletion request:', responseError);
      addToast({ type: 'error', title: 'Response failed', message: 'Could not submit your response. Please try again.' });
    } finally {
      setRespondingTo(null);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label={`Messages${pendingCount ? `, ${pendingCount} pending` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        <MessageSquareText size={18} className="text-gray-600 dark:text-gray-300" />
        {pendingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] max-h-[75vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] shadow-2xl z-50">
          <div className="sticky top-0 z-10 px-4 py-3 bg-white dark:bg-[#111827] border-b border-gray-100 dark:border-white/10">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Messages</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Admin transaction deletion requests</p>
          </div>
          {error ? (
            <p role="alert" className="p-4 text-xs text-red-500">{error}</p>
          ) : loading ? (
            <p className="p-4 text-xs text-gray-500">Loading messages...</p>
          ) : requests.length === 0 ? (
            <p className="p-4 text-xs text-gray-500">You have no transaction deletion requests.</p>
          ) : (
            <div className="p-3 space-y-3">
              {requests.map(request => (
                <article key={request.id} className="p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Deletion request · {request.transactionId}</p>
                    <span className={`text-[10px] capitalize font-semibold ${request.status === 'pending' ? 'text-amber-600' : request.status === 'approved' ? 'text-emerald-600' : request.status === 'rejected' ? 'text-red-500' : 'text-gray-500'}`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] font-medium text-gray-800 dark:text-gray-200">
                    {request.transactionType} · {formatCurrency(request.transactionAmount)} · {formatDateTime(request.transactionDate)}
                  </p>
                  {request.transactionDescription && (
                    <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{request.transactionDescription}</p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">{request.reason}</p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    Requested by {request.requesterEmail} · {formatDateTime(request.requestedAt)}
                  </p>
                  {request.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={respondingTo === request.id}
                        onClick={() => void respond(request, true)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check size={12} /> Allow
                      </button>
                      <button
                        type="button"
                        disabled={respondingTo === request.id}
                        onClick={() => void respond(request, false)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-gray-200 px-2 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-300 dark:bg-white/10 dark:text-gray-200 disabled:opacity-50"
                      >
                        <X size={12} /> Decline
                      </button>
                    </div>
                  )}
                  {request.status === 'approved' && (
                    <p className="mt-2 text-[10px] text-emerald-700 dark:text-emerald-400">You approved this request. An admin may now complete the deletion.</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
