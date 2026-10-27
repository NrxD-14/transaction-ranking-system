import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, RefreshCw, Bell, Mail, Smartphone, TrendingUp, Calendar, Info, Settings as SettingsIcon, Shield, Zap, LogOut, UserCircle, Phone, MapPin } from 'lucide-react';
import { Card } from '../components/Card';
import { Avatar, Button } from '../components/UI';
import { AccountProfileModal } from '../components/AccountProfileModal';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { APP_NAME, APP_VERSION, DEVELOPER, FOOTER_TEXT } from '../constants/app';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <motion.button
      onClick={onChange}
      whileTap={{ scale: 0.95 }}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${enabled ? 'bg-violet-600' : 'bg-gray-200 dark:bg-white/20'}`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </motion.button>
  );
}

function SettingRow({ icon, title, description, children }: { icon: React.ReactNode; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 dark:border-white/10 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
          {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

const formulaSteps = [
  { label: 'Base Score', formula: 'Amount × 0.001', color: 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300' },
  { label: 'Count Bonus', formula: '(Tx Count × 10)', color: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300' },
  { label: 'Consistency', formula: '(Streak × 5)', color: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  { label: 'Recency', formula: 'Days Active × 2', color: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300' },
];

export default function Settings() {
  const { settings, updateSettings, addToast, authUser, logout } = useApp();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    addToast({ type: 'info', title: 'Signed out', message: 'You have been logged out.' });
    navigate('/login');
  };

  const toggleNotif = (key: keyof typeof settings.notifications) => {
    updateSettings({ notifications: { ...settings.notifications, [key]: !settings.notifications[key] } });
  };

  const handleSave = () => {
    setSaved(true);
    addToast({ type: 'success', title: 'Settings saved', message: 'Your preferences have been updated.' });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-violet-600 dark:text-violet-400" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Account</h2>
            </div>
            {authUser && (
              <Button size="sm" variant="secondary" icon={<UserCircle size={14} />} onClick={() => setProfileOpen(true)}>
                Edit profile
              </Button>
            )}
          </div>
          {authUser && (
            <>
              <div className="flex items-center gap-4 pb-4 mb-4 border-b border-gray-100 dark:border-white/10">
                <Avatar name={authUser.name} colorClass={authUser.avatar} size="lg" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{authUser.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{authUser.email}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-1">{authUser.userId}</p>
                </div>
              </div>
              {authUser.bio && (
                <div className="py-2 border-b border-gray-50 dark:border-white/5">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Bio</span>
                  <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">{authUser.bio}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2">
                {authUser.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
                    <Phone size={13} className="text-gray-400" />
                    {authUser.phone}
                  </div>
                )}
                {authUser.location && (
                  <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
                    <MapPin size={13} className="text-gray-400" />
                    {authUser.location}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <LogOut size={16} className="text-red-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Logout</h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Sign out of your account on this device. You can sign back in anytime.
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/15 rounded-xl transition-colors"
          >
            <LogOut size={15} /> Sign out
          </button>
        </Card>
      </motion.div>

      <AccountProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon size={16} className="text-violet-600 dark:text-violet-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Appearance</h2>
          </div>
          <SettingRow icon={settings.darkMode ? <Moon size={16} className="text-blue-400" /> : <Sun size={16} className="text-amber-500" />} title="Dark Mode" description="Switch between light and dark interface">
            <Toggle enabled={settings.darkMode} onChange={() => updateSettings({ darkMode: !settings.darkMode })} />
          </SettingRow>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={16} className="text-blue-500 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Data & Refresh</h2>
          </div>
          <SettingRow icon={<RefreshCw size={16} className="text-blue-500 dark:text-blue-400" />} title="Auto Refresh" description="Automatically refresh dashboard data">
            <Toggle enabled={settings.autoRefresh} onChange={() => updateSettings({ autoRefresh: !settings.autoRefresh })} />
          </SettingRow>
          {settings.autoRefresh && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-3">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-2">Refresh Interval</label>
              <div className="flex gap-2">
                {[15, 30, 60, 120].map(val => (
                  <button key={val} onClick={() => updateSettings({ refreshInterval: val })} className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${settings.refreshInterval === val ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'}`}>
                    {val}s
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <SettingRow icon={<Mail size={16} className="text-blue-400" />} title="Email Notifications" description="Receive alerts via email">
            <Toggle enabled={settings.notifications.email} onChange={() => toggleNotif('email')} />
          </SettingRow>
          <SettingRow icon={<Smartphone size={16} className="text-emerald-500" />} title="Push Notifications" description="Browser push notifications">
            <Toggle enabled={settings.notifications.push} onChange={() => toggleNotif('push')} />
          </SettingRow>
          <SettingRow icon={<Zap size={16} className="text-violet-500 dark:text-violet-400" />} title="Transaction Alerts" description="Alert when new transactions arrive">
            <Toggle enabled={settings.notifications.transactionAlerts} onChange={() => toggleNotif('transactionAlerts')} />
          </SettingRow>
          <SettingRow icon={<TrendingUp size={16} className="text-rose-400" />} title="Rank Changes" description="Notify when your rank changes">
            <Toggle enabled={settings.notifications.rankChanges} onChange={() => toggleNotif('rankChanges')} />
          </SettingRow>
          <SettingRow icon={<Calendar size={16} className="text-orange-400" />} title="Weekly Report" description="Receive a weekly summary">
            <Toggle enabled={settings.notifications.weeklyReport} onChange={() => toggleNotif('weeklyReport')} />
          </SettingRow>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-emerald-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Ranking Formula Preview</h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
            Scores are calculated using a composite formula based on transaction volume, frequency, consistency, and recency.
          </p>
          <div className="space-y-2.5">
            {formulaSteps.map((step, i) => (
              <motion.div key={step.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07 }} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">{i + 1}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{step.label}</span>
                </div>
                <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg ${step.color}`}>{step.formula}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
            <p className="text-xs text-violet-700 dark:text-violet-300 font-mono text-center">
              Final Score = Σ (Base + Count + Consistency + Recency)
            </p>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-gray-400 dark:text-gray-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">About Application</h2>
          </div>
          {[['Application', APP_NAME], ['Version', `v${APP_VERSION}`], ['Environment', 'Production'], ['Developer', DEVELOPER.name]].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5 last:border-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{value}</span>
            </div>
          ))}
          <p className="text-[10px] text-gray-400 dark:text-gray-500 pt-3 text-center">{FOOTER_TEXT}</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle size={16} className="text-violet-600 dark:text-violet-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">About Developer</h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">{DEVELOPER.name}</p>
          <div className="space-y-2 text-xs">
            <a href={`mailto:${DEVELOPER.email}`} className="block text-violet-600 dark:text-violet-400 hover:underline">{DEVELOPER.email}</a>
            <a href={DEVELOPER.github} target="_blank" rel="noopener noreferrer" className="block text-violet-600 dark:text-violet-400 hover:underline">GitHub</a>
            
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="pb-6">
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-violet-200 dark:shadow-violet-900/30 flex items-center justify-center gap-2"
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </motion.button>
      </motion.div>
    </div>
  );
}
