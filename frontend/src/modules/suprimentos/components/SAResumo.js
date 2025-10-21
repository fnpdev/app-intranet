import React from 'react';
import { Paper, Typography, Grid } from '@mui/material';

export default function SAResumo({ info }) {
  if (!info) return null;

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
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
        SA: {info.numero_sa}
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
            {info.solicitante.replace('.',' ')}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}
