//frontend\src\modules\accounting\pages\InvoiceBasePage.js
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Alert,
  Tabs, Tab   // 👈 ADICIONAR AQUI
} from '@mui/material';

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
    step,             // step atual (string) — obrigatório vindo da Page
    setStep,          // função para trocar step (passada pela Page)
    steps = [],       // lista de steps disponíveis
    actionsByTransition = {},
    onDataChange,
    refresh
  } = props;

  const navigate = useNavigate();
  const { token, user } = useAuth();

  // Config para o step atual (vem da página que monta actionsByTransition)
  const config = actionsByTransition[step] || {};

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

  // estados
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [tab, setTab] = useState(0);

  // dialogs
  const [dialogOpen, setDialogOpen] = useState(false);               // update step
  const [createDialogOpen, setCreateDialogOpen] = useState(false);   // new NF
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);       // logs
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);   // close confirm
  const [nfDetailDialogOpen, setNfDetailDialogOpen] = useState(false); // NF SAAM details

  // selected / payload
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceToClose, setInvoiceToClose] = useState(null);

  // fields update
  const [invoiceKey, setInvoiceKey] = useState('');
  const [toStep, setToStep] = useState('');
  const [message, setMessage] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [note, setNote] = useState('');

  // create fields
  const [newInvoiceKey, setNewInvoiceKey] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newAction, setNewAction] = useState('');
  const [newUser, setNewUser] = useState('');

  // logs states
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [nfSaam, setNfSaam] = useState(null);
  const [nfErp, setNfErp] = useState([]);
  const [nfCount, setNfCount] = useState(null);   //  🔥 NOVO
  const [nfDetailLoading, setNfDetailLoading] = useState(false);

  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const showAlert = (msg, severity = 'success') => setAlert({ open: true, message: msg, severity });

  // badge counts por step (opção C)
  const [stepCounts, setStepCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(false);

  // ================= HELPERS =================
  const computeStepCount = (arr) => {
    if (!Array.isArray(arr)) return 0;
    const hasTotalItems = arr.some(i => typeof i.total_items === 'number');
    if (hasTotalItems) return arr.reduce((s, i) => s + (i.total_items || 0), 0);
    return arr.length;
  };
  // ================= LOAD INVOICES (por step atual) =================
  const loadInvoices = async () => {
    if (!token || !step) return;
    setLoading(true);
    setFeedback('');
    try {
      const resp = await axios.get(`${API_URL}/contabil/nf/step/${encodeURIComponent(step)}`, {
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

  // ================= LOAD COUNTS (opção C badges) =================
  const loadCounts = async () => {
    if (!token || !Array.isArray(steps) || steps.length === 0) return;
    setCountsLoading(true);
    try {
      const promises = steps.map(s =>
        axios.get(`${API_URL}/contabil/nf/step/${encodeURIComponent(s)}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => ({ step: s, items: Array.isArray(r.data) ? r.data : [] }))
          .catch(err => {
            console.error(`Erro ao carregar step ${s}:`, err);
            return { step: s, items: [] };
          })
      );
      const results = await Promise.all(promises);
      const newCounts = {};
      results.forEach(r => {
        newCounts[r.step] = computeStepCount(r.items);
      });
      setStepCounts(newCounts);
    } catch (err) {
      console.error('Erro ao carregar contagens por step:', err);
      setStepCounts({});
    } finally {
      setCountsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, step, refresh]);

  useEffect(() => {
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, steps, refresh]);

  // ================= HELPERS - transições válidas =================
  const possibleToSteps = () =>
    Object.keys(config).filter((k) => typeof config[k] === 'object' && !!config[k]?.label);

  const currentTransition = config?.[toStep] || {};
  const possibleActions = currentTransition?.action || [];
  const possibleUsers = currentTransition?.user || [];

  // ================= UPDATE STEP (popup) =================
  const openUpdate = (inv) => {
    setSelectedInvoice(inv);
    setInvoiceKey(inv.invoice_key || '');
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
      await axios.put(`${API_URL}/contabil/nf/${selectedInvoice.id}/step`, {
        user_id: user?.id,
        to_step: toStep,
        to_user_id: toUserId || null,
        message: message || null,
        note: note || null,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setDialogOpen(false);
      await loadInvoices();
      await loadCounts();
      if (typeof onDataChange === 'function') onDataChange();
      window.dispatchEvent(new Event('invoicesUpdated'));
      showAlert(`NF ${selectedInvoice.invoice_key} atualizada com sucesso!`);
    } catch (err) {
      console.error(err);
      showAlert('Erro ao atualizar NF.', 'error');
    }
  };

  // ================= CREATE NF (Portaria) =================
  const handleCreateInvoice = async () => {
    if (!newInvoiceKey.trim()) return showAlert('Informe a chave da NF.', 'warning');
    try {
      await axios.post(`${API_URL}/contabil/nf`, {
        user_id: user?.id,
        invoice_key: newInvoiceKey.trim(),
        current_step: 'portaria',
        to_user_id: newUser || null,
        message: newAction || null,
        note: newNote || null,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setCreateDialogOpen(false);
      setNewInvoiceKey(''); setNewNote(''); setNewAction(''); setNewUser('');
      await loadInvoices();
      await loadCounts();
      if (typeof onDataChange === 'function') onDataChange();
      window.dispatchEvent(new Event('invoicesUpdated'));
      showAlert(`NF ${newInvoiceKey} registrada com sucesso na portaria!`);
    } catch (err) {
      console.error(err);
      showAlert('Erro ao registrar NF.', 'error');
    }
  };

  // ================= LOGS popup =================
  const openLogsDialog = async (inv) => {
    setSelectedInvoice(inv);
    setLogs([]); setLogsLoading(true); setLogsDialogOpen(true);
    try {
      const resp = await axios.get(`${API_URL}/contabil/nf/${inv.id}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      console.error(err);
      showAlert('Erro ao carregar logs da NF.', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  // ================= NF detalhes (SAAM) popup =================
  const handleOpenNFDetails = async (invoiceKeyParam) => {
    setNfDetailDialogOpen(true);
    setNfDetailLoading(true);
    setNfSaam(null);
    setNfCount(null);
    setNfErp([]);

    try {
      const resp = await axios.get(`${API_URL}/contabil/nf/saam/${invoiceKeyParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.data) {
        setNfSaam(resp.data.saam.nf || null);
        setNfErp(resp.data.erp.nf || null);
        setNfCount(resp.data.count?.count || null);
      } else {
        showAlert('NF não encontrada.', 'warning');
        setNfDetailDialogOpen(false);
      }

    } catch (err) {
      console.error(err);
      showAlert('Erro ao buscar dados da NF.', 'error');
      setNfDetailDialogOpen(false);
    } finally {
      setNfDetailLoading(false);
    }
  };


  // ================= START COUNT (pela tela de steps) =================
  const startCount = async (invoiceId) => {
    if (!token) return;
    try {
      // chama o backend para criar step + contagem
      const resp = await axios.post(`${API_URL}/contabil/nf/${invoiceId}/contagem`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // espera retorno com count_id e step_id
      const countId = resp.data?.data?.count_id;

      // redireciona para a página de contagem dedicada
      navigate(`/estoque/contagem/${invoiceId}`);
    } catch (err) {
      navigate(`/estoque/contagem/${invoiceId}`);
      console.error('Erro ao iniciar contagem:', err);
      const msg = err?.response?.data?.error || 'Erro ao iniciar contagem.';
      showAlert(msg, 'error');
    }
  };

  // ================= CLOSE NF =================
  const openConfirmClose = (inv) => {
    setInvoiceToClose(inv);
    setConfirmCloseOpen(true);
  };

  const confirmCloseInvoice = async () => {
    if (!invoiceToClose) return;
    try {
      await axios.put(`${API_URL}/contabil/nf/close/${invoiceToClose.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfirmCloseOpen(false);
      setInvoiceToClose(null);
      await loadInvoices();
      await loadCounts();
      if (typeof onDataChange === 'function') onDataChange();
      window.dispatchEvent(new Event('invoicesUpdated'));
      showAlert(`NF ${invoiceToClose.invoice_key} finalizada com sucesso!`);
    } catch (err) {
      console.error(err);
      showAlert('Erro ao finalizar NF.', 'error');
    }
  };

  // ================ RENDER ================
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
        <Button variant="contained" onClick={loadInvoices}>Atualizar Lista</Button>

        {allowCreate && (
          <Button variant="outlined" color="primary" onClick={() => setCreateDialogOpen(true)}>Nova NF</Button>
        )}

      </Paper>

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
                  <TableCell>{inv.updated_at ? new Date(inv.updated_at).toLocaleString('pt-BR') : '-'}</TableCell>
                  <TableCell align="center">
                    {allowInvoice && <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => handleOpenNFDetails(inv.invoice_key)}>NF</Button>}
                    {allowLogs && <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => openLogsDialog(inv)}>Logs</Button>}
                    {allowUpdate && <Button size="small" variant="contained" sx={{ mr: 1 }} onClick={() => openUpdate(inv)}>Atualizar</Button>}
                    {allowCount && <Button size="small" variant="contained" color="secondary" sx={{ mr: 1 }} onClick={() => startCount(inv.id)}>Iniciar Contagem</Button>}
                    {allowClose && <Button size="small" color="error" variant="outlined" onClick={() => openConfirmClose(inv)}>Fechar</Button>}
                    {allowPrint && <InvoicePrint nfSaam={nfSaam} items={nfErp?.itens || []} mode="fiscal" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">Nenhuma NF encontrada.</Alert>
      )}

      {/* Dialogs: manter os mesmos conteúdos que você já tinha, usando os estados acima */}

      {/* --- Create Dialog --- */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth>
        <DialogTitle>Registrar nova NF na Portaria</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Chave da NF" fullWidth value={newInvoiceKey} onChange={(e) => setNewInvoiceKey(e.target.value)} autoFocus />
          {/* actions/users para criação (usa config da portaria se existir) */}
          {(() => {
            const portariaTransition = actionsByTransition?.portaria?.fiscal || {};
            const actions = portariaTransition.action || [];
            const users = portariaTransition.user || [];
            return (
              <>
                {actions.length > 0 && (
                  <FormControl fullWidth>
                    <InputLabel>Ação</InputLabel>
                    <Select value={newAction} onChange={(e) => setNewAction(e.target.value)} label="Ação">
                      <MenuItem value="">(automatic)</MenuItem>
                      {actions.map(a => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
                {users.length > 0 && (
                  <FormControl fullWidth>
                    <InputLabel>Responsável</InputLabel>
                    <Select value={newUser} onChange={(e) => setNewUser(e.target.value)} label="Responsável">
                      <MenuItem value="">(automatic)</MenuItem>
                      {users.map(u => <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
              </>
            );
          })()}
          <TextField label="Observação" fullWidth multiline rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateInvoice}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      {/* --- Update Dialog --- */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
        <DialogTitle>Atualizar NF #{selectedInvoice?.id}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Chave da NF" fullWidth value={invoiceKey} disabled />
          <FormControl fullWidth>
            <InputLabel>Etapa Destino</InputLabel>
            <Select value={toStep} onChange={(e) => { setToStep(e.target.value); setMessage(''); setToUserId(''); }} label="Etapa Destino">
              <MenuItem value="">Selecione</MenuItem>
              {possibleToSteps().map(ts => {
                const stepCfg = config[ts] || {};
                const stepLabel = stepCfg.label || (ts.charAt(0).toUpperCase() + ts.slice(1));
                return <MenuItem key={ts} value={ts}>{stepLabel}</MenuItem>;
              })}
            </Select>
          </FormControl>

          {toStep && (config[toStep]?.action || []).length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Ação</InputLabel>
              <Select value={message} onChange={(e) => setMessage(e.target.value)} label="Ação">
                {(config[toStep].action || []).map(a => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
              </Select>
            </FormControl>
          )}

          {toStep && (config[toStep]?.user || []).length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Responsável</InputLabel>
              <Select value={toUserId} onChange={(e) => setToUserId(e.target.value)} label="Responsável">
                {(config[toStep].user || []).map(u => <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>)}
              </Select>
            </FormControl>
          )}

          <TextField label="Observação" fullWidth multiline rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmitUpdate}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      {/* --- Logs Dialog --- */}
      <Dialog open={logsDialogOpen} onClose={() => setLogsDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Histórico da NF {selectedInvoice?.invoice_key}</DialogTitle>
        <DialogContent dividers>
          {logsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
          ) : logs.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell><TableCell>Usuário</TableCell><TableCell>Etapas</TableCell><TableCell>Mensagem</TableCell><TableCell>Responsável</TableCell><TableCell>Observação</TableCell>
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
          ) : <Alert severity="info">Nenhum log encontrado.</Alert>}
        </DialogContent>
        <DialogActions><Button onClick={() => setLogsDialogOpen(false)}>Fechar</Button></DialogActions>
      </Dialog>

      {/* --- NF Detail Dialog --- */}
      <Dialog
        open={nfDetailDialogOpen}
        onClose={() => setNfDetailDialogOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Detalhes da NF</DialogTitle>

        <DialogContent dividers>

          {nfDetailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Abas */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                  <Tab label="SAAM" />
                  <Tab label="ERP" />
                  <Tab label="Contagem" />   {/* 🔥 NOVA ABA */}
                </Tabs>

              </Box>

              {/* =======================================================
            SAAM
        ======================================================== */}
              {tab === 0 && nfSaam && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography><b>Emitente:</b> {nfSaam.nome_emitente}</Typography>
                    <Typography><b>CNPJ:</b> {nfSaam.cnpj_emitente}</Typography>
                    <Typography><b>Nº Nota:</b> {nfSaam.numero_nota}</Typography>
                    <Typography><b>Data Emissão:</b> {new Date(nfSaam.data_emissao).toLocaleDateString('pt-BR')}</Typography>
                    <Typography><b>Status:</b> {nfSaam.status}</Typography>
                    <Typography><b>Natureza:</b> {nfSaam.natureza_operacao}</Typography>
                    <Typography><b>Observação:</b> {nfSaam.observacao}</Typography>
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

              {/* =======================================================
            ERP – agora tratado como OBJETO e não como ARRAY
        ======================================================== */}
              {tab === 1 && nfErp && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography><b>Filial:</b> {nfErp.filial}</Typography>
                    <Typography><b>Número:</b> {nfErp.numero}</Typography>
                    <Typography><b>Fornecedor:</b> {nfErp.fornecedor}</Typography>
                    <Typography><b>Série:</b> {nfErp.serie}</Typography>
                    <Typography><b>Data Emissão:</b> {nfErp.data_emissao}</Typography>
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

              {/* =======================================================
    ABA 3 – CONTAGEM
======================================================= */}
              {/* =======================================================
    ABA 3 – CONTAGEM
======================================================= */}
              {tab === 2 && nfCount && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                  {/* INFORMAÇÕES DA CONTAGEM */}
                  <Paper sx={{ p: 2 }}>
                    <Typography><b>ID Contagem:</b> {nfCount.id}</Typography>
                    <Typography><b>Status:</b> {nfCount.status}</Typography>

                    <Typography>
                      <b>Divergência:</b>{" "}
                      {nfCount.matched ? "Sem divergências" : "Com divergências"}
                    </Typography>

                    <Typography>
                      <b>Início:</b> {new Date(nfCount.created_at).toLocaleString("pt-BR")}
                    </Typography>

                    <Typography>
                      <b>Fim:</b> {new Date(nfCount.updated_at).toLocaleString("pt-BR")}
                    </Typography>
                  </Paper>

                  {/* TABELA DE ITENS CONTADOS */}
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
                            style={{ color: it.is_matched ? "green" : "red", fontWeight: "bold" }}
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



      {/* --- Confirm Close --- */}
      <Dialog open={confirmCloseOpen} onClose={() => setConfirmCloseOpen(false)}>
        <DialogTitle>Confirmar encerramento</DialogTitle>
        <DialogContent>
          <Typography>Deseja realmente finalizar a NF {invoiceToClose?.invoice_key}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCloseOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={confirmCloseInvoice}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      <AppAlert open={alert.open} message={alert.message} severity={alert.severity} onClose={() => setAlert(a => ({ ...a, open: false }))} />
    </Box>
  );
}
