import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedPermissions = localStorage.getItem('permissions');
    if (savedToken && savedPermissions) {
      setToken(savedToken);
      setPermissions(JSON.parse(savedPermissions));
    }
    setLoading(false);
  }, []);

  const login = ({ token, permissions }) => {
    setToken(token);
    setPermissions(permissions);
    localStorage.setItem('token', token);
    localStorage.setItem('permissions', JSON.stringify(permissions));
  };

  const logout = () => {
    setToken(null);
    setPermissions({});
    localStorage.removeItem('token');
    localStorage.removeItem('permissions');
  };

  // Só renderiza children depois de carregar info do localStorage!
  if (loading) return <div>Carregando...</div>;

  return (
    <AuthContext.Provider value={{ token, permissions, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
