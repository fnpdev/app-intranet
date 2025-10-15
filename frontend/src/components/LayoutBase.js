import React, { useState } from 'react';
import { Box, Toolbar, Drawer } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet, useLocation } from 'react-router-dom';

const drawerWidth = 220;
const hideLayoutOn = ['/login', '/register'];

export default function LayoutBase() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const hideLayout = hideLayoutOn.some(path => location.pathname.startsWith(path));

  return (
    <Box sx={{ display: 'flex' }}>
      {!hideLayout && (
        <>
          <Navbar
            onMenuClick={() => setDrawerOpen(true)}
            showMenuIcon={true}
          />
          <Drawer
            variant="temporary"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': { width: drawerWidth },
            }}
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
        }}
      >
        {!hideLayout && <Toolbar />}
        <Outlet />
      </Box>
    </Box>
  );
}
