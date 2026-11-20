import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useUiStore } from './stores/ui.js';
import LoginPage from './pages/LoginPage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SalesPage from './pages/SalesPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import ExpensesPage from './pages/ExpensesPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function ThemeSync() {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}

export default function App() {
  const theme = useUiStore((state) => state.theme);

  return (
    <>
      <ThemeSync />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            borderRadius: '14px',
            background: theme === 'dark' ? '#0f172a' : '#ffffff',
            color: theme === 'dark' ? '#e2e8f0' : '#0f172a',
            border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`,
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 18px 40px -20px rgba(15,23,42,.35)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#ffffff' } },
        }}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/catalogo/:slug" element={<CatalogPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="ventas" element={<SalesPage />} />
            <Route path="productos" element={<ProductsPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
            <Route path="gastos" element={<ExpensesPage />} />
            <Route path="ajustes" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
