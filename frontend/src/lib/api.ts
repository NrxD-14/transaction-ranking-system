/**
 * Axios HTTP client for all backend API calls.
 * - Base URL: /api (proxied to FastAPI in dev via vite.config.ts)
 * - Attaches JWT from localStorage on every request
 * - Clears token on 401 responses
 */
import axios from 'axios';
import type { AdminLogDetails, AuthUser, ChatMessage, ChatParticipant, ChatUnreadCounts, Transaction, TransactionDeletionRequest, UpdateProfilePayload, User } from '../types';

const TOKEN_KEY = 'trs-token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error?.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (error?.response?.status === 403 && error.config?.url?.includes('/admin')) {
      error.isAdminForbidden = true;
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post<{ accessToken: string; user: AuthUser }>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ accessToken: string; user: AuthUser }>('/auth/login', data),
  me: () => api.get<AuthUser>('/auth/me'),
  updateProfile: (data: UpdateProfilePayload) => api.patch<AuthUser>('/auth/me', data),
};

export const transactionApi = {
  getAll: () => api.get<{ transactions: Transaction[] }>('/transactions'),
  create: (data: {
    transactionId: string;
    userId: string;
    amount: number;
    type: Transaction['type'];
    date: string;
    description?: string;
    status?: Transaction['status'];
  }) => api.post<Transaction>('/transaction', data),
  update: (transactionId: string, data: {
    amount: number;
    type: Transaction['type'];
    date: string;
    description: string;
  }) => api.patch<Transaction>(`/transaction/${encodeURIComponent(transactionId)}`, data),
  requestDeletion: (transactionId: string, reason: string) =>
    api.post<TransactionDeletionRequest>(`/admin/transactions/${encodeURIComponent(transactionId)}/deletion-requests`, { reason }),
  getDeletionRequests: () =>
    api.get<{ requests: TransactionDeletionRequest[] }>('/admin/transaction-deletion-requests'),
  deleteApproved: (requestId: number) =>
    api.post<{ message: string; request: TransactionDeletionRequest }>(`/admin/transaction-deletion-requests/${requestId}/delete`),
  getMyDeletionRequests: () =>
    api.get<{ requests: TransactionDeletionRequest[] }>('/notifications/transaction-deletion-requests'),
  respondToDeletionRequest: (requestId: number, approved: boolean, note?: string) =>
    api.patch<TransactionDeletionRequest>(`/notifications/transaction-deletion-requests/${requestId}`, { approved, note }),
};

export const chatApi = {
  getParticipants: () => api.get<{ groupChatEnabled: boolean; participants: ChatParticipant[] }>('/chat/participants'),
  getUnreadCounts: () => api.get<ChatUnreadCounts>('/chat/unread'),
  markRead: (roomType: 'group' | 'direct', throughMessageId: number, peerUserId?: string) =>
    api.post('/chat/read', { roomType, throughMessageId, ...(peerUserId ? { peerUserId } : {}) }),
  getGroupMessages: (beforeId?: number) =>
    api.get<{ messages: ChatMessage[]; hasMore: boolean }>('/chat/group/messages', { params: beforeId ? { before_id: beforeId } : undefined }),
  getDirectMessages: (peerUserId: string, beforeId?: number) =>
    api.get<{ messages: ChatMessage[]; hasMore: boolean }>(`/chat/direct/${encodeURIComponent(peerUserId)}/messages`, { params: beforeId ? { before_id: beforeId } : undefined }),
  sendMessage: (content: string, recipientUserId?: string) =>
    api.post<ChatMessage>('/chat/messages', { content, ...(recipientUserId ? { recipientUserId } : {}) }),
  getAllMessages: (offset = 0) => api.get<{ messages: ChatMessage[]; total: number }>('/admin/chat/messages', { params: { offset } }),
  deleteMessage: (messageId: number) => api.delete(`/admin/chat/messages/${messageId}`),
  setGroupAccess: (userId: string, enabled: boolean) =>
    api.patch<{ userId: string; groupChatEnabled: boolean }>(`/admin/chat/users/${encodeURIComponent(userId)}/group-access`, { enabled }),
};

export const userApi = {
  getAll: () => api.get<{ users: User[] }>('/users'),
  getRanking: () => api.get<{ users: User[] }>('/ranking'),
  getSummary: (userId: string) => api.get(`/summary/${userId}`),
};

export const adminApi = {
  getDashboard: () => api.get<import('../types').AdminStats>('/admin/dashboard'),
  getUsers: (params?: Record<string, string | number | undefined>) =>
    api.get<{ users: import('../types').AdminUserRow[]; total: number; page: number; pageSize: number }>('/admin/users', { params }),
  getTransactions: (params?: Record<string, string | number | undefined>) =>
    api.get<{ transactions: Transaction[]; total: number; page: number; pageSize: number }>('/admin/transactions', { params }),
  exportTransactions: (params?: Record<string, string | undefined>) =>
    api.get('/admin/transactions/export', { params, responseType: 'blob' }),
  getLeaderboard: () => api.get<{ users: User[]; formula: Record<string, string> }>('/admin/leaderboard'),
  getScoreBreakdown: (userId: string) => api.get<{ userId: string; factors: Record<string, number> }>(`/admin/leaderboard/${userId}/breakdown`),
  getAnalytics: () => api.get<import('../types').AdminAnalytics>('/admin/analytics'),
  getLogs: (params?: Record<string, string | number | undefined>) =>
    api.get<{ logs: import('../types').AdminLogEntry[]; total: number; page: number; pageSize: number }>('/admin/logs', { params }),
  getLogDetails: (logId: number) => api.get<AdminLogDetails>(`/admin/logs/${logId}/details`),
  getSettings: () => api.get<import('../types').AdminSettingsInfo>('/admin/settings'),
  getHealth: () => api.get<{ api: string; database: string; version: string }>('/admin/health'),
};

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

type ApiErrorPayload = {
  detail?: string | { msg?: string }[];
  message?: string;
  errors?: { msg?: string }[];
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { status?: number; data?: ApiErrorPayload } };
  const status = err.response?.status;
  const data = err.response?.data;

  if (status === 404) {
    return 'Auth service unavailable. Restart the app with "npm run dev" from the project root.';
  }

  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
    return data.detail[0].msg;
  }

  if (typeof data?.message === 'string') {
    return data.message;
  }

  if (Array.isArray(data?.errors) && data.errors[0]?.msg) {
    return data.errors[0].msg;
  }

  if (!err.response) {
    return 'Unable to reach the server. Make sure the backend is running on port 8000.';
  }

  return fallback;
}

export default api;
