import React from 'react';
import { Typography, Paper, Grid, Box } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import PeopleIcon from '@mui/icons-material/People';
import CelebrationIcon from '@mui/icons-material/Celebration';

export default function Home() {
  // Simule pulls da API ou poderia vir de props/context
  const indicators = [
    { label: 'Usuários Ativos', value: 523, icon: <PeopleIcon fontSize="large" color="primary" /> },
    { label: 'Avisos Recentes', value: 6, icon: <InfoIcon fontSize="large" color="secondary" /> },
    { label: 'Aniversariantes Hoje', value: 2, icon: <CelebrationIcon fontSize="large" color="success" /> },
  ];
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Intranet - Visão Geral</Typography>
      <Grid container spacing={3} sx={{ mt: 3 }}>
        {indicators.map((ind, i) => (
          <Grid item xs={12} sm={4} key={ind.label}>
            <Paper elevation={4} sx={{ p:3, display:'flex', flexDirection:'column', alignItems:'center' }}>
              {ind.icon}
              <Typography sx={{ fontWeight: 'bold', fontSize:28 }}>{ind.value}</Typography>
              <Typography>{ind.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
