import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import AppAlert from '../../core/components/AppAlert';

const API_URL = process.env.REACT_APP_API_URL;

// ================== AÇÕES POR TRANSIÇÃO ==================
const ACTIONS_BY_TRANSITION = {
  portaria: {
    fiscal: [{ value: 'Entrada NF', label: 'Entrada NF' }],
  },
  fiscal: {
    estoque: [{ value: 'Liberado Contagem', label: 'Liberado Contagem' }],
    suprimentos: [
      { value: 'Sem PC', label: 'Sem PC' },
      { value: 'Divergencia de Itens', label: 'Divergência de Itens' },
      { value: 'Sem Fornecedor', label: 'Sem Fornecedor' },
    ],
    recebimento: [{ value: 'Entrada Liberada', label: 'Entrada Liberada' }],
  },
  suprimentos: {
    fiscal: [
      { value: 'PC Corrigido', label: 'PC Corrigido' },
      { value: 'Recusa', label: 'Recusa' },
    ],
  },
  estoque: {
    fiscal: [{ value: 'Contagem Realizada', label: 'Contagem Realizada' }],
  },
  recebimento: {
    fiscal: [{ value: 'NF Com Divergencia', label: 'NF Com Divergência' }],
    finalize: [{ value: 'Finaliza Processo', label: 'Finaliza Processo' }],
  },
};

const TO_STEP_OPTIONS = [
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'portaria', label: 'Portaria' },
  { value: 'suprimentos', label: 'Suprimentos' },
  { value: 'estoque', label: 'Estoque' },
  { value: 'recebimento', label: 'Recebimento' },
  { value: 'finalize', label: 'Finalizar Processo' },
];

