import React, { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Typography, IconButton, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, CircularProgress, Tooltip
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import axios from 'axios';
import UsuarioPopup from '../components/UsersPopup';

const API_URL = process.env.REACT_APP_API_URL;

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [openPopup, setOpenPopup] = useState(false);

  const token = localStorage.getItem('token');

  // ====================================================
  // 🔹 Carrega usuários
  // ====================================================
  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(resp.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleEditar = (user) => {
    setSelectedUser(user);
    setOpenPopup(true);
  };

  const handleNovo = () => {
    setSelectedUser(null);
    setOpenPopup(true);
  };

  const handleClosePopup = (refresh = false) => {
    setOpenPopup(false);
    if (refresh) carregarUsuarios();
  };

  // ====================================================
  // 🔹 Render
  // ====================================================
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Usuários do Sistema
      </Typography>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Buscar usuário"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleNovo}>
          Novo Usuário
        </Button>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Usuário</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Nível</TableCell>
                <TableCell>Ativo</TableCell>
                <TableCell width={80}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios
                .filter(u =>
                  u.name?.toLowerCase().includes(search.toLowerCase()) ||
                  u.username?.toLowerCase().includes(search.toLowerCase())
                )
                .map(u => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.user_level}</TableCell>
                    <TableCell>{u.is_active ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => handleEditar(u)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {openPopup && (
        <UsuarioPopup
          open={openPopup}
          onClose={handleClosePopup}
          user={selectedUser}
        />
      )}
    </Box>
  );
}
