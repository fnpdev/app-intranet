import React, { useState } from 'react';
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
  const { user, variables = [], definitions = [], token } = useAuth();

  const hideLayout = hideLayoutOn.some(path => location.pathname.startsWith(path));
  const showFooter = !!token && !hideLayout;

  // Gera um mapa rápido das variáveis do usuário
  const variableMap = Object.fromEntries(variables.map(v => [v.key, v.value]));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!hideLayout && (
        <>
          <Navbar onMenuClick={() => setDrawerOpen(true)} showMenuIcon={true} />
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
      height: 40,
      bgcolor: '#f4f4f4',
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
    {/* 📍 Variáveis globais dinâmicas */}
    <Typography
      variant="body2"
      sx={{
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '75%',
      }}
    >
      {definitions
        .filter(def => def.active)
        .map((def, i) => (
          <span key={def.key}>
            {i > 0 && ' | '}
            <strong>{def.description}:</strong>{' '}
            {variableMap[def.key] || '—'}
          </span>
        ))}
    </Typography>

    {/* 👤 Usuário */}
    <Typography
      variant="body2"
      color="text.secondary"
      title={user?.username || 'Usuário'}
      sx={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '25%',
        textAlign: 'left',
      }}
    >
      👤 {user?.username?.split('@')[0] || 'Usuário'}
    </Typography>
  </Box>
)}

    </Box>
  );
}
