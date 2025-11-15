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
  const [subOpen, setSubOpen] = useState({});
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!Array.isArray(modules)) {
      setErro('Formato inválido dos módulos.');
    } else if (modules.length === 0) {
      setErro('Nenhum módulo disponível para este usuário.');
    } else {
      setErro('');
    }
  }, [modules]);

  const toggleModule = (key) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleSub = (key) =>
    setSubOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  if (erro)
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        {erro}
      </Alert>
    );

  return (
    <List
      component="nav"
      subheader={
        <ListSubheader
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
      sx={{ width: '100%', maxWidth: 320, bgcolor: 'background.paper', p: 1 }}
    >
      {(modules || []).map((mod) => {
        const moduleKey = mod.module_key || mod.key || mod.id;

        // 🔹 Separar páginas default e páginas em menus
        const defaultPages = [];
        const groupedMenus = {};

        (mod.pages || []).forEach((page) => {
          if (page.withLayout === false) return;

          const group = page.menu || 'default';

          if (group === 'default') {
            defaultPages.push(page);
          } else {
            if (!groupedMenus[group]) groupedMenus[group] = [];
            groupedMenus[group].push(page);
          }
        });

        return (
          <React.Fragment key={moduleKey}>
            {/* ----- Módulo ----- */}
            <ListItemButton onClick={() => toggleModule(moduleKey)}>
              <ListItemText
                primary={mod.module_name}
                secondary={mod.module_description}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '1rem' }}
                secondaryTypographyProps={{
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                }}
              />
              {open[moduleKey] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={open[moduleKey]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>

                {/* ------------------------------------- */}
                {/* 🔹 PÁGINAS DEFAULT → Items na RAIZ    */}
                {/* ------------------------------------- */}
                {defaultPages.map((page) => (
                  <ListItemButton
                    key={page.key}
                    component={Link}
                    to={page.path.replace(page.pathIgnore || '', '')}
                    sx={{ pl: 4, py: 0.8 }}
                    onClick={handleClose}
                  >
                    <ListItemText
                      primary={page.label}
                      primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                  </ListItemButton>
                ))}

                {/* ------------------------------------- */}
                {/* 🔹 MENUS AGRUPADOS (≠ default)        */}
                {/* ------------------------------------- */}
                {Object.entries(groupedMenus).map(([menuKey, pages]) => {
                  const subKey = `${moduleKey}_${menuKey}`;

                  return (
                    <React.Fragment key={subKey}>
                      {/* ---- Nome do Submenu ---- */}
                      <ListItemButton onClick={() => toggleSub(subKey)} sx={{ pl: 3 }}>
                        <ListItemText
                          primary={menuKey}
                          primaryTypographyProps={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                          }}
                        />
                        {subOpen[subKey] ? <ExpandLess /> : <ExpandMore />}
                      </ListItemButton>

                      {/* ---- Páginas ---- */}
                      <Collapse in={subOpen[subKey]} timeout="auto" unmountOnExit>
                        <List disablePadding>
                          {pages.map((page) => (
                            <ListItemButton
                              key={page.key}
                              component={Link}
                              to={page.path.replace(page.pathIgnore || '', '')}
                              sx={{ pl: 5, py: 0.8 }}
                              onClick={handleClose}
                            >
                              <ListItemText
                                primary={page.label}
                                primaryTypographyProps={{ fontSize: '0.9rem' }}
                              />
                            </ListItemButton>
                          ))}
                        </List>
                      </Collapse>
                    </React.Fragment>
                  );
                })}
              </List>
            </Collapse>
          </React.Fragment>
        );
      })}
    </List>
  );
}
