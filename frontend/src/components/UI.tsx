import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'purple';
  size?: 'sm' | 'md';
}

const variants = {
  default: 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300',
  success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  error: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
  warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  info: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  purple: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
      {children}
    </span>
  );
}

interface AvatarProps {
  name: string;
  colorClass: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
};

export function Avatar({ name, colorClass, size = 'md' }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`${sizes[size]} rounded-full ${colorClass} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

interface TransactionTypeBadgeProps {
  type: string;
}

const typeConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  transfer: { label: 'Transfer', variant: 'purple' },
  payment: { label: 'Payment', variant: 'info' },
  deposit: { label: 'Deposit', variant: 'success' },
  withdrawal: { label: 'Withdrawal', variant: 'warning' },
  refund: { label: 'Refund', variant: 'error' },
};

export function TypeBadge({ type }: TransactionTypeBadgeProps) {
  const config = typeConfig[type] ?? { label: type, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  completed: { label: 'Completed', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  failed: { label: 'Failed', variant: 'error' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', className = '', loading, icon }: ButtonProps) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1';
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2.5', lg: 'text-sm px-6 py-3' };
  const variantMap = {
    primary: 'bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-400 shadow-sm shadow-violet-200 dark:shadow-violet-900/30 disabled:opacity-50',
    secondary: 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/15 focus:ring-gray-300',
    ghost: 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 focus:ring-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variantMap[variant]} ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
    </motion.button>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</p>
      {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({ value, max = 100, color = 'bg-violet-500', label, showValue = true }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{label}</span>}
          {showValue && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{value}/{max}</span>}
        </div>
      )}
      <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
