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
  const { user, variables = [], token } = useAuth();

  const hideLayout = hideLayoutOn.some(path => location.pathname.startsWith(path));
  const showFooter = !!token && !hideLayout;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* =========================
          NAVBAR + SIDEBAR
      ========================== */}
      {!hideLayout && (
        <>
          <Navbar onMenuClick={() => setDrawerOpen(true)} />
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

      {/* =========================
          CONTEÚDO PRINCIPAL
      ========================== */}
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

      {/* =========================
          RODAPÉ (variáveis do usuário)
      ========================== */}
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
          {/* 🔹 Lista de variáveis */}
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
            {(variables || []).map((v, i) => (
              <span key={v.id}>
                {i > 0 && ' | '}
                <strong>{v.variable_description}:</strong> {v.value}
              </span>
            ))}
          </Typography>

        </Box>
      )}
    </Box>
  );
}
