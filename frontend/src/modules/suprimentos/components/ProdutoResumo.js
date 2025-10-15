import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

export default function ProdutoResumo({ info }) {
  if (!info) return null;

  return (
    <Paper sx={{ p: 2, mb: 3, background: '#f7fafc' }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {info.descricao}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
        <Typography variant="body2"><b>Produto:</b> {info.produto}</Typography>
        <Typography variant="body2"><b>Cód. Barras:</b> {info.codigo_barras}</Typography>
        <Typography variant="body2"><b>Tipo:</b> {info.tipo_produto}</Typography>
        <Typography variant="body2"><b>Controla Endereço:</b> {info.controla_endereco}</Typography>
        <Typography variant="body2"><b>Controla Lote:</b> {info.controla_lote}</Typography>
      </Box>
    </Paper>
  );
}
