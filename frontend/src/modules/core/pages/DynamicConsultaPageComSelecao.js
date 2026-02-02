// frontend/src/modules/core/pages/DynamicConsultaPageComSelecao.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    Box, TextField, Button, Paper,
    CircularProgress, Alert, Divider, Typography
} from '@mui/material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import { useAuth } from '../../../context/AuthContext';
import DynamicResumo from '../components/DynamicResumo';
import DynamicAbasSelectable from '../components/DynamicAbasSelectable';
import { createRoot } from 'react-dom/client';
import { ReportProdutoCompleto } from '../reports/reportProdutoCompleto';   


const API_URL = process.env.REACT_APP_API_URL;

export default function DynamicConsultaPageComSelecao({ pageKey }) {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { token, user, variables = [] } = useAuth();

    const idParam = params.id || '';

    const [varBusca, setCodBusca] = useState('');
    const [config, setConfig] = useState(null);
    const [dados, setDados] = useState({});
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [activeTab, setActiveTab] = useState(null);
    const [selectedRows, setSelectedRows] = useState({});

    const fetchedOnMount = useRef(false);

    // =====================================================
    // Carrega configuração
    // =====================================================
    useEffect(() => {
        if (!token || !pageKey) return;

        axios.get(`${API_URL}/api/pages/queries/${pageKey}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(resp => {
            if (resp.data?.success) {
                setConfig(resp.data.data);
            } else {
                setErro('Página não configurada.');
            }
        }).catch(() => setErro('Erro ao carregar configuração.'));
    }, [pageKey, token]);

    useEffect(() => {
        setCodBusca('');
        setDados({});
        setErro('');
        setSelectedRows({});
        fetchedOnMount.current = false;
    }, [pageKey]);

    // =====================================================
    // Payload
    // =====================================================
    const montarPayload = (valorBusca) => {
        const payload = {};
        variables.forEach(v => payload[v.key] = v.value ?? null);
        payload.varBusca = valorBusca;
        payload.username = user?.username;
        payload.userlevel = user?.user_level;
        return payload;
    };
    const abrirRelatorioProduto = () => {
        if (!activeTab) {
            alert('Nenhuma aba selecionada.');
            return;
        }

        const indexes = selectedRows[activeTab] || [];
        const allRows = dados[activeTab] || [];

        if (!indexes.length) {
            alert('Selecione ao menos um item para gerar o relatório.');
            return;
        }

        const itensSelecionados = indexes
            .map(i => allRows[i])
            .filter(Boolean);

        if (!itensSelecionados.length) {
            alert('Nenhum item válido selecionado.');
            return;
        }

        const popup = window.open('', '_blank', 'width=1200,height=800');

        popup.document.write(`
        <html>
            <head>
                <title>Relatório de Produtos</title>
            </head>
            <body>
                <div id="root"></div>
            </body>
        </html>
    `);

        popup.document.close();

        const root = createRoot(popup.document.getElementById('root'));

        root.render(
            <ReportProdutoCompleto itens={itensSelecionados} usuario={user.username}  />
        );
    };
    

    // =====================================================
    // Buscar dados
    // =====================================================
    const buscarDados = async (valor) => {
        if (!valor) return setErro('Informe um código.');

        setLoading(true);
        setErro('');

        try {
            const resp = await axios.post(
                `${API_URL}/api/pages/queries/${pageKey}`,
                montarPayload(valor),
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (resp.data?.success) {
                setDados(resp.data.data || {});
                setSelectedRows({});
            } else {
                setErro(resp.data?.message || 'Nenhum dado encontrado.');
            }
        } catch {
            setErro('Erro ao buscar dados.');
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // Auto-busca por URL
    // =====================================================
    useEffect(() => {
        if (idParam && idParam !== varBusca) {
            setCodBusca(idParam);
            fetchedOnMount.current = false;
        }
    }, [idParam]);

    useEffect(() => {
        if (!fetchedOnMount.current && varBusca && config && token) {
            buscarDados(varBusca);
            fetchedOnMount.current = true;
        }
    }, [varBusca, config, token]);

    const buscarOuNavegar = () => {
        if (!varBusca) return setErro('Informe um código.');

        const parts = location.pathname.split('/').filter(Boolean);
        const newPath = `/${parts[0]}/${parts[1]}/${encodeURIComponent(varBusca)}`;

        navigate(newPath);
        buscarDados(varBusca);
    };

    // =====================================================
    // 🖨️ Impressão
    // =====================================================
    const imprimirConsulta = () => {
        if (!activeTab) return alert('Nenhuma aba selecionada.');

        const allRows = dados[activeTab] || [];
        const indexes = selectedRows[activeTab] || [];

        const rowsToPrint = indexes.length
            ? indexes.map(i => allRows[i]).filter(Boolean)
            : allRows;

        if (!rowsToPrint.length) return alert('Nenhuma linha para impressão.');

        const html = `
        <html>
            <head>
                <style>
                    body { font-family: Arial; padding: 20px; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ccc; padding: 6px; font-size: 13px; }
                    th { background: #f0f0f0; }
                </style>
            </head>
            <body>
                <h2>${config.page_description}</h2>
                <h3>Aba: ${activeTab}</h3>
                <table>
                    <thead>
                        <tr>
                            ${Object.keys(rowsToPrint[0]).map(k => `<th>${k}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsToPrint.map(r =>
            `<tr>${Object.values(r).map(v => `<td>${v ?? ''}</td>`).join('')}</tr>`
        ).join('')}
                    </tbody>
                </table>
            </body>
        </html>
        `;

        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
        w.print();
    };

    // =====================================================
    // 📤 Exportações
    // =====================================================
    const exportarExcelTodos = () => {
        if (!dados || !config) return alert('Nenhum dado para exportar.');

        const wb = XLSX.utils.book_new();

        const mainQuery = config.queries.find(q => q.is_main);
        if (mainQuery && dados[mainQuery.key]?.length) {
            XLSX.utils.book_append_sheet(
                wb,
                XLSX.utils.json_to_sheet(dados[mainQuery.key]),
                'Resumo'
            );
        }

        config.queries.filter(q => !q.is_main).forEach(q => {
            if (dados[q.key]?.length) {
                XLSX.utils.book_append_sheet(
                    wb,
                    XLSX.utils.json_to_sheet(dados[q.key]),
                    q.key.substring(0, 31)
                );
            }
        });

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout]), `consulta-${pageKey}-${varBusca}.xlsx`);
    };

    const exportarExcelSelecionados = () => {
        if (!activeTab) return alert('Nenhuma aba selecionada.');

        const indexes = selectedRows[activeTab] || [];
        if (!indexes.length) return alert('Nenhuma linha selecionada.');

        const rows = indexes.map(i => dados[activeTab][i]).filter(Boolean);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.json_to_sheet(rows),
            activeTab.substring(0, 31)
        );

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout]), `consulta-${pageKey}-${varBusca}-${activeTab}.xlsx`);
    };

    // =====================================================
    // 🧾 Relatórios (SIMPLES)
    // =====================================================
    const executarRelatorio = (report) => {
        console.log('Executar relatório:', report, 'Busca:', varBusca);
        alert(`Relatório "${report.description}" acionado`);
    };

    const mainQuery = config?.queries?.find(q => q.is_main);
    const otherQueries = config?.queries?.filter(q => !q.is_main) || [];
    const mainData = mainQuery ? (dados[mainQuery.key]?.[0] || {}) : {};

    // =====================================================
    // Render
    // =====================================================
    return (
        <Box sx={{ maxWidth: 1900, mx: 'auto', mt: 4 }}>
            <Paper
                sx={{
                    p: { xs: 1, sm: 2 },
                    mb: 3,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                {/* 🔹 LADO ESQUERDO — BUSCA (LEGADO) */}
                <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                    <TextField
                        label="Código de busca"
                        variant="outlined"
                        size="small"
                        value={varBusca}
                        onChange={(e) => setCodBusca(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && buscarOuNavegar()}
                        sx={{ flex: 1, minWidth: 220 }}
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={buscarOuNavegar}
                        sx={{ minWidth: 110, fontWeight: 600 }}
                    >
                        Buscar
                    </Button>
                </Box>

                {/* 🔹 LADO DIREITO — AÇÕES (LEGADO + RELATÓRIOS) */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={imprimirConsulta}
                        sx={{ minWidth: 110, fontWeight: 600 }}
                    >
                        Imprimir
                    </Button>

                    <Button
                        variant="outlined"
                        color="success"
                        onClick={exportarExcelTodos}
                        sx={{ minWidth: 150 }}
                    >
                        Exportar Excel
                    </Button>
                    {/* 🔹 NOVO — RELATÓRIOS */}
                    {config?.page?.reports?.length > 0 &&
                        config.page.reports.map((report, index) => (
                            <Button
                                key={index}
                                variant="outlined"
                                color="info"
                                onClick={abrirRelatorioProduto}
                                sx={{ minWidth: 120 }}
                            >
                                {report.description}
                            </Button>
                        ))}

                </Box>
            </Paper>


            {loading && <CircularProgress />}
            {erro && <Alert severity="error">{erro}</Alert>}

            {!loading && mainQuery && <DynamicResumo info={mainData} />}

            {!loading && otherQueries.length > 0 && (
                <DynamicAbasSelectable
                    queries={otherQueries}
                    data={dados}
                    onTabChange={setActiveTab}
                    selectedRows={selectedRows}
                    onSelectionChange={setSelectedRows}
                />
            )}
        </Box>
    );
}
