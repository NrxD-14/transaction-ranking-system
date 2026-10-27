import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={`
        bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-white/10 rounded-2xl
        ${hover ? 'cursor-pointer transition-shadow duration-200 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-500/30' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: ReactNode;
  iconBg?: string;
  subtitle?: string;
}

export function StatCard({ title, value, change, changeType = 'neutral', icon, iconBg, subtitle }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-white/10 rounded-2xl p-5 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-500/30 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg || 'bg-violet-50 dark:bg-violet-500/10'}`}>
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            changeType === 'up' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' :
            changeType === 'down' ? 'text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400' :
            'text-gray-500 bg-gray-100 dark:bg-white/10 dark:text-gray-400'
          }`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
    </motion.div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function ChartCard({ title, subtitle, children, className = '', action }: ChartCardProps) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </Card>
  );
}
