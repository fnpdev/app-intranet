import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import modules from '../config/modules.json';

export default function Navbar({ onMenuClick, showMenuIcon }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuKey, setMenuKey] = useState(null);

  const navigate = useNavigate();
  const { token, permissions, logout } = useAuth();

  const availableModules = Array.isArray(modules)
    ? modules.filter(mod => permissions && permissions[mod.enabledField])
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
        {/* Menu suspenso para cada módulo */}
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
        {token && (
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
