import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function ModuleRoute({ module, children }) {
  const { permissions, token } = useAuth();
  const location = useLocation();

  if (!token) {
    // Não autenticado → login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!permissions?.[module]) {
    // Sem permissão → acesso negado
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}
