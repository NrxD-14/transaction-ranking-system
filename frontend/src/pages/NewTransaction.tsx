/**
 * New Transaction page — validates form, POSTs to /transaction, reloads dashboard data.
 * Duplicate transactionId is rejected by backend with HTTP 409.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, AlertCircle, Hash, DollarSign, Calendar, CreditCard, User, Info, Zap } from 'lucide-react';
import { Card } from '../components/Card';
import { Loader } from '../components/Loader';
import { Button } from '../components/UI';
import { useApp } from '../context/AppContext';
import { transactionApi } from '../lib/api';
import type { TransactionType } from '../types';

const txTypes: TransactionType[] = ['transfer', 'payment', 'deposit', 'withdrawal', 'refund'];

const typeColors: Record<string, string> = {
  transfer: 'border-violet-400 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300',
  payment: 'border-blue-400 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300',
  deposit: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  withdrawal: 'border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300',
  refund: 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300',
};

interface FormState {
  userId: string;
  transactionId: string;
  amount: string;
  type: TransactionType;
  date: string;
  description: string;
}

const emptyForm: FormState = {
  userId: '',
  transactionId: '',
  amount: '',
  type: 'transfer',
  date: new Date().toISOString().split('T')[0],
  description: '',
};

const rules = [
  { icon: Hash, text: 'Transaction ID must be unique across all records' },
  { icon: User, text: 'User ID must correspond to an existing user account' },
  { icon: DollarSign, text: 'Amount must be greater than $0.00' },
  { icon: Calendar, text: 'Date cannot be set to a future date' },
];

export default function NewTransaction() {
  const { addToast, users, transactions, dataLoading, reloadData, authUser } = useApp();
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    userId: authUser?.userId ?? '',
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.userId.trim()) errs.userId = 'User ID is required';
    else if (!users.find(u => u.id === form.userId.trim())) errs.userId = 'User not found in the system';
    if (!form.transactionId.trim()) errs.transactionId = 'Transaction ID is required';
    else if (transactions.find(t => t.id === form.transactionId.trim())) errs.transactionId = 'Duplicate: this Transaction ID already exists';
    if (!form.amount) errs.amount = 'Amount is required';
    else if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) errs.amount = 'Amount must be a positive number';
    if (!form.date) errs.date = 'Date is required';
    else if (new Date(form.date) > new Date()) errs.date = 'Date cannot be in the future';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await transactionApi.create({
        transactionId: form.transactionId.trim(),
        userId: form.userId.trim(),
        amount: Number(form.amount),
        type: form.type,
        date: new Date(form.date).toISOString(),
        description: form.description,
      });
      await reloadData();
      addToast({ type: 'success', title: 'Transaction submitted', message: `${form.transactionId} for $${Number(form.amount).toLocaleString()} has been recorded successfully.` });
      setForm({ ...emptyForm, userId: authUser?.userId ?? '' });
      setErrors({});
    } catch (error: any) {
      const message = error?.response?.data?.detail ?? 'Failed to submit transaction';
      addToast({ type: 'error', title: 'Submission failed', message });
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
    },
  });

  const inputClass = (key: keyof FormState) =>
    `w-full px-4 py-3 bg-white dark:bg-white/5 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors[key] ? 'border-red-400 focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-500/20' : 'border-[#E5E7EB] dark:border-white/10 focus:border-violet-400 focus:ring-violet-100 dark:focus:ring-violet-500/20'}`;

  if (dataLoading) return <Loader />;
  const exampleUser = users[4] ?? users[0];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                <PlusCircle size={20} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">New Transaction</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fill in the details to record a transaction</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <User size={12} className="text-gray-400" /> User ID
                  </label>
                  <input {...field('userId')} placeholder="USR-0001" className={inputClass('userId')} />
                  {errors.userId && <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.userId}</p>}
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Your account ID is prefilled. Find or copy it under Account details.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Hash size={12} className="text-gray-400" /> Transaction ID
                  </label>
                  <input {...field('transactionId')} placeholder="TXN-999999" className={inputClass('transactionId')} />
                  {errors.transactionId && <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.transactionId}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <DollarSign size={12} className="text-gray-400" /> Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input {...field('amount')} type="number" min="0.01" step="0.01" placeholder="0.00" className={`${inputClass('amount')} pl-7`} />
                  </div>
                  {errors.amount && <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.amount}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-400" /> Date
                  </label>
                  <input {...field('date')} type="date" className={inputClass('date')} />
                  {errors.date && <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11} />{errors.date}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <CreditCard size={12} className="text-gray-400" /> Transaction Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {txTypes.map(t => (
                    <motion.button
                      key={t}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setForm(prev => ({ ...prev, type: t }))}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border-2 transition-all capitalize ${form.type === t ? typeColors[t] : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'}`}
                    >
                      {t}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Description (optional)</label>
                <textarea
                  {...field('description')}
                  placeholder="Add a note about this transaction..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/20 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10">
                <button type="button" onClick={() => { setForm({ ...emptyForm, userId: authUser?.userId ?? '' }); setErrors({}); }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  Clear form
                </button>
                <Button type="submit" loading={loading} icon={<PlusCircle size={15} />} size="lg">
                  Submit Transaction
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Side Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Validation Rules</h3>
            </div>
            <div className="space-y-3">
              {rules.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={12} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 border-amber-200 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Duplicate Prevention</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Each Transaction ID must be globally unique. The system checks existing records before saving. Duplicate IDs will be rejected with an error.
            </p>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-violet-50 dark:from-violet-500/5 to-purple-50/30 dark:to-purple-500/5 border-violet-100 dark:border-violet-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Info size={16} className="text-violet-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Example Transaction</h3>
            </div>
            <div className="space-y-2.5">
              {[['User ID', authUser?.userId ?? exampleUser?.id ?? 'USR-0001'], ['Transaction ID', 'TXN-000999'], ['Amount', '$12,500'], ['Type', 'Transfer'], ['Date', new Date().toLocaleDateString()]].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 font-mono">{value}</span>
                </div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setForm({ userId: authUser?.userId ?? exampleUser?.id ?? 'USR-0001', transactionId: 'TXN-000999', amount: '12500', type: 'transfer', date: new Date().toISOString().split('T')[0], description: 'Example wire transfer' })}
              className="mt-4 w-full py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-500/15 hover:bg-violet-200 dark:hover:bg-violet-500/25 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap size={12} /> Fill Example Data
            </motion.button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
