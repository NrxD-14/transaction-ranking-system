/**
 * Login page — calls AppContext.login() which POSTs to /auth/login and stores JWT.
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthField, AuthLayout, AuthLink } from '../components/AuthLayout';
import { EvaluationAccess } from '../components/EvaluationAccess';
import { useApp } from '../context/AppContext';
import { getApiErrorMessage } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { login, addToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      addToast({ type: 'success', title: 'Welcome back', message: 'You are now signed in.' });
      const destination = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      navigate(from === '/' || from === '/dashboard' ? destination : from, { replace: true });
    } catch (error: unknown) {
      addToast({
        type: 'error',
        title: 'Login failed',
        message: getApiErrorMessage(error, 'Invalid email or password'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access the Transaction Ranking System"
      footer={
        <div className="flex flex-col gap-2">
          <span>Don&apos;t have an account? <AuthLink to="/signup">Create one</AuthLink></span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <AuthField
            label="Email Address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            error={errors.email}
            autoComplete="email"
          />
          
          <AuthField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            error={errors.password}
            autoComplete="current-password"
          />
          
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center w-4 h-4 rounded border border-white/20 bg-white/5 transition-colors group-hover:border-violet-400">
                <input type="checkbox" className="peer sr-only" />
                <motion.svg 
                  className="w-3 h-3 text-violet-400 opacity-0 peer-checked:opacity-100 transition-opacity" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              </div>
              <span className="text-xs text-slate-300 group-hover:text-white transition-colors">Remember me</span>
            </label>
            <a href="#" className="text-xs text-violet-400 hover:text-sky-400 font-medium transition-colors">Forgot Password?</a>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-[1px] group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
            <span className="text-sm font-semibold text-white tracking-wide">
              {loading ? 'Signing in...' : 'Sign In'}
            </span>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                </motion.div>
              ) : (
                <motion.div
                  key="icon"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ArrowRight size={16} className="text-white group-hover:translate-x-1 transition-transform" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      </form>
      
      <div className="mt-8 pt-6 border-t border-white/10 relative">
        <EvaluationAccess />
      </div>
    </AuthLayout>
  );
}
