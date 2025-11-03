import React, { useState } from 'react';
import { Paper, Tabs, Tab, Badge, Box } from '@mui/material';
import TabelaAtributos from '../../suprimentos/components/TabelaAtributos';

/**
 * Renderiza as abas com as queries secundárias da página
 */
export default function DynamicAbas({ queries = [], data = {} }) {
  const [tab, setTab] = useState(0);

  if (!queries || queries.length === 0) return null;

  // apenas queries não principais
  const abas = queries.filter(q => !q.is_main);

  const handleChange = (e, value) => setTab(value);

  const getBadgeCount = (key) =>
    Array.isArray(data[key]) ? data[key].length : 0;

  return (
    <>
      {/* Abas */}
      <Tabs
        value={tab}
        onChange={handleChange}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{
          mb: 2,
          '& .MuiTab-root': { fontWeight: 500, fontSize: '1rem' },
          bgcolor: '#f4f8fb'
        }}
      >
        {abas.map((aba) => (
          <Tab
            key={aba.key}
            label={
              <Badge
                color="primary"
                badgeContent={getBadgeCount(aba.key)}
                invisible={getBadgeCount(aba.key) === 0}
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    right: -20,
                    top: 0,
                    fontSize: '0.7em',
                    minWidth: 18,
                    height: 18
                  }
                }}
              >
                {aba.description || aba.key}
              </Badge>
            }
          />
        ))}
      </Tabs>

      {/* Conteúdo da aba ativa */}
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
