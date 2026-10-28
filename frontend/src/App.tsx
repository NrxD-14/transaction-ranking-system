/**
 * Root router: public auth, user app, and admin panel routes.
 * Transaction Ranking System — Narayan Dev
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/AppShell';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/admin/AdminLayout';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/Toast';
import { Loader } from './components/Loader';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import NewTransaction from './pages/NewTransaction';
import Leaderboard from './pages/Leaderboard';
import UserSummary from './pages/UserSummary';
import TransactionHistory from './pages/TransactionHistory';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AccessDenied from './pages/AccessDenied';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminTransactions = lazy(() => import('./pages/admin/AdminTransactions'));
const AdminLeaderboard = lazy(() => import('./pages/admin/AdminLeaderboard'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const Chat = lazy(() => import('./pages/Chat'));

function AdminFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader />
    </div>
  );
}

function UserRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new-transaction" element={<NewTransaction />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/user-summary" element={<UserSummary />} />
        <Route path="/history" element={<TransactionHistory />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/chat" element={<Suspense fallback={<AdminFallback />}><Chat /></Suspense>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  return (
    <div className="relative">
      <Layout>
        <UserRoutes />
      </Layout>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<AdminFallback />}><AdminDashboard /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<AdminFallback />}><AdminUsers /></Suspense>} />
            <Route path="transactions" element={<Suspense fallback={<AdminFallback />}><AdminTransactions /></Suspense>} />
            <Route path="leaderboard" element={<Suspense fallback={<AdminFallback />}><AdminLeaderboard /></Suspense>} />
            <Route path="analytics" element={<Suspense fallback={<AdminFallback />}><AdminAnalytics /></Suspense>} />
            <Route path="logs" element={<Suspense fallback={<AdminFallback />}><AdminLogs /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<AdminFallback />}><AdminSettings /></Suspense>} />
            <Route path="notifications" element={<Suspense fallback={<AdminFallback />}><AdminNotifications /></Suspense>} />
            <Route path="chat" element={<Suspense fallback={<AdminFallback />}><Chat /></Suspense>} />
          </Route>
          <Route path="/*" element={<ProtectedRoute><AppContent /></ProtectedRoute>} />
        </Routes>
        </AppShell>
      </AppProvider>
    </BrowserRouter>
  );
}
