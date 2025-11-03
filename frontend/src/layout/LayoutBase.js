import React, { useState, useMemo } from 'react';
import { Box, Toolbar, Drawer, Typography } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 220;
const hideLayoutOn = ['/login', '/register'];

export default function LayoutBase() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { user, variables = [], definitions = [], globalVars = [], token } = useAuth();

  const hideLayout = hideLayoutOn.some(path => location.pathname.startsWith(path));
  const showFooter = !!token && !hideLayout;

  const userVarMap = useMemo(() => {
    return Object.fromEntries((variables || []).map(v => [v.key, v.value]));
  }, [variables]);

  const globalOptionsMap = useMemo(() => {
    const m = {};
    (globalVars || []).forEach(g => {
      m[g.key] = {};
      (g.options || []).forEach(opt => {
        m[g.key][opt.value] = opt;
      });
    });
    return m;
  }, [globalVars]);

  const resolvedVariables = useMemo(() => {
    return (definitions || [])
      .filter(def => def.active)
      .map(def => {
        const key = def.key;
        const userValue = userVarMap[key];
        if (userValue) {
          const opt = globalOptionsMap[key]?.[userValue];
          return {
            key,
            label: def.description || key,
            value: opt?.description || userValue
          };
        }
        const global = (globalVars || []).find(g => g.key === key);
        const defaultOpt = global?.options?.find(o => o.is_default);
        return {
          key,
          label: def.description || key,
          value: defaultOpt?.description || defaultOpt?.value || '—'
        };
      });
  }, [definitions, userVarMap, globalVars, globalOptionsMap]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!hideLayout && (
        <>
          <Navbar onMenuClick={() => setDrawerOpen(true)} showMenuIcon />
          <Drawer
            variant="temporary"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}
          >
            <Sidebar handleClose={() => setDrawerOpen(false)} />
          </Drawer>
        </>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: hideLayout ? 0 : 8,
          mb: showFooter ? 6 : 0,
          transition: 'margin-bottom 0.2s ease'
        }}
      >
        {!hideLayout && <Toolbar />}
        <Outlet />
      </Box>

      {showFooter && (
        <Box
          component="footer"
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 42,
            bgcolor: '#f8f8f8',
            borderTop: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            fontSize: 14,
            color: '#333',
            zIndex: 1200,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexGrow: 1,
              maxWidth: '75%',
            }}
          >
            {resolvedVariables.map((v, i) => (
              <span key={v.key}>
                {i > 0 && ' | '}
                <strong>{v.label}:</strong> {v.value}
              </span>
            ))}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            title={user?.username || 'Usuário'}
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '25%',
              textAlign: 'right',
            }}
          >
           
          </Typography>
        </Box>
      )}
    </Box>
  );
}
