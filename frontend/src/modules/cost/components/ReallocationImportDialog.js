import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Button, TextField, Grid, Alert, IconButton, Paper,
  Table, TableBody, TableCell, TableHead, TableRow
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

import * as XLSX from "xlsx";

export default function ReallocationCreateDialog({
  open,
  onClose,
  onSaveHeader,
  onSaveItems,
  templateUrl
}) {

  // HEADER FIELDS
  const [header, setHeader] = useState({
    branch: "",
    issue_date: "",
    justification: "",
    type: "PCO",
    spreadsheet: ""
  });

  const handleHeaderChange = (field, value) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
  };

  // ITENS IMPORTADOS
  const [items, setItems] = useState([]);

  // DOWNLOAD DO TEMPLATE
  const handleDownloadTemplate = () => {
    window.open(templateUrl, "_blank");
  };

  // UPLOAD PLANILHA
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      // Ajuste de campos esperados pela API
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

  // EDIÇÃO INLINE
  const handleChangeItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // SALVAR PARCIAL
  const handleSavePartial = async () => {
    try {
      const h = await onSaveHeader(header);
      if (items.length > 0) {
        await onSaveItems(h.id, items);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar. Veja o console.");
    }
  };


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        Nova Realocação de Saldos
      </DialogTitle>

      <DialogContent dividers>

        {/* FORM HEADER */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Filial"
                fullWidth
                value={header.branch}
                onChange={(e) => handleHeaderChange("branch", e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                type="date"
                label="Data Emissão"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={header.issue_date}
                onChange={(e) => handleHeaderChange("issue_date", e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Tipo (PCO/FCO)"
                fullWidth
                value={header.type}
                onChange={(e) => handleHeaderChange("type", e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Planilha (nome Protheus)"
                fullWidth
                value={header.spreadsheet}
                onChange={(e) => handleHeaderChange("spreadsheet", e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Justificativa"
                multiline
                minRows={2}
                fullWidth
                value={header.justification}
                onChange={(e) => handleHeaderChange("justification", e.target.value)}
              />
            </Grid>

          </Grid>
        </Box>

        {/* TEMPLATE DOWNLOAD */}
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" onClick={handleDownloadTemplate}>
            Baixar Template Excel
          </Button>
        </Box>

        {/* UPLOAD PLANILHA */}
        <Box sx={{ mb: 3 }}>
          <input type="file" accept=".xlsx" onChange={handleImportExcel} />

          {items.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {items.length} itens importados da planilha.
            </Alert>
          )}
        </Box>

        {/* GRID EDITÁVEL */}
        {items.length > 0 && (
          <Paper sx={{ mt: 2 }}>
            <Table size="small">
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
                </TableRow>
              </TableHead>

              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        value={item.item_date}
                        onChange={(e) => handleChangeItem(idx, "item_date", e.target.value)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        value={item.balance_type}
                        onChange={(e) => handleChangeItem(idx, "balance_type", e.target.value)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        value={item.entry_type}
                        onChange={(e) => handleChangeItem(idx, "entry_type", e.target.value)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        value={item.cost_center}
                        onChange={(e) => handleChangeItem(idx, "cost_center", e.target.value)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        value={item.account}
                        onChange={(e) => handleChangeItem(idx, "account", e.target.value)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        value={item.class}
                        onChange={(e) => handleChangeItem(idx, "class", e.target.value)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        value={item.operation}
                        onChange={(e) => handleChangeItem(idx, "operation", e.target.value)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        value={item.accounting_item}
                        onChange={(e) => handleChangeItem(idx, "accounting_item", e.target.value)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <TextField
                        type="number"
                        value={item.value}
                        onChange={(e) => handleChangeItem(idx, "value", e.target.value)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSavePartial}
        >
          Salvar Parcial
        </Button>
      </DialogActions>
    </Dialog>
  );
}
