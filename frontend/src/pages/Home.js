import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { token } = useAuth();

  return (
    <Box
      sx={{
        maxWidth: 700,
        margin: '0 auto',
        mt: 7,
        p: 4,
        background: '#f9f9f9',
        borderRadius: 2,
        boxShadow: 1,
        textAlign: 'center'
      }}
    >
      <Typography variant="h3" color="primary" gutterBottom>
        Bem-vindo ao Portal Intranet
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Esta é a página inicial pública do portal.
        <br />
        Para acessar as áreas restritas, faça login!
      </Typography>

      {!token && (
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate('/login')}
        >
          Fazer Login
        </Button>
      )}
    </Box>
  );
}