export default function InvoiceBasePage({
  title,
  step,
  allowCreate = false,
  allowUpdate = true,
  allowClose = false,
  onDataChange = null,
}) {
  const { token, user } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('update');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [invoiceToClose, setInvoiceToClose] = useState(null);

  // logs
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // fields
  const [invoiceKey, setInvoiceKey] = useState('');
  const [toStep, setToStep] = useState('');
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');

  // alert
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const showAlert = (messageText, severity = 'success') => {
    setAlert({ open: true, message: messageText, severity });
  };

  // =========================================================
  // load invoices
  // =========================================================
  const loadInvoices = async () => {
    if (!token || !step) return;
    setLoading(true);
    setFeedback('');
    try {
      const resp = await axios.get(`${API_URL}/contabil/nf/step/${step}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      console.error('Erro ao carregar NFs:', err);
      setFeedback('Erro ao carregar NFs.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    // reset dialog state when step/token changes
    setDialogOpen(false);
    setSelectedInvoice(null);
    setInvoiceKey('');
    setToStep('');
    setMessage('');
    setNote('');
    setFeedback('');
  }, [token, step]);

  const possibleToSteps = () => Object.keys(ACTIONS_BY_TRANSITION[step] || {});
  const possibleActions = (from, to) => (ACTIONS_BY_TRANSITION[from]?.[to] || []);

  // =========================================================
  // openCreate / openUpdate (centralized)
  // =========================================================
  const openCreate = () => {
    setDialogMode('create');
    setSelectedInvoice(null);
    setInvoiceKey('');
    setMessage('');
    setToStep('fiscal'); // creation forwards to fiscal by design
    setNote('');
    setDialogOpen(true);
  };

  const openUpdate = (inv) => {
    if (!allowUpdate) {
      console.debug('openUpdate blocked: allowUpdate=false');
      return;
    }
    console.debug('openUpdate ->', inv);
    setDialogMode('update');
    setSelectedInvoice(inv || null);
    setInvoiceKey(inv?.invoice_key || '');
    // clear previous selection so user explicitly picks destination (prevents mismatch)
    setToStep('');
    setMessage('');
    setNote('');
    setDialogOpen(true);
  };

  // =========================================================
  // submit create/update/finalize
  // =========================================================
  const handleSubmit = async () => {
    setFeedback('');
    try {
      if (dialogMode === 'create') {
        if (!invoiceKey || !message) {
          setFeedback('Informe a chave e a ação.');
          return;
        }
        await axios.post(`${API_URL}/contabil/nf`, {
          user_id: user?.id,
          invoice_key: invoiceKey,
          current_step: step,
          message,
          note,
        }, { headers: { Authorization: `Bearer ${token}` } });

        setDialogOpen(false);
        await loadInvoices();
        if (onDataChange) onDataChange();
        showAlert('NF criada com sucesso.', 'success');
        return;
      }

      // update mode
      if (!selectedInvoice) {
        setFeedback('Selecione uma NF.');
        return;
      }
      if (!toStep) {
        setFeedback('Selecione a etapa destino.');
        return;
      }
      if (!message) {
        setFeedback('Selecione a ação.');
        return;
      }

      if (message === 'Finaliza Processo') {
        await axios.put(`${API_URL}/contabil/nf/close/${selectedInvoice.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDialogOpen(false);
        await loadInvoices();
        if (onDataChange) onDataChange();
        showAlert(`NF ${selectedInvoice.invoice_key} finalizada com sucesso!`, 'success');
        return;
      }

      await axios.put(`${API_URL}/contabil/nf/${selectedInvoice.id}/step`, {
        user_id: user?.id,
        to_step: toStep,
        message,
        note,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setDialogOpen(false);
      await loadInvoices();
      if (onDataChange) onDataChange();
      showAlert(`NF ${selectedInvoice.invoice_key} atualizada com sucesso!`, 'success');
    } catch (err) {
      console.error('Erro ao enviar ação:', err);
      showAlert('Erro ao processar a ação.', 'error');
    }
  };

  // =========================================================
  // close row using modal (no window.confirm)
  // =========================================================
  const handleCloseRow = (inv) => {
    setInvoiceToClose(inv);
    setConfirmDialogOpen(true);
  };

  const confirmCloseInvoice = async () => {
    if (!invoiceToClose) return;
    try {
      await axios.put(`${API_URL}/contabil/nf/close/${invoiceToClose.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfirmDialogOpen(false);
      setInvoiceToClose(null);
      await loadInvoices();
      if (onDataChange) onDataChange();
      showAlert(`NF ${invoiceToClose.invoice_key} finalizada com sucesso!`, 'success');
    } catch (err) {
      console.error(err);
      showAlert('Erro ao finalizar NF.', 'error');
    }
  };

  // =========================================================
  // logs
  // =========================================================
  const openLogsDialog = async (inv) => {
    setLogs([]);
    setLogsLoading(true);
    setLogsDialogOpen(true);
    try {
      const resp = await axios.get(`${API_URL}/contabil/nf/${inv.id}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
      showAlert('Erro ao carregar logs da NF.', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  // =========================================================
  // render
  // =========================================================
  return (
    <Box sx={{ maxWidth: 1300, mx: 'auto', mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {title}
      </Typography>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        {allowCreate && (
          <Button variant="outlined" onClick={openCreate}>
            Nova NF
          </Button>
        )}
        <Button variant="contained" onClick={loadInvoices}>
          Atualizar Lista
        </Button>
      </Paper>

      {feedback && <Alert severity="info" sx={{ mb: 2 }}>{feedback}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : invoices.length > 0 ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Chave</TableCell>
                <TableCell>Mensagem</TableCell>
                <TableCell>Usuário</TableCell>
                <TableCell>Logs</TableCell>
                <TableCell>Atualizado</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.id}</TableCell>
                  <TableCell>{inv.invoice_key}</TableCell>
                  <TableCell>{inv.message}</TableCell>
                  <TableCell>{inv.user_name}</TableCell>
                  <TableCell>{inv.total_logs}</TableCell>
                  <TableCell>{new Date(inv.updated_at).toLocaleString()}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                      onClick={() => openLogsDialog(inv)}
                    >
                      Logs
                    </Button>

                    {allowUpdate && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => openUpdate(inv)}
                        sx={{ mr: 1 }}
                      >
                        Atualizar
                      </Button>
                    )}
                    {allowClose && (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => handleCloseRow(inv)}
                      >
                        Fechar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">Nenhuma NF encontrada.</Alert>
      )}

      {/* Confirm close dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirmar encerramento</DialogTitle>
        <DialogContent>
          Tem certeza que deseja <strong>finalizar</strong> a NF
          <br />
          <strong>{invoiceToClose?.invoice_key}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmCloseInvoice}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main dialog (create / update) */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? `Nova NF - ${step.toUpperCase()}` : `Atualizar NF #${selectedInvoice?.id}`}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {dialogMode === 'create' ? (
            <TextField label="Chave da NF" fullWidth value={invoiceKey} onChange={(e) => setInvoiceKey(e.target.value)} />
          ) : (
            <TextField label="Chave (leitura)" fullWidth value={invoiceKey} disabled />
          )}

          {dialogMode === 'update' && (
            <FormControl fullWidth>
              <InputLabel>Etapa Destino</InputLabel>
              <Select value={toStep} label="Etapa Destino" onChange={(e) => { setToStep(e.target.value); setMessage(''); }}>
                <MenuItem value="">(Selecionar)</MenuItem>
                {possibleToSteps().map((ts) => {
                  const opt = TO_STEP_OPTIONS.find((o) => o.value === ts);
                  return <MenuItem key={ts} value={ts}>{opt ? opt.label : ts}</MenuItem>;
                })}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth>
            <InputLabel>Ação</InputLabel>
            <Select value={message} label="Ação" onChange={(e) => setMessage(e.target.value)}>
              {(dialogMode === 'create' ? (ACTIONS_BY_TRANSITION[step]?.['fiscal'] || []) : (possibleActions(step, toStep) || [])).map((a) => (
                <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label="Observação" fullWidth multiline rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      {/* Logs dialog */}
      <Dialog open={logsDialogOpen} onClose={() => setLogsDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Histórico da NF</DialogTitle>
        <DialogContent dividers>
          {logsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : logs.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Usuário</TableCell>
                  <TableCell>Etapas</TableCell>
                  <TableCell>Mensagem</TableCell>
                  <TableCell>Observação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell>{log.user_name}</TableCell>
                    <TableCell>{log.from_step ? `${log.from_step} → ${log.to_step}` : log.to_step}</TableCell>
                    <TableCell>{log.message}</TableCell>
                    <TableCell>{log.note || '-'}</TableCell>
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

      {/* AppAlert */}
      <AppAlert open={alert.open} message={alert.message} severity={alert.severity} onClose={() => setAlert((a) => ({ ...a, open: false }))} />
    </Box>
  );
}
