import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Tooltip
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import TuneIcon from '@mui/icons-material/Tune';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import modules from '../config/modules.json';

export default function Navbar({ onMenuClick, showMenuIcon }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuKey, setMenuKey] = useState(null);

  const navigate = useNavigate();
  const { token, user, logout, setShowVarDialog } = useAuth();

  const permissions = user?.permissions || {};

  const availableModules = Array.isArray(modules)
    ? modules.filter(mod => mod.enabledField === null || permissions[mod.enabledField])
    : [];

  const handleMenuOpen = (event, key) => {
    setAnchorEl(event.currentTarget);
    setMenuKey(key);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuKey(null);
  };

  const handleMenuItem = path => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenVarDialog = () => {
    setShowVarDialog(true);
  };

  if (!Array.isArray(modules)) return <div>Menu não carregado!</div>;

  return (
    <AppBar position="fixed" elevation={1}>
      <Toolbar>
        {token && showMenuIcon && (
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }} onClick={onMenuClick}>
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Intranet
        </Typography>

        {/* 🔐 Menus dos módulos disponíveis */}
        {availableModules.map((mod) => (
          <React.Fragment key={mod.key}>
            <Button
              color="inherit"
              sx={{ textTransform: 'none', mr: 1 }}
              onClick={e => handleMenuOpen(e, mod.key)}
            >
              {mod.label}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl) && menuKey === mod.key}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              {(mod.menus ?? []).map(sub => (
                <MenuItem
                  key={sub.key}
                  onClick={() => handleMenuItem(sub.path.replace(sub.pathIgnore, ''))}
                >
                  {sub.label}
                </MenuItem>
              ))}
            </Menu>
          </React.Fragment>
        ))}

        {/* ⚙️ Botão para redefinir variáveis */}
        {token && (
          <Tooltip title="Alterar preferências (Filial, Competência...)">
            <IconButton color="inherit" sx={{ mr: 1 }} onClick={handleOpenVarDialog}>
              <TuneIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* 🚪 Logout */}
        {token && (
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
