import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuthStore } from '../stores/auth.js';
import { FullPageLoader } from './ui/Spinner.jsx';

export default function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clear = useAuthStore((state) => state.clear);

  const [checking, setChecking] = useState(Boolean(user && !accessToken));

  useEffect(() => {
    if (!user || accessToken) {
      setChecking(false);
      return;
    }

    let active = true;
    setChecking(true);

    api
      .post('/auth/refresh')
      .then(({ data }) => {
        if (active) setAuth({ user: data.user, accessToken: data.accessToken });
      })
      .catch(() => {
        if (active) clear();
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) return <FullPageLoader label="Restaurando tu sesión…" />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
