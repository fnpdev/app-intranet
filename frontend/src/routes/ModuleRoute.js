import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function ModuleRoute({ module, children }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token) {
    // 🔒 Usuário não autenticado → redireciona para login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasPermission = user?.permissions?.[module];

  if (hasPermission === false) {
    // 🚫 Sem permissão → página de acesso negado
    return <Navigate to="/not-authorized" replace />;
  }

  // ✅ Usuário autenticado e com permissão → renderiza a rota
  return children;
}
