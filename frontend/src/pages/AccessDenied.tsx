/** Access denied page for unauthorized admin access attempts. */
import { motion } from 'framer-motion';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/UI';

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <ShieldOff size={32} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          You don&apos;t have permission to access the admin panel. This area is restricted to administrators only.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard">
            <Button icon={<Home size={16} />}>Go to Dashboard</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" icon={<ArrowLeft size={16} />}>Back to Login</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
