/** Admin users page — searchable, sortable, paginated user table. */
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronUp, ChevronDown, UserCircle } from 'lucide-react';
import { Card } from '../../components/Card';
import { Avatar, Badge, Button } from '../../components/UI';
import { Loader } from '../../components/Loader';
import { Pagination } from '../../components/admin/Pagination';
import { adminApi } from '../../lib/api';
import { useAdminPolling } from '../../hooks/useAdminPolling';
import type { AdminUserRow } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';

type SortKey = 'name' | 'email' | 'role' | 'joinedAt' | 'transactionCount' | 'totalAmount';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('joinedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const pageSize = 10;

  const load = useCallback(async () => {
    try {
      const res = await adminApi.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        sortBy,
        sortDir,
        page,
        pageSize,
      });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Failed to load admin users:', error);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, sortBy, sortDir, page]);

  useEffect(() => { void load(); }, [load]);
  useAdminPolling(load);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortBy !== col) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const totalPages = Math.ceil(total / pageSize);

  const columns: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'joinedAt', label: 'Joined' },
    { key: 'transactionCount', label: 'Transactions' },
    { key: 'totalAmount', label: 'Total Amount' },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12"><Loader /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Avatar</th>
                  {columns.map(col => (
                    <th key={col.key} className="text-left px-4 py-3">
                      <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-violet-600 transition-colors">
                        {col.label} <SortIcon col={col.key} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelected(user)}
                    className="border-b border-gray-50 dark:border-white/5 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3"><Avatar name={user.name} colorClass={user.avatar} profilePicture={user.profilePicture} size="sm" /></td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'admin' ? 'purple' : 'default'}>{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(user.joinedAt)}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{user.transactionCount}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatCurrency(user.totalAmount)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/10 p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar name={selected.name} colorClass={selected.avatar} profilePicture={selected.profilePicture} size="lg" />
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{selected.name}</h3>
                    <p className="text-xs text-gray-500">{selected.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-900 dark:text-white">{selected.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Role</span><Badge variant={selected.role === 'admin' ? 'purple' : 'default'}>{selected.role}</Badge></div>
                <div className="flex justify-between"><span className="text-gray-500">Joined</span><span>{formatDate(selected.joinedAt)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Transactions</span><span>{selected.transactionCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Amount</span><span className="font-semibold">{formatCurrency(selected.totalAmount)}</span></div>
              </div>
              <Button className="w-full mt-5 justify-center" variant="secondary" icon={<UserCircle size={14} />} onClick={() => setSelected(null)}>
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
