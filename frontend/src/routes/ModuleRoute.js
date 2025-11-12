import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function ModuleRoute({ module, children }) {
  const { token, hasModuleAccess, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasModuleAccess(module)) {
    console.warn('🚫 Acesso negado ao módulo:', module, 'para usuário', user?.username);
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
}
