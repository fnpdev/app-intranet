import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotAuthorizedPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <Typography variant="h3" color="error" gutterBottom>
        Acesso Negado
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Você não tem permissão para acessar esta área do sistema.<br />
        Se acha que isso é um erro, entre em contato com o administrador!
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/')}>
        Voltar para a Home
      </Button>
    </Box>
  );
}
