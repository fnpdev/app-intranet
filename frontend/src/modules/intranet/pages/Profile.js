import React from 'react';
import { Typography, Paper } from '@mui/material';

export default function Profile() {
  const token = localStorage.getItem('token');
  let payload = { username: '' };
  try {
      if (token) payload = JSON.parse(atob(token.split('.')[1]));
  } catch {}
  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Perfil do Usuário</Typography>
      <Typography>Usuário: <b>{payload.username}</b></Typography>
    </Paper>
  );
}
