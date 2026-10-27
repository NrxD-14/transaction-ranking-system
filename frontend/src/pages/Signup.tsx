/**
 * Signup page — creates account + ranking profile via POST /auth/signup.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthField, AuthLayout, AuthLink } from '../components/AuthLayout';
import { useApp } from '../context/AppContext';
import { getApiErrorMessage } from '../lib/api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { signup, addToast } = useApp();
  const navigate = useNavigate();

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
      addToast({ type: 'success', title: 'Account created', message: 'Welcome to TRS!' });
      navigate('/dashboard', { replace: true });
    } catch (error: unknown) {
      addToast({
        type: 'error',
        title: 'Signup failed',
        message: getApiErrorMessage(error, 'Could not create account'),
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrength = (pw: string) => {
    if (pw.length === 0) return 0;
    let score = 0;
    if (pw.length > 5) score += 25;
    if (pw.length > 7) score += 25;
    if (/[A-Z]/.test(pw)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pw)) score += 25;
    return score;
  };
  
  const pwStrength = getStrength(password);
  const strengthColor = 
    pwStrength < 50 ? 'bg-red-400' :
    pwStrength < 75 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join the Transaction Ranking System"
      footer={
        <span>Already have an account? <AuthLink to="/login">Sign in</AuthLink></span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          label="Full name"
          value={name}
          onChange={setName}
          placeholder="Narayan Dev"
          error={errors.name}
          autoComplete="name"
        />
        <AuthField
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          error={errors.email}
          autoComplete="email"
        />
        
        <div className="space-y-2">
          <AuthField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            error={errors.password}
            autoComplete="new-password"
          />
          {/* Password Strength Meter */}
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1">
            <motion.div 
              className={`h-full ${strengthColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${pwStrength}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AuthField
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repeat password"
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 p-[1px] group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-violet-600 px-6 py-3 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
            <span className="text-sm font-semibold text-white tracking-wide">
              {loading ? 'Creating account...' : 'Create Account'}
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
                  <UserPlus size={16} className="text-white group-hover:scale-110 transition-transform" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      </form>
    </AuthLayout>
  );
}
