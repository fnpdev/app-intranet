import React, { useState, useEffect } from 'react';
import {
  Paper,
  Tabs,
  Tab,
  Badge,
  Box,
  Tooltip,
  Button,
  Typography
} from '@mui/material';
import TabelaAtributos from './TabelaAtributos';

export default function DynamicAbasSelectable({
  queries = [],
  data = {},
  onTabChange,
  selectedRows = {},
  onSelectionChange
}) {
  const [tab, setTab] = useState(0);

  // 🔹 Apenas queries não principais
  const abas = Array.isArray(queries)
    ? queries.filter(q => !q.is_main)
    : [];

  const abaAtiva = abas[tab];
  const linhas = abaAtiva ? (data[abaAtiva.key] || []) : [];
  const selecionadas = selectedRows[abaAtiva?.key] || [];

  // ✅ Hook SEMPRE executado
  useEffect(() => {
    if (abaAtiva && onTabChange) {
      onTabChange(abaAtiva.key);
    }
  }, [tab, abas.length]); // dependências seguras

  // ✅ Agora sim, retorno condicional
  if (!abas.length) return null;

  const handleChange = (e, value) => setTab(value);

  const getBadgeCount = (key) =>
    Array.isArray(data[key]) ? data[key].length : 0;

  const selecionarTodas = () => {
    if (!abaAtiva) return;
    onSelectionChange(prev => ({
      ...prev,
      [abaAtiva.key]: linhas.map((_, idx) => idx)
    }));
  };

  const selecionarNenhuma = () => {
    if (!abaAtiva) return;
    onSelectionChange(prev => ({
      ...prev,
      [abaAtiva.key]: []
    }));
  };

  const toggleLinha = (rowIndex) => {
    if (!abaAtiva) return;

    onSelectionChange(prev => {
      const current = prev[abaAtiva.key] || [];
      return {
        ...prev,
        [abaAtiva.key]: current.includes(rowIndex)
          ? current.filter(i => i !== rowIndex)
          : [...current, rowIndex]
      };
    });
  };

  return (
    <>
      {/* 🧭 Abas */}
      <Tabs
        value={tab}
        onChange={handleChange}
        variant="scrollable"
        allowScrollButtonsMobile
        scrollButtons="auto"
        sx={{
          mb: 2,
          bgcolor: '#f4f8fb',
          '& .MuiTab-root': {
            fontWeight: 500,
            fontSize: '0.95rem',
            minWidth: 160,
            maxWidth: 180,
            textTransform: 'none',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            mr: 1
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: 2
          }
        }}
      >
        {abas.map((aba) => {
          const count = getBadgeCount(aba.key);
          const label = aba.name || aba.key;

          return (
            <Tooltip key={aba.key} title={label} arrow>
              <Tab
                label={
                  <Badge
                    color="primary"
                    badgeContent={count}
                    invisible={count === 0}
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        right: -18,
                        top: 0,
                        fontSize: '0.7em',
                        minWidth: 18,
                        height: 18
                      }
                    }}
                  >
                    {label}
                  </Badge>
                }
              />
            </Tooltip>
          );
        })}
      </Tabs>

      {/* 📊 Conteúdo */}
      <Paper
        sx={{
          p: 1,
          width: '100%',
          mb: 5,
          background: '#fcfcfc',
          boxShadow: '0 2px 9px -8px #444'
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <Button size="small" onClick={selecionarTodas}>
            Todas
          </Button>
          <Button size="small" onClick={selecionarNenhuma}>
            Nenhuma
          </Button>

          <Typography variant="caption" sx={{ ml: 'auto' }}>
            Selecionadas: {selecionadas.length}
          </Typography>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          {abas.map((aba, idx) =>
            idx === tab ? (
              <TabelaAtributos
                key={aba.key}
                dados={data[aba.key] || []}
                selectable
                selectedRows={selecionadas}
                onToggleRow={toggleLinha}
              />
            ) : null
          )}
        </Box>
      </Paper>
    </>
  );
}
