/** Route guards — ProtectedRoute, AdminRoute, and GuestRoute. */
import { Navigate, useLocation } from 'react-router-dom';
import { Loader } from './Loader';
import { useApp } from '../context/AppContext';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { authUser, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F1A]">
        <Loader />
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { authUser, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F1A]">
        <Loader />
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (authUser.role !== 'admin') {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { authUser, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <Loader />
      </div>
    );
  }

  if (authUser) {
    return <Navigate to={authUser.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}
