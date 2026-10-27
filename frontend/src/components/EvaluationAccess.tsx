/** Collapsible evaluation access gate — in-memory unlock only, never persisted. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Lock, Shield, Eye, EyeOff, Copy, CheckCircle2, Unlock,
} from 'lucide-react';
import { DEMO_ADMIN, EVALUATION_CODE } from '../constants/app';
import { useApp } from '../context/AppContext';

export function EvaluationAccess() {
  const { addToast, evaluationUnlocked, unlockEvaluationAccess } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (expanded && !evaluationUnlocked) {
      inputRef.current?.focus();
    }
  }, [expanded, evaluationUnlocked]);

  useEffect(() => {
    if (!evaluationUnlocked) {
      setShowPassword(false);
    }
  }, [evaluationUnlocked]);

  const grantAccess = useCallback(() => {
    unlockEvaluationAccess();
  }, [unlockEvaluationAccess]);

  const handleUnlock = useCallback(async () => {
    if (checking || evaluationUnlocked) return;
    setChecking(true);
    await new Promise(r => setTimeout(r, 450));
    if (code.trim() === EVALUATION_CODE) {
      grantAccess();
    } else {
      setShake(true);
      addToast({
        type: 'error',
        title: 'Invalid Evaluation Code.',
        message: 'Refer to the README for evaluator instructions.',
      });
      setTimeout(() => setShake(false), 500);
    }
    setChecking(false);
  }, [checking, evaluationUnlocked, code, grantAccess, addToast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleUnlock();
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      addToast({ type: 'success', title: 'Copied', message: `${label} copied to clipboard.` });
    } catch {
      addToast({ type: 'error', title: 'Copy failed', message: 'Could not copy to clipboard.' });
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md transition-colors group"
      >
        <div className="flex items-center gap-3 text-slate-300 group-hover:text-white transition-colors">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
            <Lock size={15} strokeWidth={2.25} className="text-violet-400" />
          </div>
          <div className="text-left">
            <span className="block text-sm font-semibold">Evaluation Access</span>
            <span className="block text-xs text-slate-500">Administrator access for assignment review</span>
          </div>
        </div>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }}>
          <ChevronDown size={18} className="text-slate-500 group-hover:text-slate-300" />
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
              <AnimatePresence mode="wait">
                {!evaluationUnlocked ? (
                  <motion.div
                    key="locked"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="space-y-4"
                  >
                    <motion.div
                      animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
                      transition={{ duration: 0.45 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2 relative group">
                        <label htmlFor="evaluation-code" className="text-xs font-semibold text-slate-300 transition-colors group-focus-within:text-violet-400 ml-1">
                          Evaluation Code
                        </label>
                        <div className="relative">
                          <input
                            ref={inputRef}
                            id="evaluation-code"
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter code..."
                            autoComplete="off"
                            spellCheck={false}
                            className={`w-full px-4 py-3.5 bg-[#020617]/50 backdrop-blur-md border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F172A] transition-all duration-300 ${
                              shake
                                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                                : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20'
                            }`}
                          />
                          <div className={`absolute inset-0 -z-10 rounded-xl blur-md transition-opacity duration-300 opacity-0 group-focus-within:opacity-20 ${shake ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-sky-400'}`} />
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => void handleUnlock()}
                        disabled={checking || !code.trim()}
                        className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-[1px] group disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                        <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
                          <span className="text-sm font-semibold text-white tracking-wide">
                            {checking ? 'Unlocking...' : 'Unlock Credentials'}
                          </span>
                          <AnimatePresence mode="wait">
                            {checking ? (
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
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                              >
                                <Unlock size={15} className="text-white" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="unlocked"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-emerald-300">
                        Access Granted
                      </span>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06, duration: 0.35 }}
                      className="p-5 rounded-xl bg-gradient-to-br from-violet-500/10 to-sky-500/5 border border-violet-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                    >
                      <div className="flex items-center gap-2 mb-5">
                        <Shield size={16} className="text-violet-400" />
                        <span className="text-sm font-bold text-white">Administrator Account</span>
                      </div>

                      <div className="space-y-4">
                        <div className="group/field">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Email</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-mono text-slate-200">{DEMO_ADMIN.email}</p>
                            <button
                              onClick={() => void copyToClipboard(DEMO_ADMIN.email, 'Email')}
                              className="text-slate-500 hover:text-violet-400 transition-colors p-1"
                              title="Copy Email"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="group/field">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Password</p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-mono text-slate-200">
                              {showPassword ? DEMO_ADMIN.password : '••••••••••••••'}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowPassword(v => !v)}
                                className="text-slate-500 hover:text-violet-400 transition-colors p-1"
                                title="Toggle Password"
                              >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button
                                onClick={() => void copyToClipboard(DEMO_ADMIN.password, 'Password')}
                                className="text-slate-500 hover:text-violet-400 transition-colors p-1"
                                title="Copy Password"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
