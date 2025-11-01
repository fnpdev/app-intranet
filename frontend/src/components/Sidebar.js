import React from 'react';
import { useAuth } from '../context/AuthContext';
import modules from '../config/modules.json';
import { List, ListItemButton, ListItemText, Collapse, ListSubheader } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Link } from 'react-router-dom';

export default function Sidebar({ handleClose }) {
  const { user } = useAuth();
  const permissions = user?.permissions || {};
  const [open, setOpen] = React.useState({});

  const ativos = Array.isArray(modules)
    ? modules.filter(m => m.enabledField === null || permissions[m.enabledField])
    : [];

  const handleToggle = key => {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!Array.isArray(modules)) return <div>Menu não carregado!</div>;

  return (
    <List
      component="nav"
      subheader={
        <ListSubheader component="div" sx={{ fontSize: 18, fontWeight: 'bold', bgcolor: 'white' }}>
          Áreas do Sistema
        </ListSubheader>
      }
      sx={{ width: '100%', maxWidth: 320, bgcolor: 'background.paper', p: 1 }}
    >
      {ativos.map(mod => (
        <React.Fragment key={mod.key}>
          <ListItemButton onClick={() => handleToggle(mod.key)}>
            <ListItemText primary={mod.label} />
            {open[mod.key] ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={open[mod.key]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {(mod.menus ?? []).map(sub => (
                <ListItemButton
                  key={sub.key}
                  component={Link}
                  to={sub.path.replace(sub.pathIgnore, '')}
                  sx={{ pl: 4 }}
                  onClick={handleClose}
                >
                  <ListItemText primary={sub.label} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      ))}
    </List>
  );
}
