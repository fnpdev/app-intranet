import React, { useState } from 'react';
import { Paper, Tabs, Tab, Badge, Box, Tooltip } from '@mui/material';
import TabelaAtributos from '../../suprimentos/components/TabelaAtributos';

/**
 * Renderiza as abas com as queries secundárias da página
 */
export default function DynamicAbas({ queries = [], data = {} }) {
  const [tab, setTab] = useState(0);

  if (!queries || queries.length === 0) return null;

  // 🔹 Apenas queries não principais
  const abas = queries.filter(q => !q.is_main);

  const handleChange = (e, value) => setTab(value);

  const getBadgeCount = (key) =>
    Array.isArray(data[key]) ? data[key].length : 0;

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
            minWidth: 160,           // 🔸 largura mínima fixa
            maxWidth: 180,           // 🔸 evita quebra em textos longos
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
          const label = aba.description || aba.key;

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

      {/* 📊 Conteúdo da aba ativa */}
      <Paper
        sx={{
          p: 1,
          width: '100%',
          mb: 5,
          background: '#fcfcfc',
          boxShadow: '0 2px 9px -8px #444'
        }}
      >
        <Box sx={{ overflowX: 'auto' }}>
          {abas.map((aba, idx) =>
            idx === tab ? (
              <TabelaAtributos key={aba.key} dados={data[aba.key] || []} />
            ) : null
          )}
        </Box>
      </Paper>
    </>
  );
}
