import { motion } from 'framer-motion';
import { Zap, ShieldCheck, BarChart3, Trophy, LayoutDashboard, Network } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { BackgroundCanvas } from './background/BackgroundCanvas';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-[#020617]">
      {/* WebGL Background isolated to AuthLayout */}
      <BackgroundCanvas />

      {/* LEFT SIDE - Branding & Features */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-sky-400 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Transaction Ranking System</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-md"
        >
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Production Ready <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">
              Full Stack SaaS Platform
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Modern Transaction Analytics designed for high-performance scale and seamless user experience.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <FeatureBadge icon={<ShieldCheck size={16}/>} text="Secure Authentication" />
            <FeatureBadge icon={<BarChart3 size={16}/>} text="Analytics" />
            <FeatureBadge icon={<Trophy size={16}/>} text="Leaderboard" />
            <FeatureBadge icon={<LayoutDashboard size={16}/>} text="Admin Dashboard" />
            <FeatureBadge icon={<Zap size={16}/>} text="Performance" />
            <FeatureBadge icon={<Network size={16}/>} text="REST APIs" />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Built With</p>
            <div className="flex flex-wrap gap-2">
              <TechBadge text="React" />
              <TechBadge text="FastAPI" />
              <TechBadge text="SQLite" />
              <TechBadge text="TypeScript" />
              <TechBadge text="JWT" />
              <TechBadge text="Role Based Auth" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-slate-500 text-sm"
        >
          <p>Designed & Developed by <span className="text-slate-300 font-medium">Narayan Dev</span></p>
          <p className="mt-1">Version 1.0 &copy; 2026</p>
        </motion.div>
      </div>

      {/* RIGHT SIDE - Auth Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-400 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] mb-4">
              <Zap size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-white text-center">Transaction Ranking System</h1>
          </div>

          <div className="bg-[#0F172A]/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-3xl p-8 sm:p-10 relative overflow-hidden">
            {/* Soft inner glow */}
            <div className="absolute inset-0 border border-white/5 rounded-3xl pointer-events-none" />
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
              <p className="text-slate-400 text-sm">{subtitle}</p>
            </div>

            {children}
            
            <div className="mt-8 text-center text-sm text-slate-400">
              {footer}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureBadge({ icon, text }: { icon: ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-300 text-sm">
      <div className="text-violet-400">{icon}</div>
      <span>{text}</span>
    </div>
  );
}

function TechBadge({ text }: { text: string }) {
  return (
    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 backdrop-blur-sm">
      {text}
    </span>
  );
}

export function AuthField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div className="relative space-y-1.5 group">
      <label className="text-xs font-semibold text-slate-300 ml-1 transition-colors group-focus-within:text-violet-400">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full px-4 py-3 bg-[#020617]/50 backdrop-blur-md border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F172A] transition-all duration-300 ${
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 hover:border-white/20'
          }`}
        />
        {/* Animated focus border glow */}
        <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-violet-500 to-sky-400 opacity-0 group-focus-within:opacity-20 blur-md transition-opacity duration-300" />
      </div>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-[11px] text-red-400 ml-1 font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-violet-400 hover:text-sky-400 font-semibold transition-colors duration-300">
      {children}
    </Link>
  );
}
