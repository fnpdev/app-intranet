import React from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * 🔔 AppAlert — componente padrão de notificação global
 * 
 * Props:
 * - open (bool): controla exibição
 * - message (string): texto a ser exibido
 * - severity ('success' | 'error' | 'warning' | 'info'): tipo de alerta
 * - onClose (func): callback para fechar
 * - duration (number): tempo de exibição (default 4000ms)
 * - position ({vertical, horizontal}): posição na tela
 */
export default function AppAlert({
  open,
  message,
  severity = 'info',
  onClose,
  duration = 4000,
  position = { vertical: 'bottom', horizontal: 'right' }
}) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={position}
    >
      <Alert
        elevation={6}
        variant="filled"
        onClose={onClose}
        severity={severity}
        sx={{ width: '100%', fontWeight: 500 }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
