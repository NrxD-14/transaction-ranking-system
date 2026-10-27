/** Admin settings — system info, developer about section. */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Info, Server, Database, Code, Globe, Github, Mail, ExternalLink, User,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Loader } from '../../components/Loader';
import { adminApi } from '../../lib/api';
import type { AdminSettingsInfo } from '../../types';
import { APP_NAME, APP_VERSION, FOOTER_TEXT } from '../../constants/app';

export default function AdminSettings() {
  const [info, setInfo] = useState<AdminSettingsInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getSettings()
      .then(res => setInfo(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!info) return <p className="text-sm text-red-500">Failed to load settings</p>;

  const systemRows = [
    { icon: <Info size={16} className="text-violet-500" />, label: 'Application Version', value: info.applicationVersion },
    { icon: <Database size={16} className="text-blue-500" />, label: 'Database', value: info.database },
    { icon: <Server size={16} className="text-emerald-500" />, label: 'Backend Status', value: info.backendStatus },
    { icon: <Globe size={16} className="text-amber-500" />, label: 'Environment', value: info.environment },
    { icon: <Code size={16} className="text-rose-500" />, label: 'API Version', value: info.apiVersion },
  ];

  const devLinks = [
    { icon: Mail, label: 'Email', href: `mailto:${info.developer.email}`, text: info.developer.email },
    { icon: Github, label: 'GitHub', href: info.developer.github, text: 'NrxD-14' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server size={16} className="text-violet-600 dark:text-violet-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">System Information</h2>
          </div>
          {systemRows.map(row => (
            <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-white/5 last:border-0">
              <div className="flex items-center gap-2.5">
                {row.icon}
                <span className="text-xs text-gray-500 dark:text-gray-400">{row.label}</span>
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 capitalize">{row.value}</span>
            </div>
          ))}
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">About</h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
            {APP_NAME} v{APP_VERSION} — A production-quality transaction ranking platform with role-based authentication and a secure admin panel.
          </p>
          <p className="text-[11px] text-gray-400">{FOOTER_TEXT}</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-violet-600 dark:text-violet-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">About Developer</h2>
          </div>
          <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-100 dark:border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-lg font-bold">
              ND
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-white">{info.developer.name}</p>
              <p className="text-xs text-gray-500">Full-Stack Developer</p>
            </div>
          </div>
          <div className="space-y-3">
            {devLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                  <link.icon size={14} className="text-gray-500 group-hover:text-violet-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{link.label}</p>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-violet-600 transition-colors">{link.text}</p>
                </div>
                <ExternalLink size={12} className="text-gray-300 group-hover:text-violet-400" />
              </a>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
