import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  // Exemplo simples: existe um token no localStorage? Faça sua checagem real conforme seu app!
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    // Se não autenticado, redireciona para login, mas guarda onde estava tentando ir
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  // Se autenticado, mostra a página privada normalmente
  return children;
}
