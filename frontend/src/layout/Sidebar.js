import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  ListSubheader,
  Alert,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Link } from 'react-router-dom';

export default function Sidebar({ handleClose }) {
  const { modules } = useAuth();
  const [open, setOpen] = useState({});
  const [erro, setErro] = useState('');

  // 🔹 Validação do formato recebido
  useEffect(() => {
    if (!Array.isArray(modules)) {
      setErro('Formato inválido dos módulos.');
    } else if (modules.length === 0) {
      setErro('Nenhum módulo disponível para este usuário.');
    } else {
      setErro('');
    }
  }, [modules]);

  const handleToggle = (key) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 🔹 Caso de erro
  if (erro)
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        {erro}
      </Alert>
    );

  // 🔹 Renderização principal
  return (
    <List
      component="nav"
      subheader={
        <ListSubheader
          component="div"
          sx={{
            fontSize: 18,
            fontWeight: 'bold',
            bgcolor: 'white',
            borderBottom: '1px solid #eee',
          }}
        >
          Áreas do Sistema
        </ListSubheader>
      }
      sx={{
        width: '100%',
        maxWidth: 320,
        bgcolor: 'background.paper',
        p: 1,
      }}
    >
      {(modules || []).map((mod) => (
        <React.Fragment key={mod.module_key || mod.key || mod.id}>
          <ListItemButton onClick={() => handleToggle(mod.module_key || mod.key)}>
            <ListItemText
              primary={mod.module_name || mod.name || 'Módulo'}
              secondary={mod.module_description || ''}
              primaryTypographyProps={{
                fontWeight: 600,
                fontSize: '1rem',
              }}
              secondaryTypographyProps={{
                fontSize: '0.8rem',
                color: 'text.secondary',
              }}
            />
            {open[mod.module_key] ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          <Collapse in={open[mod.module_key]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {(mod.pages || [])
                .filter((p) => p.withLayout !== false)
                .map((page) => (
                  <ListItemButton
                    key={page.key || page.id}
                    component={Link}
                    to={page.path?.replace(page.pathIgnore || '', '') || '#'}
                    sx={{
                      pl: 4,
                      py: 0.8,
                      '&:hover': { bgcolor: 'rgba(25,118,210,0.08)' },
                    }}
                    onClick={handleClose}
                  >
                    <ListItemText
                      primary={page.label || page.name || page.key}
                      primaryTypographyProps={{
                        fontSize: '0.95rem',
                        fontWeight: 500,
                      }}
                    />
                  </ListItemButton>
                ))}
            </List>
          </Collapse>
        </React.Fragment>
      ))}
    </List>
  );
}
