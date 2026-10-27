import { useEffect, useRef } from 'react';

export function useAdminPolling(refresh: () => Promise<void>, intervalMs = 10_000) {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    let refreshing = false;

    const runRefresh = () => {
      if (document.visibilityState !== 'visible' || refreshing) return;
      refreshing = true;
      void refreshRef.current()
        .catch((error: unknown) => console.error('Failed to refresh admin data:', error))
        .finally(() => { refreshing = false; });
    };

    const intervalId = window.setInterval(runRefresh, intervalMs);
    document.addEventListener('visibilitychange', runRefresh);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', runRefresh);
    };
  }, [intervalMs]);
}
