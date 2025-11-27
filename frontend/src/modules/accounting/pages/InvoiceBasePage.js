// -------------------------------------------------------------
// InvoiceBasePage.js – Versão B (Parte 1)
// -------------------------------------------------------------

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Alert,
  Tabs, Tab
} from '@mui/material';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';

import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import AppAlert from '../../core/components/AppAlert';
import InvoiceStepsTabs from '../components/InvoiceStepsTabs';
import { useNavigate } from 'react-router-dom';
import InvoicePrint from '../components/InvoicePrint';

const API_URL = process.env.REACT_APP_API_URL;

export default function InvoiceBasePage(props) {
  const {
    title, step, setStep, steps = [],
    actionsByTransition = [],
    onDataChange, refresh
  } = props;

  const navigate = useNavigate();
  const { token, user } = useAuth();

  // ============================================================
  // STATES
  // ============================================================
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceKey, setInvoiceKey] = useState('');

  const [toStep, setToStep] = useState('');
  const [message, setMessage] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [note, setNote] = useState('');

  const [newInvoiceKey, setNewInvoiceKey] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newAction, setNewAction] = useState('');
  const [newUser, setNewUser] = useState('');

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [nfSaam, setNfSaam] = useState(null);
  const [nfErp, setNfErp] = useState([]);
  const [nfCount, setNfCount] = useState(null);
  const [nfDetailLoading, setNfDetailLoading] = useState(false);

  const [nfDetailDialogOpen, setNfDetailDialogOpen] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const [invoiceToClose, setInvoiceToClose] = useState(null);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [tab, setTab] = useState(0);

  const [stepCounts, setStepCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(false);

  // ============================================================
  // MENU – CORREÇÃO DEFINITIVA
  // ============================================================
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuInvoice, setMenuInvoice] = useState(null);

  const openMenu = (event, invoice) => {
    setMenuAnchor(event.currentTarget);

    // ❗ resolução final do bug: achar no array original
    const original = invoices.find((i) => i.id === invoice.id);
    setMenuInvoice(original ?? invoice);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuInvoice(null);
  };

  // ============================================================
  // FILTERS + SORT
  // ============================================================
  const [filterKey, setFilterKey] = useState('');
  const [filterEmitente, setFilterEmitente] = useState('');
  const [filterNumero, setFilterNumero] = useState('');
  const [filterDestinatario, setFilterDestinatario] = useState('');

  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const showAlert = (msg, severity = 'success') =>
    setAlert({ open: true, message: msg, severity });

  // ============================================================
  // TRANSITIONS CONFIG
  // ============================================================
  const transitionMap = useMemo(() => {
    const map = {};
    if (Array.isArray(actionsByTransition)) {
      actionsByTransition.forEach(s => (map[s.step] = s));
    }
    return map;
  }, [actionsByTransition]);

  const config = transitionMap[step] || {};
  const {
    allowCreate: configAllowCreate = false,
    allowUpdate: configAllowUpdate = true,
    allowClose: configAllowClose = false,
    allowLogs: configAllowLogs = true,
    allowCount: configAllowCount = false,
    allowInvoice: configAllowInvoice = false,
    allowPrint: configAllowPrint = false
  } = config;

  const allowCreate = props.allowCreate ?? configAllowCreate;
  const allowUpdate = props.allowUpdate ?? configAllowUpdate;
  const allowClose = props.allowClose ?? configAllowClose;
  const allowLogs = props.allowLogs ?? configAllowLogs;
  const allowCount = props.allowCount ?? configAllowCount;
  const allowInvoice = props.allowInvoice ?? configAllowInvoice;
  const allowPrint = props.allowPrint ?? configAllowPrint;

  const toSteps = useMemo(() => {
    return config?.to_step?.map(t => t.step) || [];
  }, [config]);

  const currentTransition = config?.to_step?.find(t => t.step === toStep) || {};
  const possibleActions = currentTransition.action || [];
  const possibleUsers = currentTransition.user || [];

  // ============================================================
  // LOAD INVOICES
  // ============================================================
  const loadInvoices = async () => {
    if (!token || !step) return;

    setLoading(true);
    try {
      const resp = await axios.get(`${API_URL}/api/contabil/nf/step/${step}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInvoices(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      setFeedback('Erro ao carregar NFs.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD COUNTS
  // ============================================================
  const loadCounts = async () => {
    if (!token || !steps.length) return;

    setCountsLoading(true);
    try {
      const calls = steps.map(s =>
        axios
          .get(`${API_URL}/api/contabil/nf/step/${s}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(r => ({ step: s, items: r.data ?? [] }))
          .catch(() => ({ step: s, items: [] }))
      );

      const results = await Promise.all(calls);
      const obj = {};
      results.forEach(r => {
        obj[r.step] = r.items.length;
      });

      setStepCounts(obj);
    } finally {
      setCountsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [token, step, refresh]);

  useEffect(() => {
    loadCounts();
  }, [token, steps, refresh]);

// -------------------------------------------------------------
// InvoiceBasePage.js – Versão B (Parte 2)
// -------------------------------------------------------------

  // ============================================================
  // HELPER: pegar campo aninhado (para sort e filter)
  // ============================================================
  const getValueByPath = (obj, path) => {
    if (!obj || !path) return null;
    return path.split('.').reduce((o, k) => (o ? o[k] : null), obj);
  };

  // Normalização para comparar strings/datas/números
  const normalizeForCompare = (v) => {
    if (v == null) return '';
    if (typeof v === 'string') return v.toLowerCase();
    if (typeof v === 'number') return v;
    return v;
  };

  // SORT CLICK
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // ============================================================
  // FILTER + SORT no array
  // ============================================================
  const filteredInvoices = useMemo(() => {
    let arr = [...invoices];

    if (filterKey.trim()) {
      arr = arr.filter((r) =>
        (r.invoice_key ?? '').toLowerCase().includes(filterKey.toLowerCase())
      );
    }

    if (filterEmitente.trim()) {
      arr = arr.filter((r) =>
        (getValueByPath(r, 'saam_nf.nome_emitente') ?? '')
          .toLowerCase()
          .includes(filterEmitente.toLowerCase())
      );
    }

    if (filterNumero.trim()) {
      arr = arr.filter((r) =>
        String(getValueByPath(r, "saam_nf.numero_nota") ?? "").includes(filterNumero)
      );
    }

    if (filterDestinatario.trim()) {
      arr = arr.filter((r) =>
        (getValueByPath(r, "saam_nf.nome_destinatario") ?? "")
          .toLowerCase()
          .includes(filterDestinatario.toLowerCase())
      );
    }

    // SORTING
    if (sortField) {
      arr.sort((a, b) => {
        const va = normalizeForCompare(getValueByPath(a, sortField));
        const vb = normalizeForCompare(getValueByPath(b, sortField));

        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return arr;
  }, [
    invoices,
    filterKey,
    filterEmitente,
    filterNumero,
    filterDestinatario,
    sortField,
    sortDir
  ]);

  // Indicador ▲ ▼
  const SortIndicator = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? " ▲" : " ▼";
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const openUpdate = (inv) => {
    setSelectedInvoice(inv);
    setInvoiceKey(inv.invoice_key);
    setToStep('');
    setMessage('');
    setToUserId('');
    setNote('');
    setDialogOpen(true);
  };

  const handleSubmitUpdate = async () => {
    if (!selectedInvoice) return;
    if (!toStep) return showAlert('Selecione a etapa destino.', 'warning');

    try {
      await axios.put(
        `${API_URL}/api/contabil/nf/${selectedInvoice.id}/step`,
        {
          user_id: user?.id,
          to_step: toStep,
          to_user_id: toUserId || null,
          message: message || null,
          note: note || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDialogOpen(false);
      await loadInvoices();
      await loadCounts();
      onDataChange?.();
      window.dispatchEvent(new Event('invoicesUpdated'));

      showAlert(`NF ${selectedInvoice.invoice_key} atualizada!`);
    } catch {
      showAlert("Erro ao atualizar NF.", "error");
    }
  };

  // CREATE
  const handleCreateInvoice = async () => {
    if (!newInvoiceKey.trim()) return showAlert("Informe a chave", "warning");

    try {
      await axios.post(
        `${API_URL}/api/contabil/nf`,
        {
          user_id: user?.id,
          invoice_key: newInvoiceKey.trim(),
          current_step: "portaria",
          to_user_id: newUser || null,
          message: newAction || null,
          note: newNote || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCreateDialogOpen(false);
      setNewInvoiceKey('');
      setNewNote('');
      setNewAction('');
      setNewUser('');

      await loadInvoices();
      await loadCounts();
      onDataChange?.();
      window.dispatchEvent(new Event('invoicesUpdated'));

      showAlert("NF registrada!");
    } catch (err) {
      showAlert(err.response?.data?.error || "Erro ao registrar NF.", "error");
    }
  };

  // LOGS
  const openLogsDialog = async (inv) => {
    setSelectedInvoice(inv);
    setLogs([]);
    setLogsLoading(true);
    setLogsDialogOpen(true);

    try {
      const resp = await axios.get(`${API_URL}/api/contabil/nf/${inv.id}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLogs(resp.data ?? []);
    } catch {
      showAlert("Erro ao carregar logs.", "error");
    } finally {
      setLogsLoading(false);
    }
  };

  // NF DETAILS
  const handleOpenNFDetails = async (key) => {
    setNfDetailDialogOpen(true);
    setNfDetailLoading(true);

    try {
      const resp = await axios.get(
        `${API_URL}/api/contabil/nf/saam/${key}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNfSaam(resp.data?.saam?.nf ?? null);
      setNfErp(resp.data?.erp?.nf ?? null);
      setNfCount(resp.data?.count?.count ?? null);
    } catch {
      setNfDetailDialogOpen(false);
      showAlert("Erro ao carregar detalhes.", "error");
    } finally {
      setNfDetailLoading(false);
    }
  };

  // PRINT
  const handlePrint = async (inv) => {
    try {
      setNfDetailLoading(true);

      const resp = await axios.get(
        `${API_URL}/api/contabil/nf/saam/${inv.invoice_key}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const saam = resp.data?.saam?.nf ?? null;
      const erp = resp.data?.erp?.nf ?? null;

      if (!saam) {
        showAlert("NF não encontrada.", "error");
        return;
      }

      window.dispatchEvent(
        new CustomEvent("invoicePrint", {
          detail: {
            nfSaam: saam,
            items: erp?.itens ?? [],
            mode: step
          }
        })
      );
    } catch {
      showAlert("Erro ao imprimir", "error");
    } finally {
      setNfDetailLoading(false);
    }
  };

  // CONTAGEM
  const startCount = async (id) => {
    try {
      await axios.post(
        `${API_URL}/api/contabil/nf/${id}/contagem`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/estoque/contagem/${id}`);
    } catch {
      navigate(`/estoque/contagem/${id}`);
      showAlert("Erro ao iniciar contagem.", "error");
    }
  };

  // CLOSE
  const openConfirmClose = (inv) => {
    setInvoiceToClose(inv);
    setConfirmCloseOpen(true);
  };

  const confirmCloseInvoice = async () => {
    try {
      await axios.put(
        `${API_URL}/api/contabil/nf/close/${invoiceToClose.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConfirmCloseOpen(false);
      await loadInvoices();
      await loadCounts();

      onDataChange?.();
      window.dispatchEvent(new Event("invoicesUpdated"));

      showAlert(`NF ${invoiceToClose.invoice_key} finalizada.`);
    } catch {
      showAlert("Erro ao finalizar NF", "error");
    }
  };
// -------------------------------------------------------------
// InvoiceBasePage.js – Versão B (Parte 3 – FINAL)
// -------------------------------------------------------------

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "95%",
        mx: "auto",
        mt: 2,
        px: 2
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {title}
      </Typography>

      <InvoiceStepsTabs
        steps={steps}
        step={step}
        setStep={setStep}
        counts={stepCounts}
        countsLoading={countsLoading}
      />

      {/* FILTERS E AÇÕES */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <Button variant="contained" onClick={loadInvoices}>
          Atualizar
        </Button>

        {allowCreate && (
          <Button variant="outlined" onClick={() => setCreateDialogOpen(true)}>
            Nova NF
          </Button>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <TextField
          label="Chave"
          value={filterKey}
          size="small"
          onChange={(e) => setFilterKey(e.target.value)}
          sx={{ minWidth: 180 }}
        />

        <TextField
          label="Emitente (SAAM)"
          value={filterEmitente}
          size="small"
          onChange={(e) => setFilterEmitente(e.target.value)}
          sx={{ minWidth: 180 }}
        />

        <TextField
          label="Nº Nota"
          value={filterNumero}
          size="small"
          onChange={(e) => setFilterNumero(e.target.value)}
          sx={{ minWidth: 130 }}
        />

        <TextField
          label="Destinatário (SAAM)"
          value={filterDestinatario}
          size="small"
          onChange={(e) => setFilterDestinatario(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Paper>

      {/* ===================== TABELA ===================== */}
      {loading ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredInvoices.length ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {/* ID */}
                <TableCell
                  onClick={() => handleSort("id")}
                  style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  ID <SortIndicator field="id" />
                </TableCell>

                {/* CHAVE */}
                <TableCell
                  onClick={() => handleSort("invoice_key")}
                  style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Chave <SortIndicator field="invoice_key" />
                </TableCell>

                {/* EMITENTE */}
                <TableCell
                  onClick={() =>
                    handleSort("saam_nf.nome_emitente")
                  }
                  style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Emitente <SortIndicator field="saam_nf.nome_emitente" />
                </TableCell>

                {/* NÚMERO NOTA */}
                <TableCell
                  onClick={() =>
                    handleSort("saam_nf.numero_nota")
                  }
                  style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Nº Nota <SortIndicator field="saam_nf.numero_nota" />
                </TableCell>

                {/* DESTINATÁRIO */}
                <TableCell
                  onClick={() =>
                    handleSort("saam_nf.nome_destinatario")
                  }
                  style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Destinatário <SortIndicator field="saam_nf.nome_destinatario" />
                </TableCell>

                {/* MENSAGEM */}
                <TableCell
                  onClick={() => handleSort("message")}
                  style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Mensagem <SortIndicator field="message" />
                </TableCell>

                {/* USUÁRIO */}
                <TableCell
                  onClick={() => handleSort("user_name")}
                  style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  De <SortIndicator field="user_name" />
                </TableCell>

                {/* RESPONSÁVEL */}
                <TableCell
                  onClick={() => handleSort("to_user_name")}
                  style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Para <SortIndicator field="to_user_name" />
                </TableCell>

                {/* LOGS */}
                <TableCell
                  onClick={() => handleSort("total_logs")}
                  style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Logs <SortIndicator field="total_logs" />
                </TableCell>

                {/* ATUALIZADO */}
                <TableCell
                  onClick={() => handleSort("updated_at")}
                  style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Atualizado <SortIndicator field="updated_at" />
                </TableCell>

                {/* MENU */}
                <TableCell align="center">Ação</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.id}</TableCell>
                  <TableCell>{inv.invoice_key}</TableCell>

                  <TableCell>
                    {getValueByPath(inv, "saam_nf.nome_emitente") || "-"}
                  </TableCell>

                  <TableCell>
                    {getValueByPath(inv, "saam_nf.numero_nota") || "-"}
                  </TableCell>

                  <TableCell>
                    {getValueByPath(inv, "saam_nf.nome_destinatario") || "-"}
                  </TableCell>

                  <TableCell>{inv.message || "-"}</TableCell>
                  <TableCell>{inv.user_name || "-"}</TableCell>
                  <TableCell>{inv.to_user_name || "-"}</TableCell>
                  <TableCell>{inv.total_logs}</TableCell>

                  <TableCell>
                    {inv.updated_at
                      ? new Date(inv.updated_at).toLocaleString("pt-BR")
                      : "-"}
                  </TableCell>

                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => openMenu(e, inv)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">Nenhuma NF encontrada.</Alert>
      )}

      {/* MENU DE AÇÕES */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
      >
        {allowInvoice && (
          <MenuItem
            onClick={() => {
              handleOpenNFDetails(menuInvoice.invoice_key);
              closeMenu();
            }}
          >
            Ver NF
          </MenuItem>
        )}

        {allowLogs && (
          <MenuItem
            onClick={() => {
              openLogsDialog(menuInvoice);
              closeMenu();
            }}
          >
            Logs
          </MenuItem>
        )}

        {allowUpdate && (
          <MenuItem
            onClick={() => {
              openUpdate(menuInvoice);
              closeMenu();
            }}
          >
            Atualizar
          </MenuItem>
        )}

        {allowCount && (
          <MenuItem
            onClick={() => {
              startCount(menuInvoice.id);
              closeMenu();
            }}
          >
            Iniciar Contagem
          </MenuItem>
        )}

        {allowClose && (
          <MenuItem
            onClick={() => {
              openConfirmClose(menuInvoice);
              closeMenu();
            }}
          >
            Fechar NF
          </MenuItem>
        )}

        {allowPrint && (
          <MenuItem
            onClick={() => {
              handlePrint(menuInvoice);
              closeMenu();
            }}
          >
            Imprimir
          </MenuItem>
        )}
      </Menu>

      {/* ===================== DIÁLOGOS ===================== */}

      {/* CREATE */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth>
        <DialogTitle>Registrar NF na Portaria</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Chave"
            fullWidth
            value={newInvoiceKey}
            onChange={(e) => setNewInvoiceKey(e.target.value)}
          />

          {/* Actions e Users automáticos da portaria */}
          {(() => {
            const first = transitionMap?.portaria?.to_step?.[0];
            if (!first) return null;

            const actions = first.action || [];
            const users = first.user || [];

            return (
              <>
                {actions.length > 0 && (
                  <FormControl fullWidth>
                    <InputLabel>Ação</InputLabel>
                    <Select
                      value={newAction}
                      label="Ação"
                      onChange={(e) => setNewAction(e.target.value)}
                    >
                      <MenuItem value="">(automático)</MenuItem>
                      {actions.map((a) => (
                        <MenuItem key={a.value} value={a.value}>
                          {a.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {users.length > 0 && (
                  <FormControl fullWidth>
                    <InputLabel>Responsável</InputLabel>
                    <Select
                      value={newUser}
                      label="Responsável"
                      onChange={(e) => setNewUser(e.target.value)}
                    >
                      <MenuItem value="">(automático)</MenuItem>
                      {users.map((u) => (
                        <MenuItem key={u.value} value={u.value}>
                          {u.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </>
            );
          })()}

          <TextField
            label="Observação"
            fullWidth
            multiline
            rows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateInvoice}>
            Registrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* UPDATE */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
        <DialogTitle>Atualizar NF #{selectedInvoice?.id}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Chave NF" fullWidth disabled value={invoiceKey} />

          <FormControl fullWidth>
            <InputLabel>Etapa Destino</InputLabel>
            <Select
              value={toStep}
              label="Etapa Destino"
              onChange={(e) => {
                setToStep(e.target.value);
                setMessage("");
                setToUserId("");
              }}
            >
              <MenuItem value="">Selecione</MenuItem>
              {toSteps.map((s) => {
                const obj = config.to_step.find((t) => t.step === s);
                return (
                  <MenuItem key={s} value={s}>
                    {obj.label || s}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* actions */}
          {possibleActions.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Ação</InputLabel>
              <Select
                value={message}
                label="Ação"
                onChange={(e) => setMessage(e.target.value)}
              >
                {possibleActions.map((a) => (
                  <MenuItem key={a.value} value={a.value}>
                    {a.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* users */}
          {possibleUsers.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Responsável</InputLabel>
              <Select
                value={toUserId}
                label="Responsável"
                onChange={(e) => setToUserId(e.target.value)}
              >
                {possibleUsers.map((u) => (
                  <MenuItem key={u.value} value={u.value}>
                    {u.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label="Observação"
            fullWidth
            multiline
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmitUpdate}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* LOGS */}
      <Dialog open={logsDialogOpen} onClose={() => setLogsDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Logs da NF</DialogTitle>
        <DialogContent dividers>
          {logsLoading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : logs.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Usuário</TableCell>
                  <TableCell>Etapas</TableCell>
                  <TableCell>Mensagem</TableCell>
                  <TableCell>Responsável</TableCell>
                  <TableCell>Observação</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      {l.created_at
                        ? new Date(l.created_at).toLocaleString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell>{l.user_name}</TableCell>
                    <TableCell>
                      {l.from_step ? `${l.from_step} → ${l.to_step}` : l.to_step}
                    </TableCell>
                    <TableCell>{l.message}</TableCell>
                    <TableCell>{l.to_user_name || "-"}</TableCell>
                    <TableCell>{l.note || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert severity="info">Nenhum log encontrado.</Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setLogsDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* NF DETAILS */}
      <Dialog open={nfDetailDialogOpen} onClose={() => setNfDetailDialogOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>Detalhes da NF</DialogTitle>
        <DialogContent dividers>
          {nfDetailLoading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                  <Tab label="SAAM" />
                  <Tab label="ERP" />
                  <Tab label="Contagem" />
                </Tabs>
              </Box>

              {/* SAAM */}
              {tab === 0 && nfSaam && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography>
                      <b>Emitente:</b> {nfSaam.nome_emitente}
                    </Typography>
                    <Typography>
                      <b>Destinatário:</b> {nfSaam.nome_destinatario}
                    </Typography>
                    <Typography><b>CNPJ:</b> {nfSaam.cnpj_emitente}</Typography>
                    <Typography><b>Nº Nota:</b> {nfSaam.numero_nota}</Typography>
                    <Typography>
                      <b>Data Emissão:</b>{" "}
                      {nfSaam.data_emissao
                        ? new Date(nfSaam.data_emissao).toLocaleDateString("pt-BR")
                        : "-"}
                    </Typography>
                  </Paper>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell>NCM</TableCell>
                        <TableCell>CFOP</TableCell>
                        <TableCell>Un</TableCell>
                        <TableCell align="right">Qtd</TableCell>
                        <TableCell align="right">Vlr Unit</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {nfSaam.itens?.map((it, i) => (
                        <TableRow key={i}>
                          <TableCell>{it.item}</TableCell>
                          <TableCell>{it.descricao}</TableCell>
                          <TableCell>{it.ncm}</TableCell>
                          <TableCell>{it.cfop}</TableCell>
                          <TableCell>{it.unidade}</TableCell>
                          <TableCell align="right">{it.qtde}</TableCell>
                          <TableCell align="right">{it.valor_unit}</TableCell>
                          <TableCell align="right">{it.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {/* ERP */}
              {tab === 1 && nfErp && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography><b>Filial:</b> {nfErp.filial}</Typography>
                    <Typography><b>Nº:</b> {nfErp.numero}</Typography>
                    <Typography><b>Fornecedor:</b> {nfErp.fornecedor}</Typography>
                    <Typography><b>Série:</b> {nfErp.serie}</Typography>
                    <Typography><b>Status:</b> {nfErp.status_nf}</Typography>
                  </Paper>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Produto</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell>UN</TableCell>
                        <TableCell align="right">Qtd</TableCell>
                        <TableCell align="right">Vlr Unit</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {nfErp.itens?.map((it, i) => (
                        <TableRow key={i}>
                          <TableCell>{it.item}</TableCell>
                          <TableCell>{it.produto}</TableCell>
                          <TableCell>{it.produto_desc}</TableCell>
                          <TableCell>{it.unide_medida}</TableCell>
                          <TableCell align="right">{it.qtde}</TableCell>
                          <TableCell align="right">{it.valor}</TableCell>
                          <TableCell align="right">{it.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {/* CONTAGEM */}
              {tab === 2 && nfCount && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography><b>ID:</b> {nfCount.id}</Typography>
                    <Typography><b>Status:</b> {nfCount.status}</Typography>
                    <Typography>
                      <b>Divergências:</b>{" "}
                      {nfCount.matched ? "OK" : "Com divergências"}
                    </Typography>
                  </Paper>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell>Código</TableCell>
                        <TableCell>Qtd Contada</TableCell>
                        <TableCell>OK?</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {nfCount.itens?.map((it, i) => (
                        <TableRow key={i}>
                          <TableCell>{it.item_number}</TableCell>
                          <TableCell>{it.description}</TableCell>
                          <TableCell>{it.codigo}</TableCell>
                          <TableCell>{it.qty_counted}</TableCell>
                          <TableCell
                            style={{
                              color: it.is_matched ? "green" : "red",
                              fontWeight: "bold"
                            }}
                          >
                            {it.is_matched ? "✔" : "✘"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setNfDetailDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* CLOSE */}
      <Dialog open={confirmCloseOpen} onClose={() => setConfirmCloseOpen(false)}>
        <DialogTitle>Encerrar NF</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja realmente finalizar a NF{" "}
            <b>{invoiceToClose?.invoice_key}</b>?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmCloseOpen(false)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmCloseInvoice}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* IMPRESSÃO */}
      <InvoicePrint />

      {/* ALERTA */}
      <AppAlert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert((a) => ({ ...a, open: false }))}
      />
    </Box>
  );
}
