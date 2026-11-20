import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), []);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950">
      <Sidebar open={mobileMenuOpen} onClose={closeMobileMenu} />
      <div className="lg:pl-64">
        <Topbar onOpenMenu={openMobileMenu} />
        <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 pb-6 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
