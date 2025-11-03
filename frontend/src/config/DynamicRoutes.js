import React from 'react';
import { Route } from 'react-router-dom';
import { loadDynamicComponent } from './routeComponents';
import ModuleRoute from '../routes/ModuleRoute';

export default function DynamicRoutes({ modules = [] }) {
  if (!Array.isArray(modules) || modules.length === 0) return null;

  return (
    <>
      {modules.flatMap((module) =>
        (module.pages || [])
          .filter((p) => p && p.path && p.component)
          .map((page) => {
            const PageComponent = loadDynamicComponent(page.component);

            return (
              <Route
                key={`${module.module_key}-${page.key}`}
                path={page.path}
                element={
                  <ModuleRoute module={module.module_key}>
                    {/* passa module/page como props */}
                    <PageComponent
                      moduleKey={module.module_key}
                      pageKey={page.key}
                    />
                  </ModuleRoute>
                }
              />
            );
          })
      )}
    </>
  );
}
