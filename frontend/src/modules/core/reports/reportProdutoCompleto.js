// frontend/src/modules/core/reports/reportProdutoCompleto.js

import React from 'react';
import { Box, Typography } from '@mui/material';

export function ReportProdutoCompleto({ itens, usuario }) {

    // 🔒 Normalização segura
    const rows = Array.isArray(itens) ? itens : [];

    if (rows.length === 0) {
        return (
            <Box p={3}>
                <Typography>Nenhum item selecionado.</Typography>
            </Box>
        );
    }

    // 🧾 Cabeçalho baseado no primeiro item
    const header = rows[0] || {};

    // 📅 Formata data YYYYMMDD → DD/MM/YYYY
    const formatDate = (v) =>
        v && v.length === 8
            ? `${v.substring(6, 8)}/${v.substring(4, 6)}/${v.substring(0, 4)}`
            : v || '';

    // 💰 Formatação monetária
    const formatMoney = (v) =>
        Number(v || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    // ➕ Totais
    const totalQtde = rows.reduce((s, r) => s + Number(r.qtde || 0), 0);
    const totalValor = rows.reduce((s, r) => s + Number(r.total || 0), 0);

    // 🕒 Data/Hora da impressão
    const dataImpressao = new Date().toLocaleString('pt-BR');

    return (
        <Box sx={{ p: 3, fontFamily: 'Arial' }}>
            <Typography variant="h5" gutterBottom>
                Relatório de Produtos
            </Typography>

            {/* 🔹 Cabeçalho */}
            <Box sx={{ mb: 2, fontSize: 13 }}>
                {header.numero && <div><b>NF:</b> {header.numero}</div>}
                {header.serie && <div><b>Série:</b> {header.serie}</div>}
                {header.filial && <div><b>Filial:</b> {header.filial}</div>}
                {header.fornecedor && <div><b>Fornecedor:</b> {header.fornecedor}</div>}
                {header.data_emissao && (
                    <div><b>Emissão:</b> {formatDate(header.data_emissao)}</div>
                )}
            </Box>

            {/* 🔹 Tabela */}
            <table
                width="100%"
                border="1"
                cellPadding="6"
                style={{
                    borderCollapse: 'collapse',
                    fontSize: 12
                }}
            >
                <thead style={{ background: '#f0f0f0' }}>
                    <tr>
                        <th>Item</th>
                        <th>Produto</th>
                        <th>Descrição</th>
                        <th>UM</th>
                        <th>Qtde</th>
                        <th>SA</th>
                        <th>SA Solic</th>
                        <th>SA Qtde</th>
                        <th>SC</th>
                        <th>SC Solic</th>
                        <th>SC Qtde</th>
                        <th>Qtde Entregue</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={idx}>
                            <td>{row.item ?? ''}</td>
                            <td>{row.produto ?? ''}</td>
                            <td>{row.produto_desc ?? ''}</td>
                            <td align="center">{row.unide_medida ?? ''}</td>
                            <td align="right">{row.qtde ?? ''}</td>
                            <td align="right">{row.sa}</td>
                            <td align="right">{row.sa_solicitante}</td>
                            <td align="right">{row.sa_qtde}</td>
                            <td align="right">{row.sc}</td>
                            <td align="right">{row.sc_solicitante}</td>
                            <td align="right">{row.sc_qtde}</td>
                            <td align="right"></td>
                        </tr>
                    ))}
                </tbody>

                {/* 🔹 Totais */}
                <tfoot>
                    <tr style={{ fontWeight: 'bold', background: '#fafafa' }}>
                        <td colSpan={4} align="right">Totais</td>
                        <td align="right">{totalQtde}</td>
                        <td />
                        <td align="right">{formatMoney(totalValor)}</td>
                    </tr>
                </tfoot>
            </table>

            {/* 🔹 Rodapé de auditoria */}
            <Box
                sx={{
                    mt: 3,
                    pt: 1,
                    borderTop: '1px solid #ccc',
                    fontSize: 11,
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                <div>
                    <b>Impresso por:</b> {usuario}
                </div>
                <div>
                    <b>Data/Hora:</b> {dataImpressao}
                </div>
            </Box>
        </Box>
    );
}
