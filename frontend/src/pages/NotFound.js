import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme => theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 420,
          width: '100%',
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
          bgcolor: theme => theme.palette.background.paper,
          borderRadius: 4,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <SentimentVeryDissatisfiedIcon
            color="primary"
            sx={{ fontSize: 62, opacity: 0.88 }}
          />
        </Box>
        <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: -2, mb: 0.5, fontSize: { xs: 45, sm: 58 } }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ color: 'text.secondary', mb: 1 }}>
          Página não encontrada
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Opa! Você tentou acessar um endereço inexistente ou que foi movido.<br />
          Que tal voltar para o início?
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/')}
          sx={{
            fontWeight: 600,
            letterSpacing: 1,
            borderRadius: 2,
            px: 4,
            py: 1.3,
            textTransform: 'none',
            background: theme => theme.palette.primary.main,
            color: '#fff',
            '&:hover': {
              background: theme => theme.palette.primary.dark,
            }
          }}
        >
          Voltar para a Home
        </Button>
      </Paper>
      
    </Box>
  );
}
