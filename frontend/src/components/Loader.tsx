import { motion } from 'framer-motion';

interface LoaderProps {
  className?: string;
}

export function Loader({ className = '' }: LoaderProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ scaleY: [1, 1.8, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            className="w-1.5 h-5 bg-violet-500 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonLine className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-3/4" />
          <SkeletonLine className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonLine className="h-8 w-1/3" />
      <SkeletonLine className="h-3 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <SkeletonLine className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-3.5 w-1/3" />
            <SkeletonLine className="h-3 w-1/4" />
          </div>
          <SkeletonLine className="h-3.5 w-20 hidden sm:block" />
          <SkeletonLine className="h-3.5 w-16 hidden md:block" />
          <SkeletonLine className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
