import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenuClick }) {
  const { user, token, setShowVarDialog, logout } = useAuth();

  return (
    <AppBar position="fixed" color="primary" elevation={2}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Esquerda: menu e título */}
         {token && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" edge="start" onClick={onMenuClick} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Intranet
          </Typography>
        </Box>
         )}
        {/* Direita: variáveis + usuário + logout */}
        {token && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Tooltip title="Definir variáveis do usuário">
              <IconButton color="inherit" onClick={() => setShowVarDialog(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 160,
              }}
              title={user?.username}
            >
              👤 {user?.name || user?.username?.split('@')[0] || 'Usuário'}
            </Typography>

            <Tooltip title="Sair do sistema">
              <IconButton
                color="inherit"
                onClick={logout}
                sx={{
                  ml: 0.5,
                  '&:hover': { color: '#ffebee', backgroundColor: '#c62828' },
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
