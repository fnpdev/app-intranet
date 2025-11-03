import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { AuthProvider, useAuth } from './context/AuthContext';
import LayoutBase from './layout/LayoutBase';
import DynamicRoutes from './config/DynamicRoutes';
import { staticRoutes } from './config/routeComponents';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// ========================= TokenWatcher =========================
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
  const { token } = useAuth();
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      if (!token) {
        setModules([]);
        setLoadingModules(false);
        return;
      }
      
      try {
        const resp = await axios.get(`${API_URL}/api/modules`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.data?.success) setModules(resp.data.data || []);
      } catch (err) {
        console.error('Erro ao buscar módulos:', err);
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModules();
  }, [token]);

  if (loadingModules) {
    return <div style={{ textAlign: 'center', padding: 40 }}>🔄 Carregando módulos... </div>;
  }

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

      {/* Rotas privadas (dinâmicas do backend) */}
      {token && (
        <Route element={<LayoutBase />}>
          {DynamicRoutes({ modules })} {/* ✅ chamando a função diretamente */}
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
