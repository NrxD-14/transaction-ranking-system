import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { LockKeyhole, MessageCircle, Send, Shield, Trash2, UserRoundX, Users } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { chatApi } from '../lib/api';
import type { ChatMessage, ChatParticipant } from '../types';
import { formatDateTime } from '../lib/utils';

type ChatMode = 'group' | 'direct';

export default function Chat() {
  const { authUser, addToast } = useApp();
  const location = useLocation();
  const initialState = location.state as { mode?: ChatMode; peerUserId?: string } | null;
  const isAdmin = authUser?.role === 'admin';
  const [mode, setMode] = useState<ChatMode>(initialState?.mode ?? 'group');
  const [peerUserId, setPeerUserId] = useState(initialState?.peerUserId ?? '');
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [groupChatEnabled, setGroupChatEnabled] = useState(true);
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);
  const [directUnreadCounts, setDirectUnreadCounts] = useState<Record<string, number>>({});
  const [unreadError, setUnreadError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [olderMessages, setOlderMessages] = useState<ChatMessage[]>([]);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [participantError, setParticipantError] = useState('');
  const [messageError, setMessageError] = useState('');
  const messageListRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  const selectedParticipant = useMemo(
    () => participants.find(participant => participant.userId === peerUserId),
    [participants, peerUserId],
  );

  const loadParticipants = useCallback(async () => {
    try {
      const response = await chatApi.getParticipants();
      setParticipants(response.data.participants);
      setGroupChatEnabled(response.data.groupChatEnabled);
      setParticipantError('');
    } catch (loadError) {
      console.error('Failed to load chat participants:', loadError);
      setParticipantError('Could not load chat participants. Please try again.');
    }
  }, []);

  const loadUnreadCounts = useCallback(async () => {
    try {
      const response = await chatApi.getUnreadCounts();
      setGroupUnreadCount(response.data.groupCount);
      setDirectUnreadCounts(response.data.directCounts);
      setUnreadError('');
    } catch (unreadLoadError) {
      console.error('Failed to load unread chat counts:', unreadLoadError);
      setUnreadError('Unread message counts could not be refreshed.');
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (mode === 'direct' && !peerUserId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    if (mode === 'group' && !isAdmin && !groupChatEnabled) {
      setMessages([]);
      setOlderMessages([]);
      setHasOlderMessages(false);
      setMessageError('Your group chat access has been removed by an administrator.');
      setLoading(false);
      return;
    }
    try {
      const response = mode === 'group'
        ? await chatApi.getGroupMessages()
        : await chatApi.getDirectMessages(peerUserId);
      setMessages(response.data.messages);
      setHasOlderMessages(response.data.hasMore);
      setMessageError('');
      const latestMessage = response.data.messages[response.data.messages.length - 1];
      if (latestMessage && shouldAutoScroll.current && document.visibilityState === 'visible') {
        await chatApi.markRead(mode, latestMessage.id, mode === 'direct' ? peerUserId : undefined);
        await loadUnreadCounts();
      }
    } catch (loadError) {
      console.error('Failed to load chat messages:', loadError);
      setMessages([]);
      setOlderMessages([]);
      setHasOlderMessages(false);
      setMessageError('Could not load this conversation. Your group access may have been removed.');
    } finally {
      setLoading(false);
    }
  }, [groupChatEnabled, isAdmin, loadUnreadCounts, mode, peerUserId]);

  useEffect(() => {
    void loadParticipants();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadParticipants();
    }, 10_000);
    return () => window.clearInterval(intervalId);
  }, [loadParticipants]);

  useEffect(() => {
    void loadUnreadCounts();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadUnreadCounts();
    }, 5000);
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') void loadUnreadCounts();
    };
    document.addEventListener('visibilitychange', refreshOnVisible);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, [loadUnreadCounts]);

  useEffect(() => {
    setLoading(true);
    void loadMessages();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadMessages();
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [loadMessages]);

  useEffect(() => {
    if (shouldAutoScroll.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectGroup = () => {
    setMode('group');
    setPeerUserId('');
    setOlderMessages([]);
    setHasOlderMessages(false);
    shouldAutoScroll.current = true;
  };

  const selectParticipant = (participantId: string) => {
    setPeerUserId(participantId);
    setMode('direct');
    setOlderMessages([]);
    setHasOlderMessages(false);
    shouldAutoScroll.current = true;
  };

  const loadOlderMessages = async () => {
    const beforeId = olderMessages[0]?.id ?? messages[0]?.id;
    if (!beforeId || loadingOlder) return;
    setLoadingOlder(true);
    shouldAutoScroll.current = false;
    try {
      const response = mode === 'group'
        ? await chatApi.getGroupMessages(beforeId)
        : await chatApi.getDirectMessages(peerUserId, beforeId);
      setOlderMessages(current => [...response.data.messages, ...current]);
      setHasOlderMessages(response.data.hasMore);
    } catch (loadError) {
      console.error('Failed to load older chat messages:', loadError);
      addToast({ type: 'error', title: 'Could not load older messages', message: 'Please try again.' });
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    shouldAutoScroll.current = true;
    try {
      await chatApi.sendMessage(content, mode === 'direct' ? peerUserId : undefined);
      setDraft('');
      await loadMessages();
    } catch (sendError) {
      console.error('Failed to send chat message:', sendError);
      addToast({ type: 'error', title: 'Message not sent', message: 'Please check your connection and try again.' });
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (message: ChatMessage) => {
    try {
      await chatApi.deleteMessage(message.id);
      await loadMessages();
      addToast({ type: 'success', title: 'Message deleted', message: 'The message is hidden for everyone.' });
    } catch (deleteError) {
      console.error('Failed to delete chat message:', deleteError);
      addToast({ type: 'error', title: 'Could not delete message', message: 'Please try again.' });
    }
  };

  const setParticipantAccess = async (participant: ChatParticipant, enabled: boolean) => {
    const action = enabled ? 'restore access to' : 'remove from';
    if (!window.confirm(`Are you sure you want to ${action} group chat for ${participant.name}?`)) return;
    try {
      await chatApi.setGroupAccess(participant.userId, enabled);
      await loadParticipants();
      addToast({
        type: 'success',
        title: enabled ? 'Group access restored' : 'User removed from group',
        message: `${participant.name}'s group chat access was updated.`,
      });
    } catch (accessError) {
      console.error('Failed to update group chat access:', accessError);
      addToast({ type: 'error', title: 'Access update failed', message: 'Please try again.' });
    }
  };

  const activeTitle = mode === 'group' ? 'Community group' : selectedParticipant?.name ?? 'Private conversation';

  return (
    <section className="flex-1 min-h-[32rem] flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chat</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Join the shared group or send a private message to a user or admin.
        </p>
      </div>

      <div className="flex-1 min-h-[28rem] grid grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111827]">
        <aside className="border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-white/10 p-3 space-y-2 max-h-56 lg:max-h-none overflow-y-auto">
          <button
            type="button"
            onClick={selectGroup}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left ${mode === 'group' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            <Users size={18} />
            <span className="text-sm font-semibold">Group chat</span>
            {groupUnreadCount > 0 && (
              <span aria-label={`${groupUnreadCount} unread group messages`} className="ml-auto min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white">
                {groupUnreadCount > 99 ? '99+' : groupUnreadCount}
              </span>
            )}
          </button>
          <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider font-bold text-gray-400">
            Private messages
          </div>
          {participants.map(participant => (
            <div key={participant.userId} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => selectParticipant(participant.userId)}
                className={`min-w-0 flex-1 flex items-center gap-3 p-2.5 rounded-xl text-left ${mode === 'direct' && peerUserId === participant.userId ? 'bg-violet-50 dark:bg-violet-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                <span className={`w-8 h-8 rounded-full ${participant.profilePicture ? 'bg-gray-100' : participant.avatar} shrink-0 overflow-hidden flex items-center justify-center text-white text-[10px] font-bold`}>
                  {participant.profilePicture
                    ? <img src={participant.profilePicture} alt={`${participant.name}'s profile`} className="w-full h-full object-cover" />
                    : participant.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-gray-800 dark:text-gray-200">{participant.name}</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400 capitalize">
                    {participant.role === 'admin' && <Shield size={10} />}
                    {participant.role}
                    {participant.role === 'user' && !participant.groupChatEnabled && ' · removed from group'}
                  </span>
                </span>
                {(directUnreadCounts[participant.userId] ?? 0) > 0 && (
                  <span aria-label={`${directUnreadCounts[participant.userId]} unread messages`} className="ml-auto min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white">
                    {directUnreadCounts[participant.userId] > 99 ? '99+' : directUnreadCounts[participant.userId]}
                  </span>
                )}
              </button>
              {isAdmin && participant.role !== 'admin' && (
                <button
                  type="button"
                  title={participant.groupChatEnabled ? 'Remove from group chat' : 'Restore group chat access'}
                  aria-label={`${participant.groupChatEnabled ? 'Remove' : 'Restore'} ${participant.name} group chat access`}
                  onClick={() => void setParticipantAccess(participant, !participant.groupChatEnabled)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  {participant.groupChatEnabled ? <UserRoundX size={15} /> : <Users size={15} />}
                </button>
              )}
            </div>
          ))}
          {participants.length === 0 && !participantError && (
            <p className="px-3 py-2 text-xs text-gray-400">No other chat participants yet.</p>
          )}
        </aside>

        <div className="min-h-[28rem] flex flex-col min-w-0">
          <header className="px-4 py-3 border-b border-gray-100 dark:border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-300 flex items-center justify-center">
              {mode === 'group' ? <Users size={18} /> : selectedParticipant?.role === 'admin' ? <Shield size={18} /> : <MessageCircle size={18} />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{activeTitle}</h3>
              <p className="text-[11px] text-gray-400">
                {mode === 'group' ? 'Messages are visible to group members and admins' : 'Private conversation'}
              </p>
            </div>
          </header>

          {(participantError || messageError) && (
            <p role="alert" className="px-4 py-2 text-xs text-red-500">{messageError || participantError}</p>
          )}
          {unreadError && <p role="status" className="px-4 py-2 text-xs text-amber-600 dark:text-amber-400">{unreadError}</p>}
          <div
            ref={messageListRef}
            onScroll={event => {
              const element = event.currentTarget;
              shouldAutoScroll.current = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
            }}
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
          >
            {mode === 'direct' && !peerUserId ? (
              <div className="h-full min-h-40 flex flex-col items-center justify-center text-center text-gray-400">
                <MessageCircle size={28} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">Choose someone to start a private chat</p>
              </div>
            ) : loading ? (
              <p className="py-8 text-center text-xs text-gray-400">Loading messages...</p>
            ) : messages.length === 0 && olderMessages.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">No messages yet. Start the conversation.</p>
            ) : (
              <>
                {hasOlderMessages && (
                  <div className="text-center">
                    <button
                      type="button"
                      disabled={loadingOlder}
                      onClick={() => void loadOlderMessages()}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10 disabled:opacity-50"
                    >
                      {loadingOlder ? 'Loading...' : 'Load older messages'}
                    </button>
                  </div>
                )}
                {[...olderMessages, ...messages].map(message => {
              const ownMessage = message.senderUserId === authUser?.userId;
              return (
                <article key={message.id} className={`group flex gap-2 ${ownMessage ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full ${message.senderProfilePicture ? 'bg-gray-100' : message.senderAvatar} shrink-0 overflow-hidden flex items-center justify-center text-white text-[10px] font-bold`}>
                    {message.senderProfilePicture
                      ? <img src={message.senderProfilePicture} alt={`${message.senderName}'s profile`} className="w-full h-full object-cover" />
                      : message.senderName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className={`max-w-[85%] min-w-0 ${ownMessage ? 'text-right' : ''}`}>
                    <div className={`mb-1 flex items-center gap-2 text-[10px] text-gray-400 ${ownMessage ? 'justify-end' : ''}`}>
                      <span className="font-semibold text-gray-600 dark:text-gray-300">{message.senderName}</span>
                      {message.senderRole === 'admin' && <span className="text-violet-500">Admin</span>}
                      <time>{formatDateTime(message.createdAt)}</time>
                    </div>
                    <div className={`inline-flex items-start gap-2 rounded-2xl px-3 py-2 text-left ${ownMessage ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200'}`}>
                      <p className={`whitespace-pre-wrap break-words text-sm ${message.isDeleted ? 'italic opacity-70' : ''}`}>{message.content}</p>
                      {isAdmin && !message.isDeleted && (
                        <button
                          type="button"
                          title="Delete message for everyone"
                          aria-label={`Delete message from ${message.senderName}`}
                          onClick={() => void deleteMessage(message)}
                          className="shrink-0 p-1 rounded hover:bg-black/10"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
                })}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {mode === 'group' && !groupChatEnabled ? (
            <div className="border-t border-gray-100 dark:border-white/10 p-4 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <LockKeyhole size={16} /> Group chat access is currently unavailable.
            </div>
          ) : (
            <form onSubmit={send} className="border-t border-gray-100 dark:border-white/10 p-3 flex items-end gap-2">
              <textarea
                value={draft}
                onChange={event => setDraft(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                maxLength={2000}
                rows={1}
                aria-label="Write a message"
                placeholder={`Message ${mode === 'group' ? 'the group' : selectedParticipant?.name ?? ''}...`}
                disabled={mode === 'direct' && !peerUserId}
                className="min-h-10 max-h-28 flex-1 resize-y rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending || (mode === 'direct' && !peerUserId)}
                className="h-10 w-10 shrink-0 rounded-xl bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
