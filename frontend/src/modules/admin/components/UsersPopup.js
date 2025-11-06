import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Tabs, Tab, Box, TextField, FormControlLabel, Checkbox,
  Table, TableHead, TableRow, TableCell, TableBody, CircularProgress,
  IconButton
} from '@mui/material';
import { Save } from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export default function UsuarioPopup({ open, onClose, user }) {
  const token = localStorage.getItem('token');

  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState({
    id: user?.id || null,
    username: user?.username || '',
    name: user?.name || '',
    email: user?.email || '',
    user_level: user?.user_level || 1,
    is_active: user?.is_active ?? true
  });

  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ====================================================
  // 🔹 Carrega dados (módulos, permissões, variáveis)
  // ====================================================
useEffect(() => {
  if (!open) return;

  const init = async () => {
    setLoading(true);
    try {
      await carregarModulos();
      if (user?.id) {
        await carregarPermissoes(user.id);
        await carregarVariaveis(user.id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do popup:', err);
    } finally {
      setLoading(false);
    }
  };

  init();
}, [open]);

  const carregarModulos = async () => {
    try {
      const resp = await axios.get(`${API_URL}/api/modules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModules(resp.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar módulos:', err);
    }
  };

  const carregarPermissoes = async (userId) => {
    try {
      const resp = await axios.get(`${API_URL}/api/user-permissions/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPermissions(resp.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
    }
  };

 const carregarVariaveis = async (userId) => {
  try {
    const resp = await axios.get(`${API_URL}/api/users/permissions/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setVariables(resp.data.data || []);
  } catch (err) {
    console.error('Erro ao carregar variáveis:', err);
  }
};
  // ====================================================
  // 💾 SALVAR USUÁRIO (CRUD principal)
  // ====================================================
  const salvarUsuario = async () => {
    setSaving(true);
    try {
      if (formData.id) {
        await axios.put(`${API_URL}/api/users/${formData.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        const resp = await axios.post(`${API_URL}/api/users`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const novo = resp.data.data;
        setFormData({ ...formData, id: novo.id });
      }
      onClose(true);
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // 🔐 CRUD PERMISSÕES
  // ====================================================
  const togglePermissao = async (module_id, checked) => {
    if (!formData.id) return;
    try {
      await axios.post(`${API_URL}/api/user-permissions`, {
        user_id: formData.id,
        module_id,
        is_active: checked
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      carregarPermissoes(formData.id);
    } catch (err) {
      console.error('Erro ao alterar permissão:', err);
    }
  };

  // ====================================================
  // ⚙️ CRUD VARIÁVEIS
  // ====================================================
  const handleVariableChange = (key, value) => {
    setVariables(prev =>
      prev.map(v => (v.key === key ? { ...v, value } : v))
    );
  };


const salvarVariaveis = async () => {
  if (!formData.id) return;
  setSaving(true);
  try {
    await axios.put(`${API_URL}/api/user-vars/${formData.id}`, { variables }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await carregarVariaveis(formData.id);
  } catch (err) {
    console.error('Erro ao salvar variáveis:', err);
  } finally {
    setSaving(false);
  }
};

  // ====================================================
  // 🔹 Render
  // ====================================================
  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>{formData.id ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>

      <DialogContent dividers>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Cadastro" />
          <Tab label="Permissões" disabled={!formData.id} />
          <Tab label="Variáveis" disabled={!formData.id} />
        </Tabs>

        {/* Aba 1 - Cadastro */}
        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nome" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth />
            <TextField label="Usuário" value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })} fullWidth />
            <TextField label="E-mail" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} fullWidth />
            <TextField label="Nível" type="number" value={formData.user_level}
              onChange={(e) => setFormData({ ...formData, user_level: parseInt(e.target.value) })} fullWidth />
            <FormControlLabel
              control={<Checkbox checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />}
              label="Ativo"
            />
          </Box>
        )}

        {/* Aba 2 - Permissões */}
        {tab === 1 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Módulo</TableCell>
                <TableCell align="center">Acesso</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {modules.map(m => {
                const perm = permissions.find(p => p.module_id === m.id);
                const ativo = perm ? perm.is_active : false;
                return (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={ativo}
                        onChange={(e) => togglePermissao(m.id, e.target.checked)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Aba 3 - Variáveis */}
        {tab === 2 && (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Chave</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Descrição</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {variables.map(v => (
                  <TableRow key={v.key}>
                    <TableCell>{v.key}</TableCell>
                    <TableCell>
                      <TextField
                        value={v.value || ''}
                        size="small"
                        onChange={(e) => handleVariableChange(v.key, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>{v.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box sx={{ textAlign: 'right', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={salvarVariaveis}
                startIcon={<Save />}
                disabled={saving}
              >
                Salvar Variáveis
              </Button>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose(false)}>Fechar</Button>
        <Button variant="contained" color="primary" onClick={salvarUsuario} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : 'Salvar Usuário'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
