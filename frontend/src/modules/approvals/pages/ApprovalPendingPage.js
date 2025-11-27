import React, { useEffect, useState } from "react";
import {
  Box, Paper, Typography, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, IconButton, Menu, MenuItem, Divider, List, ListItem, ListItemText
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import AppAlert from "../../core/components/AppAlert";

const API_URL = process.env.REACT_APP_API_URL;

export default function ApprovalPendingPage() {

  const { user, token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [pendencias, setPendencias] = useState([]);

  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuItem, setMenuItem] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openMenu = (event, item) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const showAlert = (msg, severity = "success") =>
    setAlert({ open: true, message: msg, severity });

  // ============================================================
  // LOAD PENDÊNCIAS DO USUÁRIO
  // ============================================================
  const loadPending = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API_URL}/api/aprovacao/my-pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPendencias(resp.data?.data || []);
    } catch (err) {
      console.error(err);
      showAlert("Erro ao carregar pendências.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, [token]);

  // ============================================================
  // LOAD DOCUMENT DETAILS
  // ============================================================
  const openDetails = async (document_id) => {
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const resp = await axios.get(`${API_URL}/api/aprovacao/document/${document_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDetailData(resp.data?.data || resp.data);
    } catch (err) {
      showAlert("Erro ao carregar detalhes.", "error");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // ============================================================
  // APROVAR
  // ============================================================
  const handleApprove = async (p) => {
    try {
      const resp = await axios.post(
        `${API_URL}/api/approval/approve`,
        {
          document_id: p.document_id,
          group_id: p.group_id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showAlert("Aprovação registrada com sucesso!");

      setDetailData(resp.data);
      await loadPending();
    } catch (err) {
      showAlert(err.response?.data?.error || "Erro ao aprovar.", "error");
    }
  };

  // ============================================================
  // REJEITAR
  // ============================================================
  const handleReject = async (p) => {
    try {
      const resp = await axios.post(
        `${API_URL}/api/approval/reject`,
        {
          document_id: p.document_id,
          group_id: p.group_id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showAlert("Rejeição registrada.");
      setDetailData(resp.data);
      await loadPending();
    } catch (err) {
      showAlert(err.response?.data?.error || "Erro ao rejeitar.", "error");
    }
  };

  // ============================================================
  // RENDER PAGE
  // ============================================================
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 2 }}>

      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Minhas Pendências de Aprovação
      </Typography>

      <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 2 }}>
        <Button variant="contained" onClick={loadPending}>Atualizar</Button>
      </Paper>

      {/* LISTAGEM */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : pendencias.length === 0 ? (
        <Alert severity="info">Nenhuma pendência encontrada.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Documento</TableCell>
                <TableCell>Origem</TableCell>
                <TableCell>Ref</TableCell>
                <TableCell>Grupo</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pendencias.map((p) => (
                <TableRow key={`${p.document_id}-${p.group_id}`}>
                  <TableCell>{p.document_id}</TableCell>
                  <TableCell>{p.origin}</TableCell>
                  <TableCell>{p.origin_ref}</TableCell>
                  <TableCell>{p.approval_group}</TableCell>
                  <TableCell>R$ {Number(p.amount).toFixed(2)}</TableCell>

                  <TableCell align="center">
                    <IconButton onClick={(e) => openMenu(e, p)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </TableContainer>
      )}

      {/* MENU */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        keepMounted
      >
        <MenuItem
          onClick={() => {
            openDetails(menuItem.document_id);
            closeMenu();
          }}
        >
          Ver Detalhes
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleApprove(menuItem);
            closeMenu();
          }}
        >
          Aprovar
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleReject(menuItem);
            closeMenu();
          }}
        >
          Rejeitar
        </MenuItem>
      </Menu>

      {/* DIALOG DETALHES */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Detalhes da Aprovação</DialogTitle>

        <DialogContent dividers>
          {detailLoading || !detailData ? (
            <CircularProgress />
          ) : (
            <>
              <Typography variant="subtitle1">
                <b>Documento ID:</b> {detailData.document.id}
              </Typography>
              <Typography>
                <b>Status:</b> {detailData.document.status}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {detailData.groups.map((g) => (
                <Box key={g.group_id} sx={{ mb: 2 }}>
                  <Typography>
                    <b>Grupo:</b> {g.group_id} — {g.status}
                  </Typography>

                  <List dense>
                    {g.approvers.map((a) => (
                      <ListItem key={a.user_id}>
                        <ListItemText
                          primary={`${a.name} (${a.status})`}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 1 }} />
                </Box>
              ))}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* ALERT */}
      <AppAlert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
      />

    </Box>
  );
}
