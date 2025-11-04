import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, TextField, Button, Alert, Paper, Avatar
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../context/AuthContext';
const apiUrl = process.env.REACT_APP_API_URL || "";
console.log(apiUrl)
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token && data.user.permissions) {
        login({
          token: data.token,
          permissions: data.user.permissions
        });
        setMsg('');
        navigate('/');
      } else {
        setMsg(data.error || 'Falha no login');
      }
    } catch (err) {
      setMsg('Erro na requisição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={6} sx={{ p: 4, width: '100%' }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Avatar sx={{ bgcolor: '#1976d2', mb: 1 }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography variant="h5" color="primary" gutterBottom>
            Login AD
          </Typography>
          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
            <TextField
              label="Usuário"
              margin="normal"
              value={username}
              onChange={e => setUsername(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Senha"
              type="password"
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? 'Verificando…' : 'Entrar'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 1 }}
              color="secondary"
              onClick={() => navigate('/')}
            >
              Ir para Home
            </Button>
          </Box>
          {msg && <Alert severity="error" sx={{ width: '100%' }}>{msg}</Alert>}
        </Box>
      </Paper>
    </Container>
  );
}
