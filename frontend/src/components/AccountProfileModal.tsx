import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, MapPin, FileText, Copy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Avatar, Button } from './UI';
import { AVATAR_OPTIONS } from '../constants/avatars';
import { getApiErrorMessage } from '../lib/api';
import type { UpdateProfilePayload } from '../types';

interface AccountProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function AccountProfileModal({ open, onClose }: AccountProfileModalProps) {
  const { authUser, updateProfile, addToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authUser || !open) return;
    setName(authUser.name);
    setEmail(authUser.email);
    setAvatar(authUser.avatar);
    setBio(authUser.bio ?? '');
    setPhone(authUser.phone ?? '');
    setLocation(authUser.location ?? '');
  }, [authUser, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;

    const payload: UpdateProfilePayload = {
      name: name.trim(),
      email: email.trim(),
      avatar,
      bio: bio.trim() || null,
      phone: phone.trim() || null,
      location: location.trim() || null,
    };

    setLoading(true);
    try {
      await updateProfile(payload);
      addToast({ type: 'success', title: 'Profile updated', message: 'Your account details have been saved.' });
      onClose();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update failed',
        message: getApiErrorMessage(error, 'Could not update profile'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!authUser) return null;

  const copyUserId = async () => {
    try {
      await navigator.clipboard.writeText(authUser.userId);
      addToast({ type: 'success', title: 'Copied', message: 'User ID copied to clipboard.' });
    } catch {
      addToast({ type: 'error', title: 'Copy failed', message: 'Could not copy User ID to clipboard.' });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close profile editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10 bg-white/95 dark:bg-[#111827]/95 backdrop-blur">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Account details</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update your profile picture and personal info</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div className="flex flex-col items-center gap-4 pb-2">
                <Avatar name={name || authUser.name} colorClass={avatar} size="xl" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 text-center mb-2">Profile picture</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {AVATAR_OPTIONS.map((option) => (
                      <button
                        key={option.className}
                        type="button"
                        title={option.label}
                        onClick={() => setAvatar(option.className)}
                        className={`w-9 h-9 rounded-full ${option.className} transition-transform hover:scale-110 ${
                          avatar === option.className ? 'ring-2 ring-offset-2 ring-violet-500 dark:ring-offset-[#111827]' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <Field label="Full name" icon={<User size={14} />}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                  minLength={2}
                />
              </Field>

              <Field label="Email" icon={<Mail size={14} />}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </Field>

              <Field label="Phone" icon={<Phone size={14} />}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={inputClass}
                />
              </Field>

              <Field label="Location" icon={<MapPin size={14} />}>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className={inputClass}
                />
              </Field>

              <Field label="Bio" icon={<FileText size={14} />}>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others a little about yourself..."
                  rows={3}
                  maxLength={500}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">Your unique User ID</p>
                  <p className="mt-1 text-sm font-mono font-bold text-gray-900 dark:text-white break-all">{authUser.userId}</p>
                  <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">Use this ID when recording your transactions.</p>
                </div>
                <Button type="button" variant="secondary" size="sm" icon={<Copy size={13} />} onClick={() => void copyUserId()}>
                  Copy
                </Button>
              </div>

              <div className="text-[11px] text-gray-400 dark:text-gray-500">
                Member since {new Date(authUser.createdAt).toLocaleDateString()}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading} className="flex-1 justify-center">
                  Save changes
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40';
