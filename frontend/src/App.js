import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { AuthProvider, useAuth } from './context/AuthContext';
import LayoutBase from './layout/LayoutBase';
import DynamicRoutes from './config/DynamicRoutes';
import { staticRoutes } from './config/routeComponents';

// ========================= TokenWatcher =========================
function TokenWatcher({ children }) {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!token) return;

    try {
      const { exp } = jwtDecode(token);
      const agora = Date.now();
      const tempoRestante = exp * 1000 - agora;

      if (tempoRestante <= 0) {
        logout();
        navigate('/login');
        return;
      }

      const timer = setTimeout(() => {
        logout();
        navigate('/login');
      }, tempoRestante);

      return () => clearTimeout(timer);
    } catch {
      logout();
      navigate('/login');
    }
  }, [token, logout, navigate]);

  return children;
}

// ========================= AppRoutes =========================
function AppRoutes() {
  const { token, modules } = useAuth();

  return (
    <Routes>
      {/* Rotas públicas SEM Layout */}
      {staticRoutes?.publicNoLayout?.map((r) => (
        <Route key={r.path} path={r.path} element={<r.element />} />
      ))}

      {/* Rotas públicas COM Layout */}
      {staticRoutes?.publicWithLayout?.length > 0 && (
        <Route element={<LayoutBase />}>
          {staticRoutes.publicWithLayout.map((r) => (
            <Route key={r.path} path={r.path} element={<r.element />} />
          ))}
        </Route>
      )}

      {/* Rotas privadas — baseadas nos módulos do usuário */}
      {token && modules?.length > 0 && (
        <Route element={<LayoutBase />}>
          {DynamicRoutes({ modules })}
        </Route>
      )}

      {/* Acesso negado e 404 */}
      <Route path="/not-authorized" element={<staticRoutes.NotAuthorized />} />
      <Route path="*" element={<staticRoutes.NotFound />} />
    </Routes>
  );
}

// ========================= App principal =========================
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <TokenWatcher>
          <AppRoutes />
        </TokenWatcher>
      </Router>
    </AuthProvider>
  );
}
