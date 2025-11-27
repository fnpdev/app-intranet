import React, { useEffect, useState } from "react";
import {
  Box, Paper, Typography, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, IconButton, Menu, MenuItem, TextField, Grid,
  Tooltip, Divider
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";

import axios from "axios";
import * as XLSX from "xlsx";

import { useAuth } from "../../../context/AuthContext";
import AppAlert from "../../core/components/AppAlert";

const API_URL = process.env.REACT_APP_API_URL;

export default function ReallocationPage() {

  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });

  const showAlert = (message, severity = "success") =>
    setAlert({ open: true, message, severity });

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuItem, setMenuItem] = useState(null);

  // POPUP NOVO / EDITAR
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [header, setHeader] = useState({
    id: null,
    branch: "",
    issue_date: "",
    justification: "",
    type: "PCO",
    spreadsheet: "",
  });

  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});

  const openMenu = (event, item) => {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };


  // ============================================================
  // LOAD REALLOCATIONS
  // ============================================================
  const loadReallocations = async () => {
    setLoading(true);

    try {
      const resp = await axios.get(`${API_URL}/api/reallocation`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRows(resp.data?.data || []);
    } catch (err) {
      showAlert("Erro ao carregar realocações.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReallocations();
  }, [token]);


  // ============================================================
  // OPEN NEW POPUP
  // ============================================================
  const handleNew = () => {
    setIsEditing(false);
    setHeader({
      id: null,
      branch: "",
      issue_date: "",
      justification: "",
      type: "PCO",
      spreadsheet: ""
    });
    setItems([]);
    setErrors({});
    setDialogOpen(true);
  };


  // ============================================================
  // EDIT EXISTING
  // ============================================================
  const handleEdit = async (row) => {
    try {
      // GET HEADER
      const respHeader = await axios.get(`${API_URL}/api/reallocation/${row.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // GET ITEMS
      const respItems = await axios.get(`${API_URL}/api/reallocation/${row.id}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setHeader(respHeader.data.data);
      setItems(respItems.data.data || []);
      setErrors({});
      setIsEditing(true);
      setDialogOpen(true);

    } catch (err) {
      showAlert("Erro ao abrir realocação.", "error");
    }
  };


  // ============================================================
  // UPLOAD PLANILHA EXCEL
  // ============================================================
  const handleUploadExcel = (e) => {
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const parsed = rows.map((r) => ({
        item_date: r.data || r.item_date,
        balance_type: r.tipo_saldo,
        entry_type: r.tipo_lancamento,
        cost_center: r.centro_custo,
        account: r.conta_contabil,
        class: r.classe,
        operation: r.operacao,
        accounting_item: r.item_contabil,
        value: Number(r.valor || 0)
      }));

      setItems(parsed);
    };

    reader.readAsBinaryString(file);
  };


  // ============================================================
  // INLINE EDIT ITEMS
  // ============================================================
  const changeItem = (index, field, value) => {
    const upd = [...items];
    upd[index][field] = value;
    setItems(upd);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        item_date: "",
        balance_type: "",
        entry_type: "",
        cost_center: "",
        account: "",
        class: "",
        operation: "",
        accounting_item: "",
        value: 0
      }
    ]);
  };


  // ============================================================
  // VALIDATE HEADER
  // ============================================================
  const validateHeader = () => {
    const err = {};

    if (!header.branch) err.branch = "Obrigatório";
    if (!header.issue_date) err.issue_date = "Obrigatório";
    if (!header.justification) err.justification = "Obrigatório";
    if (!header.spreadsheet) err.spreadsheet = "Obrigatório";

    setErrors(err);

    return Object.keys(err).length === 0;
  };


  // ============================================================
  // SAVE PARTIAL
  // ============================================================
  const handleSave = async () => {
    if (!validateHeader()) return;

    try {
      let respHeader;

      if (isEditing) {
        respHeader = await axios.put(
          `${API_URL}/api/reallocation/${header.id}`,
          header,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        respHeader = await axios.post(
          `${API_URL}/api/reallocation`,
          { header },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const savedHeader = respHeader.data.data;

      if (items.length > 0) {
        await axios.post(
          `${API_URL}/api/reallocation/${savedHeader.id}/items`,
          { items },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      showAlert("Realocação salva com sucesso!");
      setDialogOpen(false);
      loadReallocations();

    } catch (err) {
      console.error(err);
      showAlert("Erro ao salvar realocação.", "error");
    }
  };


  // ============================================================
  // VALIDATE / APPROVE / CANCEL (mesmo código anterior)
  // ============================================================
  const handleValidate = async (row) => {
    try {
      await axios.post(
        `${API_URL}/api/reallocation/${row.id}/validate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert("Validação concluída com sucesso.");
    } catch {
      showAlert("Erro ao validar.", "error");
    }
  };

  const handleSubmitApproval = async (row) => {
    try {
      await axios.post(
        `${API_URL}/api/reallocation/${row.id}/submit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert("Solicitação enviada para aprovação!");
      loadReallocations();
    } catch {
      showAlert("Erro ao enviar para aprovação.", "error");
    }
  };

  const handleCancel = async (row) => {
    try {
      await axios.post(
        `${API_URL}/api/reallocation/${row.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert("Realocação cancelada.");
      loadReallocations();
    } catch {
      showAlert("Erro ao cancelar.", "error");
    }
  };


  // ============================================================
  // RENDER PAGE
  // ============================================================
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 2 }}>

      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Realocações de Saldos (PCO / FCO)
      </Typography>

      <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}>
          Nova Realocação
        </Button>
        <Button variant="outlined" onClick={loadReallocations}>Atualizar</Button>
      </Paper>

      {/* LISTAGEM */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Alert severity="info">Nenhuma realocação encontrada.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Filial</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Planilha</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.branch}</TableCell>
                  <TableCell>{row.type}</TableCell>

                  <TableCell>{row.status}</TableCell>

                  <TableCell>{row.spreadsheet}</TableCell>

                  <TableCell align="center">
                    <IconButton onClick={(e) => openMenu(e, row)}>
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
      >
        <MenuItem onClick={() => { handleEdit(menuItem); closeMenu(); }}>
          Editar
        </MenuItem>

        <MenuItem onClick={() => { handleValidate(menuItem); closeMenu(); }}>
          Validar
        </MenuItem>

        <MenuItem onClick={() => { handleSubmitApproval(menuItem); closeMenu(); }}>
          Solicitar Aprovação
        </MenuItem>

        <MenuItem onClick={() => { handleCancel(menuItem); closeMenu(); }}>
          Cancelar
        </MenuItem>
      </Menu>

      {/* DIALOG CRIAR/EDITAR REALOCAÇÃO */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          {isEditing ? "Editar Realocação" : "Nova Realocação"}
        </DialogTitle>

        <DialogContent dividers>

          {/* FORM HEADER */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Filial"
                fullWidth
                error={!!errors.branch}
                helperText={errors.branch}
                value={header.branch}
                onChange={(e) => setHeader({ ...header, branch: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Data Emissão"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.issue_date}
                helperText={errors.issue_date}
                value={header.issue_date}
                onChange={(e) => setHeader({ ...header, issue_date: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Tipo"
                fullWidth
                value={header.type}
                onChange={(e) => setHeader({ ...header, type: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Planilha (Protheus)"
                fullWidth
                error={!!errors.spreadsheet}
                helperText={errors.spreadsheet}
                value={header.spreadsheet}
                onChange={(e) => setHeader({ ...header, spreadsheet: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Justificativa"
                fullWidth
                multiline
                minRows={2}
                error={!!errors.justification}
                helperText={errors.justification}
                value={header.justification}
                onChange={(e) => setHeader({ ...header, justification: e.target.value })}
              />
            </Grid>
          </Grid>

          {/* IMPORTAR EXCEL */}
          <Box mb={2}>
            <input type="file" accept=".xlsx" onChange={handleUploadExcel} />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* ADD ITEM */}
          <Button variant="contained" onClick={addItem} sx={{ mb: 2 }}>
            Adicionar Item
          </Button>

          {/* GRID EDITÁVEL */}
          {items.length > 0 && (
            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Saldo</TableCell>
                    <TableCell>Lançamento</TableCell>
                    <TableCell>CC</TableCell>
                    <TableCell>Conta</TableCell>
                    <TableCell>Classe</TableCell>
                    <TableCell>Operação</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <TextField
                          type="date"
                          value={item.item_date}
                          onChange={(e) => changeItem(idx, "item_date", e.target.value)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          value={item.balance_type}
                          onChange={(e) => changeItem(idx, "balance_type", e.target.value)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          value={item.entry_type}
                          onChange={(e) => changeItem(idx, "entry_type", e.target.value)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          value={item.cost_center}
                          onChange={(e) => changeItem(idx, "cost_center", e.target.value)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          value={item.account}
                          onChange={(e) => changeItem(idx, "account", e.target.value)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          value={item.class}
                          onChange={(e) => changeItem(idx, "class", e.target.value)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          value={item.operation}
                          onChange={(e) => changeItem(idx, "operation", e.target.value)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          value={item.accounting_item}
                          onChange={(e) => changeItem(idx, "accounting_item", e.target.value)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          type="number"
                          value={item.value}
                          onChange={(e) => changeItem(idx, "value", e.target.value)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <IconButton color="error" onClick={() => removeItem(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Fechar</Button>

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ALERTA GLOBAL */}
      <AppAlert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
      />

    </Box>
  );
}
