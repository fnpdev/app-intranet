import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';

/**
 * Renderiza dinamicamente as informações principais (is_main)
 * Exemplo: produto_por_codigo, cliente, pedido, etc.
 */
export default function DynamicResumo({ info }) {
  if (!info || Object.keys(info).length === 0) return null;

  // extrai as chaves dinamicamente
  const campos = Object.entries(info);

  return (
    <Paper sx={{ p: 2, mb: 3, background: '#f7fafc', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {info.descricao || 'Informações Principais'}
      </Typography>

      <Grid container spacing={1}>
        {campos.map(([campo, valor]) => (
          <Grid item xs={12} sm={6} md={4} key={campo}>
            <Typography variant="body2">
              <b>{campo
                .replace(/_/g, ' ')
                .split(" ")
                .map(campo => campo.charAt(0).toUpperCase() + campo.slice(1).toLowerCase())
                .join(" ")}:</b> {String(valor)}
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
