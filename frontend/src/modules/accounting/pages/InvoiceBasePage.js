// frontend/src/modules/accounting/pages/InvoiceBasePage.js
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
    title,
    step,
    setStep,
    steps = [],
    actionsByTransition = [], // agora ARRAY (novo modelo)
    onDataChange,
    refresh
  } = props;

  const navigate = useNavigate();
  const { token, user } = useAuth();

  // ============================================================
  // 🔥 ESTADOS (todos no topo, para evitar erros de ReferenceError)
  // ============================================================

  // NF selecionada para update
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceKey, setInvoiceKey] = useState('');

  // 🔥 precisa vir antes de qualquer uso
  const [toStep, setToStep] = useState('');
  const [message, setMessage] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [note, setNote] = useState('');

  // criação
  const [newInvoiceKey, setNewInvoiceKey] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newAction, setNewAction] = useState('');
  const [newUser, setNewUser] = useState('');

  // logs  
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // contagem / detalhes
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


  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuInvoice, setMenuInvoice] = useState(null);

  const openMenu = (event, invoice) => {
    setMenuAnchor(event.currentTarget);
    setMenuInvoice(invoice);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuInvoice(null);
  };

  // alerta
  const showAlert = (msg, severity = 'success') =>
    setAlert({ open: true, message: msg, severity });


  // ================================================================
  // 🔥 CONVERTE ARRAY DE PARAMS → MAPA PARA USO INTERNO
  // ================================================================
  const transitionMap = useMemo(() => {
    if (!Array.isArray(actionsByTransition)) return {};
    const map = {};
    actionsByTransition.forEach(stepObj => {
      map[stepObj.step] = stepObj;
    });
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

  // ================================================================
  // 🔥 STEPS DESTINO (novo modelo)
  // ================================================================
  const toSteps = useMemo(() => {
    return config?.to_step?.map(t => t.step) || [];
  }, [config]);

  const currentTransition = config?.to_step?.find(t => t.step === toStep) || {};
  const possibleActions = currentTransition.action || [];
  const possibleUsers = currentTransition.user || [];


  // ================================================================
  // LOAD INVOICES
  // ================================================================
  const loadInvoices = async () => {
    if (!token || !step) return;
    setLoading(true);
    setFeedback('');

    try {
      const resp = await axios.get(`${API_URL}/api/contabil/nf/step/${step}`, {
        headers: { Authorization: `Bearer ${token}` }
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


  // ================================================================
  // LOAD COUNTS POR STEP
  // ================================================================
  const computeStepCount = arr => {
    if (!Array.isArray(arr)) return 0;
    const hasTotalItems = arr.some(i => typeof i.total_items === 'number');
    if (hasTotalItems) return arr.reduce((s, i) => s + (i.total_items || 0), 0);
    return arr.length;
  };

  const loadCounts = async () => {
    if (!token || !steps.length) return;
    setCountsLoading(true);

    try {
      const promises = steps.map(s =>
        axios.get(`${API_URL}/api/contabil/nf/step/${s}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(r => ({ step: s, items: Array.isArray(r.data) ? r.data : [] }))
          .catch(() => ({ step: s, items: [] }))
      );

      const results = await Promise.all(promises);
      const obj = {};

      results.forEach(r => {
        obj[r.step] = computeStepCount(r.items);
      });

      setStepCounts(obj);

    } catch (err) {
      setStepCounts({});
    } finally {
      setCountsLoading(false);
    }
  };


  useEffect(() => { loadInvoices(); }, [token, step, refresh]);
  useEffect(() => { loadCounts(); }, [token, steps, refresh]);


  // ================================================================
  // OPEN UPDATE
  // ================================================================
  const openUpdate = inv => {
    setSelectedInvoice(inv);
    setInvoiceKey(inv.invoice_key || '');
    setToStep('');
    setMessage('');
    setToUserId('');
    setNote('');

    setDialogOpen(true);
  };


  // ================================================================
  // SUBMIT UPDATE
  // ================================================================
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

      if (onDataChange) onDataChange();
      window.dispatchEvent(new Event('invoicesUpdated'));

      showAlert(`NF ${selectedInvoice.invoice_key} atualizada com sucesso!`);

    } catch (err) {
      console.error(err);
      showAlert('Erro ao atualizar NF.', 'error');
    }
  };


  // ================================================================
  // CREATE INVOICE (PORTARIA)
  // ================================================================
  const handleCreateInvoice = async () => {
    if (!newInvoiceKey.trim()) return showAlert('Informe a chave.', 'warning');

    try {
      await axios.post(`${API_URL}/api/contabil/nf`, {
        user_id: user?.id,
        invoice_key: newInvoiceKey.trim(),
        current_step: 'portaria',
        to_user_id: newUser || null,
        message: newAction || null,
        note: newNote || null,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setCreateDialogOpen(false);
      setNewInvoiceKey('');
      setNewNote('');
      setNewAction('');
      setNewUser('');

      await loadInvoices();
      await loadCounts();

      if (onDataChange) onDataChange();
      window.dispatchEvent(new Event('invoicesUpdated'));

      showAlert('NF registrada na portaria com sucesso!');

    } catch (err) {
      showAlert(err.response?.data?.error || 'Erro ao registrar NF.', 'error');
    }
  };


  // ================================================================
  // LOGS
  // ================================================================
  const openLogsDialog = async inv => {
    setSelectedInvoice(inv);
    setLogs([]);
    setLogsLoading(true);
    setLogsDialogOpen(true);

    try {
      const resp = await axios.get(`${API_URL}/api/contabil/nf/${inv.id}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(Array.isArray(resp.data) ? resp.data : []);

    } catch (err) {
      showAlert('Erro ao carregar logs.', 'error');
    } finally {
      setLogsLoading(false);
    }
  };


  // ================================================================
  // NF DETALHES
  // ================================================================
  const handleOpenNFDetails = async invKey => {
    setNfDetailDialogOpen(true);
    setNfDetailLoading(true);
    setNfSaam(null);
    setNfErp([]);
    setNfCount(null);

    try {
      const resp = await axios.get(`${API_URL}/api/contabil/nf/saam/${invKey}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNfSaam(resp.data?.saam?.nf || null);
      setNfErp(resp.data?.erp?.nf || null);
      setNfCount(resp.data?.count?.count || null);

    } catch (err) {
      setNfDetailDialogOpen(false);
      showAlert('Erro ao carregar detalhes.', 'error');
    } finally {
      setNfDetailLoading(false);
    }
  };


  const handlePrint = async (inv) => {
    try {
      setNfDetailLoading(true);

      const resp = await axios.get(`${API_URL}/api/contabil/nf/saam/${inv.invoice_key}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const saam = resp.data?.saam?.nf || null;
      const erp = resp.data?.erp?.nf || null;

      if (!saam) {
        showAlert("NF não encontrada para impressão.", "error");
        return;
      }

      //InvoicePrint
      window.dispatchEvent(
        new CustomEvent("invoicePrint", {
          detail: {
            nfSaam: saam,
            items: erp?.itens || [],
            mode: step
          }
        })
      );

    } catch (err) {
      console.error(err);
      showAlert("Erro ao carregar dados para impressão", "error");
    } finally {
      setNfDetailLoading(false);
    }
  };


  // ================================================================
  // START COUNT
  // ================================================================
  const startCount = async invoiceId => {
    try {
      await axios.post(
        `${API_URL}/api/contabil/nf/${invoiceId}/contagem`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/estoque/contagem/${invoiceId}`);

    } catch (err) {
      navigate(`/estoque/contagem/${invoiceId}`);
      showAlert('Erro ao iniciar contagem.', 'error');
    }
  };


  // ================================================================
  // CLOSE INVOICE
  // ================================================================
  const openConfirmClose = inv => {
    setInvoiceToClose(inv);
    setConfirmCloseOpen(true);
  };

  const confirmCloseInvoice = async () => {
    try {
      await axios.put(`${API_URL}/api/contabil/nf/close/${invoiceToClose.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setConfirmCloseOpen(false);
      setInvoiceToClose(null);

      await loadInvoices();
      await loadCounts();

      if (onDataChange) onDataChange();
      window.dispatchEvent(new Event('invoicesUpdated'));

      showAlert(`NF ${invoiceToClose.invoice_key} finalizada.`);

    } catch (err) {
      showAlert('Erro ao finalizar NF.', 'error');
    }
  };

  const printMode = step; // step já vem da InvoiceFiscalPage ou outra página

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <Box sx={{ maxWidth: 1300, mx: 'auto', mt: 2 }}>

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

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={loadInvoices}>Atualizar</Button>

        {allowCreate && (
          <Button variant="outlined" onClick={() => setCreateDialogOpen(true)}>
            Nova NF
          </Button>
        )}
      </Paper>


      {/* ========================== TABELA =========================== */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : invoices.length ? (
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
                <TableCell align="center">
                  Ação
                </TableCell>

              </TableRow>
            </TableHead>

            <TableBody>
              {invoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.id}</TableCell>
                  <TableCell>{inv.invoice_key}</TableCell>
                  <TableCell>{inv.message}</TableCell>
                  <TableCell>{inv.user_name}</TableCell>
                  <TableCell>{inv.total_logs}</TableCell>
                  <TableCell>{inv.updated_at ? new Date(inv.updated_at).toLocaleString('pt-BR') : '-'}</TableCell>

                  <TableCell align="center">
                    <IconButton onClick={(e) => openMenu(e, inv)}>
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

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        keepMounted
      >
        {/* NF Details */}
        {allowInvoice && (
          <MenuItem onClick={() => { handleOpenNFDetails(menuInvoice.invoice_key); closeMenu(); }}>
            Ver NF
          </MenuItem>
        )}

        {/* Logs */}
        {allowLogs && (
          <MenuItem onClick={() => { openLogsDialog(menuInvoice); closeMenu(); }}>
            Logs
          </MenuItem>
        )}

        {/* Atualizar */}
        {allowUpdate && (
          <MenuItem onClick={() => { openUpdate(menuInvoice); closeMenu(); }}>
            Atualizar
          </MenuItem>
        )}

        {/* Iniciar Contagem */}
        {allowCount && (
          <MenuItem onClick={() => { startCount(menuInvoice.id); closeMenu(); }}>
            Iniciar Contagem
          </MenuItem>
        )}

        {/* Fechar */}
        {allowClose && (
          <MenuItem onClick={() => { openConfirmClose(menuInvoice); closeMenu(); }}>
            Fechar NF
          </MenuItem>
        )}

        {/* Impressão */}
        {allowPrint && (
          <MenuItem onClick={() => { handlePrint(menuInvoice); closeMenu(); }}>
            Imprimir
          </MenuItem>
        )}

      </Menu>

      {/* ==============================================================
          DIALOGOS
      ============================================================== */}

      {/* CREATE */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth>
        <DialogTitle>Registrar NF na Portaria</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          <TextField
            label="Chave"
            fullWidth
            value={newInvoiceKey}
            onChange={(e) => setNewInvoiceKey(e.target.value)}
          />

          {/* Nova NF pega primeiro destino de portaria, se existir */}
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
                      onChange={(e) => setNewAction(e.target.value)}
                      label="Ação"
                    >
                      <MenuItem value="">(automatic)</MenuItem>
                      {actions.map(a => (
                        <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {users.length > 0 && (
                  <FormControl fullWidth>
                    <InputLabel>Responsável</InputLabel>
                    <Select
                      value={newUser}
                      onChange={(e) => setNewUser(e.target.value)}
                      label="Responsável"
                    >
                      <MenuItem value="">(automatic)</MenuItem>
                      {users.map(u => (
                        <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
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
          <Button variant="contained" onClick={handleCreateInvoice}>Registrar</Button>
        </DialogActions>
      </Dialog>


      {/* UPDATE */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
        <DialogTitle>Atualizar NF #{selectedInvoice?.id}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          <TextField label="Chave NF" fullWidth value={invoiceKey} disabled />

          <FormControl fullWidth>
            <InputLabel>Etapa Destino</InputLabel>
            <Select
              value={toStep}
              onChange={e => {
                setToStep(e.target.value);
                setMessage('');
                setToUserId('');
              }}
              label="Etapa Destino"
            >
              <MenuItem value="">Selecione</MenuItem>
              {toSteps.map(s => {
                const obj = config.to_step.find(t => t.step === s);
                return <MenuItem key={s} value={s}>{obj.label || s}</MenuItem>;
              })}
            </Select>
          </FormControl>

          {/* Actions */}
          {possibleActions.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Ação</InputLabel>
              <Select value={message} onChange={e => setMessage(e.target.value)} label="Ação">
                {possibleActions.map(a => (
                  <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Users */}
          {possibleUsers.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Responsável</InputLabel>
              <Select
                value={toUserId}
                onChange={e => setToUserId(e.target.value)}
                label="Responsável"
              >
                {possibleUsers.map(u => (
                  <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            label="Observação"
            multiline
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
          />

        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmitUpdate}>Confirmar</Button>
        </DialogActions>
      </Dialog>


      {/* LOGS */}
      <Dialog open={logsDialogOpen} onClose={() => setLogsDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Logs da NF</DialogTitle>
        <DialogContent dividers>

          {logsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
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
                {logs.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>{l.created_at ? new Date(l.created_at).toLocaleString() : '-'}</TableCell>
                    <TableCell>{l.user_name}</TableCell>
                    <TableCell>{l.from_step ? `${l.from_step} → ${l.to_step}` : l.to_step}</TableCell>
                    <TableCell>{l.message}</TableCell>
                    <TableCell>{l.to_user_name || '-'}</TableCell>
                    <TableCell>{l.note || '-'}</TableCell>
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
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                  <Tab label="SAAM" />
                  <Tab label="ERP" />
                  <Tab label="Contagem" />
                </Tabs>
              </Box>

              {/* SAAM */}
              {tab === 0 && nfSaam && (
                <Box sx={{
                  display: 'flex', flexDirection: 'column', gap: 2
                }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography><b>Emitente:</b> {nfSaam.nome_emitente}</Typography>
                    <Typography><b>CNPJ:</b> {nfSaam.cnpj_emitente}</Typography>
                    <Typography><b>Nº Nota:</b> {nfSaam.numero_nota}</Typography>
                    <Typography><b>Data Emissão:</b> {new Date(nfSaam.data_emissao).toLocaleDateString('pt-BR')}</Typography>
                    <Typography><b>Status:</b> {nfSaam.status}</Typography>
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
                      {nfSaam.itens?.map((it, idx) => (
                        <TableRow key={idx}>
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography><b>Filial:</b> {nfErp.filial}</Typography>
                    <Typography><b>Nº:</b> {nfErp.numero}</Typography>
                    <Typography><b>Fornecedor:</b> {nfErp.fornecedor}</Typography>
                    <Typography><b>Série:</b> {nfErp.serie}</Typography>
                    <Typography><b>Data:</b> {nfErp.data_emissao}</Typography>
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
                      {nfErp.itens?.map((it, idx) => (
                        <TableRow key={idx}>
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography><b>ID:</b> {nfCount.id}</Typography>
                    <Typography><b>Status:</b> {nfCount.status}</Typography>
                    <Typography><b>Divergências:</b> {nfCount.matched ? 'OK' : 'Com divergências'}</Typography>
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
                      {nfCount.itens?.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{it.item_number}</TableCell>
                          <TableCell>{it.description}</TableCell>
                          <TableCell>{it.codigo}</TableCell>
                          <TableCell>{it.qty_counted}</TableCell>
                          <TableCell
                            style={{ color: it.is_matched ? 'green' : 'red', fontWeight: 'bold' }}
                          >
                            {it.is_matched ? '✔' : '✘'}
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
            Deseja realmente finalizar a NF {invoiceToClose?.invoice_key}?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmCloseOpen(false)}>Cancelar</Button>

          <Button color="error" variant="contained" onClick={confirmCloseInvoice}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <InvoicePrint />

      <AppAlert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
      />

    </Box>
  );
}
