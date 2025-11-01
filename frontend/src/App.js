import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { AuthProvider, useAuth } from './context/AuthContext';
import LayoutBase from './components/LayoutBase';
import ModuleRoute from './routes/ModuleRoute';

import modules from './config/modules.json';
import routeComponents from './config/routeComponents';

// ===============================================
// 🧩 Helper: extrai rotas de módulos habilitados
// ===============================================
function getRoutesByPermissions(permissions = {}) {
  const rotas = [];
  modules.forEach((mod) => {
    const isEnabled =
      mod.enabledField === null || // módulo público
      permissions[mod.enabledField] === true; // módulo habilitado
    
    if (isEnabled) {
      (mod.menus || []).forEach((menu) => {
        rotas.push({
          ...menu,
          parentModule: mod.key,
          enabledField: mod.enabledField,
        });
      });
    }
  });
  return rotas;
}

// ===============================================
// 🔐 TokenWatcher — Monitora expiração do JWT
// ===============================================
function TokenWatcher({ children }) {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    try {
      const { exp } = jwtDecode(token);
      const agora = Date.now();
      const tempoRestante = exp * 1000 - agora;

      if (tempoRestante <= 0) {
        console.warn('⏰ Token expirado — encerrando sessão');
        logout();
        navigate('/login');
        return;
      }

      const timer = setTimeout(() => {
        console.warn('⏰ Token expirou — logout automático');
        logout();
        navigate('/login');
      }, tempoRestante);

      return () => clearTimeout(timer);
    } catch {
      console.error('❌ Token inválido — forçando logout');
      logout();
      navigate('/login');
    }
  }, [token, logout, navigate]);

  return children;
}

// ===============================================
// 🔧 Componente principal das rotas
// ===============================================
function AppRoutes() {
  const { user } = useAuth(); // agora temos permissions do backend
  const permissions = user?.permissions || {};

  // 🔍 filtra rotas conforme permissões
  const allRoutes = getRoutesByPermissions(permissions);
  const NotAuthorized = routeComponents['/not-authorized'];
  const NotFound = routeComponents['*'];

  const publicNoLayout = allRoutes.filter((r) => r.public && !r.withLayout);
  const publicWithLayout = allRoutes.filter((r) => r.public && r.withLayout);
  const privateRoutes = allRoutes.filter((r) => !r.public);

  return (
    <Routes>
      {/* 🔓 Rotas públicas SEM layout */}
      {publicNoLayout.map((r) => {
        const Component = routeComponents[r.path];
        return <Route key={r.path} path={r.path} element={<Component />} />;
      })}

      {/* 🔓 Rotas públicas COM LayoutBase */}
      {publicWithLayout.length > 0 && (
        <Route element={<LayoutBase />}>
          
          {publicWithLayout.map((r) => {
            const Component = routeComponents[r.path];
            return <Route key={r.path} path={r.path} element={<Component />} />;
          })}
        </Route>
      )}

      {/* 🔒 Rotas privadas (só módulos com permissão) */}
      <Route element={<LayoutBase />}>
        {privateRoutes.map((r) => {
          const Component = routeComponents[r.path];
          return (
            <Route
              key={r.path}
              path={r.path}
              element={
                <ModuleRoute module={r.enabledField}>
                  <Component />
                </ModuleRoute>
              }
            />
          );
        })}
        <Route path="/not-authorized" element={<NotAuthorized />} />
      </Route>

      {/* 🚫 404 padrão */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ===============================================
// 🚀 App principal com Provider + Watcher
// ===============================================
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
