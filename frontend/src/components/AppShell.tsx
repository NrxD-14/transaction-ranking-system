/** App shell wrapper — document title sync. */
import type { ReactNode } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function AppShell({ children }: { children: ReactNode }) {
  useDocumentTitle();
  return <>{children}</>;
}
