import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ToastItem } from '../context/AppContext';

const icons = {
  success: <CheckCircle size={18} className="text-emerald-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  warning: <AlertCircle size={18} className="text-amber-500" />,
  info: <Info size={18} className="text-blue-500" />,
};

const borderColors = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-500',
};

function Toast({ toast }: { toast: ToastItem }) {
  const { removeToast } = useApp();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 border-l-4 ${borderColors[toast.type]} rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 p-4 flex items-start gap-3 min-w-[300px] max-w-sm`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{toast.title}</p>
        {toast.message && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{toast.message}</p>}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        <X size={14} className="text-gray-400 dark:text-gray-500" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts } = useApp();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
