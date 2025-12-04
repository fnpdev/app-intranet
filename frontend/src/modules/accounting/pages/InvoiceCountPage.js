// frontend/src/modules/accounting/pages/InvoiceCountPage.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import AppAlert from '../../core/components/AppAlert';
import InvoicePrint from '../components/InvoicePrint';

const API_URL = process.env.REACT_APP_API_URL;

export default function InvoiceCountPage() {
  const { id: invoiceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const previousPage = location.state?.from || '/'; // ← página anterior
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const [invoice, setInvoice] = useState(null);
  const [countInfo, setCountInfo] = useState(null);
  const [items, setItems] = useState([]);

  // Dados NF SAAM
  const [nfSaam, setNfSaam] = useState(null);

  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const showAlert = (msg, severity = 'success') => setAlert({ open: true, message: msg, severity });

  // ============================================
  // 1 - Carregar invoice
  // ============================================
  const loadInvoice = async () => {
    try {
      const resp = await axios.get(`${API_URL}/api/contabil/nf/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const inv = resp.data;
      setInvoice(inv);

      // 🔥 Backend agora decide se pode contagem → frontend não bloqueia mais
      return true;

    } catch (err) {
      showAlert('Erro ao carregar NF.', 'error');
      navigate(previousPage);
      return false;
    }
  };

  // ============================================
  // 2 - Carregar contagem
  // ============================================
  const loadCount = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API_URL}/api/contabil/nf/${invoiceId}/contagem`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNfSaam(resp.data?.nf?.saam?.nf || resp.data?.saam?.nf || null);

      const count = resp.data;
      const itens = resp.data?.itens || [];

      if (!count) {
        showAlert('Contagem não iniciada.', 'warning');
        navigate(previousPage);
        return;
      }

      setCountInfo(count);
      setItems(itens);

    } catch (err) {
      console.error('Erro em loadCount():', err);
      showAlert('Erro ao carregar contagem.', 'error');
      navigate(previousPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const ok = await loadInvoice();
      if (ok) await loadCount();
    })();
  }, [invoiceId]);

  // ============================================
  // Atualizar quantidade
  // ============================================
  const handleUpdateQty = (item_id, qty) => {
    setItems(items.map(it => it.id === item_id ? { ...it, qty_counted: qty } : it));
  };

  // ============================================
  // Salvar Parcial
  // ============================================
  const handleSavePartial = async () => {
    setSaving(true);
    try {
      await Promise.all(
        items.map(it =>
          axios.put(
            `${API_URL}/api/contabil/nf/contagem/item/${it.id}`,
            { qty_counted: it.qty_counted },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      showAlert('Contagem salva parcialmente.');
      await loadCount();

    } catch {
      showAlert('Erro ao salvar contagem.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Finalizar Contagem
  // ============================================
  const handleFinalize = async () => {
    if (!countInfo) return;
    setFinalizing(true);

    try {
      await handleSavePartial();

      await axios.put(
        `${API_URL}/api/contabil/nf/contagem/${countInfo.id}/finalize`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showAlert('Contagem finalizada.');
      navigate(previousPage); // ← voltar para a página de origem

    } catch {
      showAlert('Erro ao finalizar contagem.', 'error');
    } finally {
      setFinalizing(false);
    }
  };

  // ============================================
  // Impressão
  // ============================================
  const handlePrintCount = async () => {
    if (nfSaam && items && items.length) {
      window.dispatchEvent(
        new CustomEvent("invoicePrint", {
          detail: { nfSaam, items, mode: "count" },
        })
      );
      return;
    }

    // fallback
    try {
      setLoading(true);

      const inv =
        invoice ||
        (await axios.get(`${API_URL}/api/contabil/nf/${invoiceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })).data;

      const invKey = inv?.invoice_key || null;

      if (!invKey) {
        showAlert("Chave da NF não disponível para impressão.", "error");
        return;
      }

      const resp = await axios.get(`${API_URL}/api/contabil/nf/saam/${invKey}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const saam = resp.data?.saam?.nf || null;
      setNfSaam(saam);

      window.dispatchEvent(
        new CustomEvent("invoicePrint", {
          detail: { nfSaam: saam, items, mode: "count" },
        })
      );

    } catch (err) {
      console.error(err);
      showAlert("Erro ao preparar impressão.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Render
  // ============================================
  if (loading || !countInfo)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Contagem da NF #{invoiceId}
      </Typography>

      {nfSaam && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Dados da NF (SAAM)</Typography>

          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Emitente</TableCell>
                <TableCell>{nfSaam.nome_emitente}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>CNPJ</TableCell>
                <TableCell>{nfSaam.cnpj_emitente}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Nº Nota</TableCell>
                <TableCell>{nfSaam.numero_nota}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                <TableCell>{new Date(nfSaam.data_emissao).toLocaleDateString('pt-BR')}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell>{nfSaam.status}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Natureza</TableCell>
                <TableCell>{nfSaam.natureza_operacao}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Observação</TableCell>
                <TableCell colSpan={3}>{nfSaam.observacao || "-"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography><b>ID Contagem:</b> {countInfo.id}</Typography>
        <Typography><b>Status:</b> {countInfo.status}</Typography>
        {typeof countInfo.matched !== 'undefined' && (
          <Typography><b>Resultado:</b> {countInfo.matched ? "Sem divergência" : "Com divergências"}</Typography>
        )}
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Codigo</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Part Number</TableCell>
              <TableCell>Unid. Medida</TableCell>
              <TableCell align="right">Qtd Contada</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.item_number}</TableCell>
                <TableCell>{it.codigo}</TableCell>
                <TableCell>{it.description}</TableCell>
                <TableCell>{it.ncm}</TableCell>
                <TableCell>{it.unidade}</TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={it.qty_counted ?? ""}
                    onChange={(e) =>
                      handleUpdateQty(
                        it.id,
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    sx={{ width: 120 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

        </Table>
      </TableContainer>

      {/* BOTÕES */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>

        <Button variant="outlined" color="info" onClick={handlePrintCount}>
          Imprimir
        </Button>

        <Button variant="outlined" onClick={() => navigate(previousPage)}>
          Voltar
        </Button>

        <Button variant="contained" disabled={saving} onClick={handleSavePartial}>
          {saving ? "Salvando..." : "Salvar Parcial"}
        </Button>

        <Button color="success" variant="contained" disabled={finalizing} onClick={handleFinalize}>
          {finalizing ? "Finalizando..." : "Finalizar Contagem"}
        </Button>
      </Box>

      <InvoicePrint />

      <AppAlert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert((a) => ({ ...a, open: false }))}
      />
    </Box>
  );
}
