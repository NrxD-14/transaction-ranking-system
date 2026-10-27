/** Admin panel layout — separate from user app, same design language. */
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminNavbar } from './AdminNavbar';
import { Footer } from '../Footer';

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0B0F1A] overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminNavbar />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col"
        >
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
        </motion.main>
      </div>
    </div>
  );
}
