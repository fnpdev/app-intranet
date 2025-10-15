import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LayoutBase from './components/LayoutBase';
import ModuleRoute from './routes/ModuleRoute';

import modules from './config/modules.json';
import routeComponents from './config/routeComponents';

// Helper para extrair rotas
const getAllRoutes = () => {
  const rotas = [];
  modules.forEach((mod) => {
    (mod.menus || []).forEach((menu) => {
      rotas.push({
        ...menu,
        parentModule: mod.key,
        enabledField: mod.enabledField
      });
    });
  });
  return rotas;
};

export default function App() {
  const allRoutes = getAllRoutes();
  const NotAuthorized = routeComponents["/not-authorized"];
  const NotFound = routeComponents["*"];

  // Públicos SEM layout base
  const publicNoLayout = allRoutes.filter(r => r.public && !r.withLayout);

  // Públicos COM layout base (ex: home)
  const publicWithLayout = allRoutes.filter(r => r.public && r.withLayout);

  // Privados
  const privateRoutes = allRoutes.filter(r => !r.public);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas SEM LayoutBase (login, etc) */}
          {publicNoLayout.map((r) => {
            const Component = routeComponents[r.path];
            return (
              <Route
                key={r.path}
                path={r.path}
                element={<Component />}
              />
            );
          })}

          {/* Rotas públicas COM LayoutBase (ex: Home) */}
          {publicWithLayout.length > 0 && (
            <Route element={<LayoutBase />}>
              {publicWithLayout.map((r) => {
                const Component = routeComponents[r.path];
                return (
                  <Route
                    key={r.path}
                    path={r.path}
                    element={<Component />}
                  />
                );
              })}
              {/* Você pode opcionalmente aceitar not-authorized como pública com LayoutBase também */}
            </Route>
          )}

          {/* Rotas privadas, sempre com LayoutBase */}
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

          {/* 404 padrão */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
