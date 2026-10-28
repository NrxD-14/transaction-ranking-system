import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Bell, MessageCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { chatApi, transactionApi } from '../../lib/api';
import { useAdminPolling } from '../../hooks/useAdminPolling';
import type { ChatMessage, TransactionDeletionRequest } from '../../types';
import { formatDateTime } from '../../lib/utils';

export default function AdminNotifications() {
  const { authUser } = useApp();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TransactionDeletionRequest[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [olderMessages, setOlderMessages] = useState<ChatMessage[]>([]);
  const [messageTotal, setMessageTotal] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [requestResponse, messageResponse] = await Promise.all([
        transactionApi.getDeletionRequests(),
        chatApi.getAllMessages(),
      ]);
      setRequests(requestResponse.data.requests);
      setMessages(messageResponse.data.messages);
      setMessageTotal(messageResponse.data.total);
      setError('');
    } catch (loadError) {
      console.error('Failed to load admin notifications:', loadError);
      setError('Could not load notifications. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useAdminPolling(load);

  const loadOlderMessages = async () => {
    if (loadingOlder) return;
    setLoadingOlder(true);
    try {
      const response = await chatApi.getAllMessages(messages.length + olderMessages.length);
      setOlderMessages(current => [...current, ...response.data.messages]);
      setMessageTotal(response.data.total);
    } catch (loadError) {
      console.error('Failed to load older user messages:', loadError);
      setError('Could not load older user messages.');
    } finally {
      setLoadingOlder(false);
    }
  };

  const openMessage = (message: ChatMessage) => {
    if (message.roomType === 'group') {
      navigate('/admin/chat', { state: { mode: 'group' } });
      return;
    }
    const peerUserId = message.senderUserId === authUser?.userId
      ? message.recipientUserId
      : message.senderUserId;
    if (peerUserId) navigate('/admin/chat', { state: { mode: 'direct', peerUserId } });
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track deletion requests and review messages sent by users.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading notifications...</p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] overflow-hidden">
            <header className="flex items-center gap-2 border-b border-gray-100 dark:border-white/10 px-4 py-3">
              <Bell size={17} className="text-violet-500" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Transaction deletion requests</h3>
                <p className="text-[11px] text-gray-400">Includes pending, approved, declined, and completed requests.</p>
              </div>
            </header>
            <div className="max-h-[36rem] overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
              {requests.length === 0 ? (
                <p className="p-5 text-sm text-gray-400">There are no deletion requests.</p>
              ) : requests.map(request => (
                <article key={request.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Transaction {request.transactionId}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        User {request.userId} · requested {formatDateTime(request.requestedAt)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${request.status === 'pending' ? 'bg-amber-100 text-amber-700' : request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : request.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{request.reason}</p>
                  {request.responseNote && <p className="mt-1 text-xs text-gray-500">User response: {request.responseNote}</p>}
                  {request.respondedAt && <p className="mt-1 text-[10px] text-gray-400">Updated {formatDateTime(request.respondedAt)}</p>}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827] overflow-hidden">
            <header className="flex items-center gap-2 border-b border-gray-100 dark:border-white/10 px-4 py-3">
              <MessageCircle size={17} className="text-violet-500" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Messages from users</h3>
                <p className="text-[11px] text-gray-400">Recent group and private messages. Open one to reply or moderate.</p>
              </div>
            </header>
            <div className="max-h-[36rem] overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
              {messages.length === 0 && olderMessages.length === 0 ? (
                <p className="p-5 text-sm text-gray-400">There are no user messages yet.</p>
              ) : [...messages, ...olderMessages].map(message => (
                <article key={message.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {message.senderName}
                        <span className="ml-2 text-[10px] font-normal text-gray-400">
                          {message.roomType === 'group' ? 'Group chat' : `Private · ${message.recipientName ?? 'direct message'}`}
                        </span>
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">{message.senderEmail} · {formatDateTime(message.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openMessage(message)}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100"
                    >
                      Open <ArrowUpRight size={12} />
                    </button>
                  </div>
                  <p className={`mt-2 whitespace-pre-wrap break-words text-xs text-gray-600 dark:text-gray-300 ${message.isDeleted ? 'italic opacity-70' : ''}`}>
                    {message.content}
                  </p>
                </article>
              ))}
              {messages.length + olderMessages.length < messageTotal && (
                <div className="p-3 text-center">
                  <button
                    type="button"
                    disabled={loadingOlder}
                    onClick={() => void loadOlderMessages()}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10 disabled:opacity-50"
                  >
                    {loadingOlder ? 'Loading...' : `Load older messages (${messageTotal - messages.length - olderMessages.length} remaining)`}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
