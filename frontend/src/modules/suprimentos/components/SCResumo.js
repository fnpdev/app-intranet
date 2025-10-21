import React from 'react';
import { Paper, Typography, Grid, Chip, Box } from '@mui/material';

export default function SCResumo({ info }) {
  if (!info) return null;

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
  };

  const getSituacaoChip = (situacao) => {
    const situacoes = {
      'A': { label: 'Aberta', color: 'info' },
      'B': { label: 'Bloqueada', color: 'warning' },
      'L': { label: 'Liberada', color: 'success' },
      'C': { label: 'Cancelada', color: 'error' },
      'E': { label: 'Encerrada', color: 'default' }
    };

    const config = situacoes[situacao] || { label: situacao, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        background: '#f7fafc'
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        SC: {info.numero_sc}
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
            Data de Emissão
          </Typography>
          <Typography variant="h6">
            {formatDate(info.data_emissao)}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
            Solicitante
          </Typography>
          <Typography variant="h6">
            {info.solicitante}
          </Typography>
        </Grid>
        
        
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
            Situação
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            {getSituacaoChip(info.sc_status)}
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
            Observações
          </Typography>
          <Typography variant="h6">
            {info.sc_obs}
          </Typography>
        </Grid>
        
      </Grid>
    </Paper>
  );
}
