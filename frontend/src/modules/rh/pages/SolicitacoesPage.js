import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function SolicitacoesPage() {
  return (
    <Box
      sx={{
        maxWidth: 800,
        margin: '0 auto',
        mt: 5,
        p: 4,
        background: '#fff',
        borderRadius: 2,
        boxShadow: 2,
        minHeight: '40vh'
      }}
    >
      <Typography variant="h4" gutterBottom>
        Solicitações RH
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Aqui você acompanha suas solicitações recentes, histórico, e pode criar novas demandas para o RH.
      </Typography>
      {/* Exemplo de botão para criar nova solicitação */}
      <Button variant="contained" color="primary">
        Nova Solicitação
      </Button>
      {/* Fica fácil expandir: adicionar tabela ou cards de solicitações aqui */}
    </Box>
  );
}
