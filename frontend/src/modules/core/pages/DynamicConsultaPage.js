import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Box, TextField, Button, Paper, CircularProgress, Alert, Typography
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import DynamicResumo from '../components/DynamicResumo';
import DynamicAbas from '../components/DynamicAbas';

const API_URL = process.env.REACT_APP_API_URL;

export default function DynamicConsultaPage({ moduleKey, pageKey }) {
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
  const [activeTab, setActiveTab] = useState(null); // aba selecionada
  const fetchedOnMount = useRef(false);

  // =========================================================
  // 🔧 Carrega configuração da página
  // =========================================================
  useEffect(() => {
    const loadPageDefinition = async () => {
      if (!token || !pageKey) return;

      try {
        const resp = await axios.get(`${API_URL}/api/pages/queries/${pageKey}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resp.data?.success && resp.data.data) {
          setConfig(resp.data.data);
          setErro('');
        } else {
          setConfig(null);
          setErro('Página não encontrada ou sem configuração.');
        }
      } catch (err) {
        console.error('Erro ao carregar definição da página:', err);
        setConfig(null);
        setErro('Erro ao carregar configuração da página.');
      }
    };

    loadPageDefinition();
  }, [pageKey, token]);

  // =========================================================
  // 🧹 Limpa variáveis sempre que a página for carregada/trocada
  // =========================================================
  useEffect(() => {
    setCodBusca('');
    setDados({});
    setErro('');
    fetchedOnMount.current = false;
  }, [pageKey]);

  // =========================================================
  // 🔄 Monta payload dinâmico a partir das variáveis
  // =========================================================
  const montarPayload = (valorBusca) => {
    const payload = {};
    variables.forEach((v) => {
      if (v?.key) payload[v.key] = v.value ?? null;
    });
    if (valorBusca) payload.varBusca = valorBusca;
    if (user) {
      payload.username = user.username;
      payload.userlevel = user.user_level;
    }
    return payload;
  };

  // =========================================================
  // 🔍 Buscar dados
  // =========================================================
  const buscarDados = async (valor) => {
    if (!valor) {
      setErro('Informe um código válido.');
      return;
    }
    if (!pageKey || !config) {
      setErro('Página não configurada.');
      return;
    }
    if (!token) {
      setErro('Usuário não autenticado.');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const payload = montarPayload(valor);

      const resp = await axios.post(
        `${API_URL}/api/pages/queries/${pageKey}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp.data?.success) {
        setDados(resp.data.data || {});
      } else {
        setDados({});
        setErro(resp.data?.message || 'Nenhum registro encontrado.');
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setDados({});
      setErro('Erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 🔁 Se houver param "id" (rota ou query) na URL, popula o campo
  // =========================================================
  useEffect(() => {
    if (idParam && idParam !== varBusca) {
      setCodBusca(idParam);
      fetchedOnMount.current = false;
    }
  }, [idParam]);

  // =========================================================
  // 🚀 Busca automática ao montar (quando aplicável)
  // =========================================================
  useEffect(() => {
    if (!fetchedOnMount.current && varBusca && config && token) {
      buscarDados(varBusca);
      fetchedOnMount.current = true;
    }
  }, [varBusca, config, token]);

  // =========================================================
  // 🧭 Acionamento manual - atualiza URL e executa busca
  // =========================================================
  const buscarOuNavegar = () => {
    if (!varBusca) {
      setErro('Informe um código para consulta.');
      return;
    }

    const pathParts = location.pathname.split('/').filter(Boolean);
    // pathParts = ["consulta", "sc-codigo"] ou ["consulta", "sc-codigo", "030738"]

    // Sempre manter:
    // pathParts[0] -> "consulta"
    // pathParts[1] -> pagePath real ("sc-codigo")

    let newPath = "";

    if (pathParts.length === 2) {
      // Sem ID → adiciona ID
      newPath = `/${pathParts[0]}/${pathParts[1]}/${encodeURIComponent(varBusca)}`;
    } else if (pathParts.length >= 3) {
      // Com ID → substitui ID
      newPath = `/${pathParts[0]}/${pathParts[1]}/${encodeURIComponent(varBusca)}`;
    } else {
      // fallback improvável
      newPath = `/consulta/${pageKey}/${encodeURIComponent(varBusca)}`;
    }

    navigate(newPath);
    buscarDados(varBusca);
  };

  // =========================================================
  // 🖨️ Impressão
  // =========================================================
  const imprimirConsulta = () => {
    if (!dados || !config) {
      alert('Nenhum dado disponível para impressão.');
      return;
    }

    const mainQuery = config?.queries?.find(q => q.is_main);
    const mainData = mainQuery ? (dados[mainQuery.key]?.[0] || {}) : {};
    const otherQueries = config?.queries?.filter(q => !q.is_main) || [];

    // Pega a aba ativa
    const abaAtiva = activeTab || (otherQueries.length ? otherQueries[0].key : null);
    const dadosAbaAtiva = abaAtiva ? dados[abaAtiva] || [] : [];

    // Monta o conteúdo da impressão
    const html = `
      <html>
        <head>
          <title>Impressão da Consulta</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1, h2 { margin-bottom: 8px; }
            table { border-collapse: collapse; width: 100%; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 13px; }
            th { background: #f5f5f5; }
            .resumo { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Consulta: ${config?.page_description || pageKey}</h1>

          <div class="resumo">
            <h2>Resumo</h2>
            <table>
              <tbody>
                ${Object.entries(mainData).map(([key, val]) => `
                  <tr><th>${key}</th><td>${val ?? ''}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${abaAtiva
        ? `
              <div class="abas">
                <h2>Aba: ${abaAtiva}</h2>
                ${dadosAbaAtiva.length
          ? `
                      <table>
                        <thead>
                          <tr>${Object.keys(dadosAbaAtiva[0]).map(k => `<th>${k}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                          ${dadosAbaAtiva.map(row => `
                            <tr>${Object.values(row).map(v => `<td>${v ?? ''}</td>`).join('')}</tr>
                          `).join('')}
                        </tbody>
                      </table>
                    `
          : '<p>Nenhum dado encontrado nesta aba.</p>'
        }
              </div>
            `
        : ''
      }
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // =========================================================
  // 🧩 Queries principais
  // =========================================================
  const mainQuery = config?.queries?.find(q => q.is_main);
  const otherQueries = config?.queries?.filter(q => !q.is_main) || [];
  const mainData = mainQuery ? (dados[mainQuery.key]?.[0] || {}) : {};

  // =========================================================
  // 🧱 Renderização
  // =========================================================
  return (
    <Box sx={{ maxWidth: 1900, mx: 'auto', mt: 4 }}>
      {/* 🔍 Barra de ações */}
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
        <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
          <TextField
            label="Código de busca"
            variant="outlined"
            size="small"
            value={varBusca}
            onChange={(e) => setCodBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarOuNavegar()}
            sx={{ flex: 1, minWidth: 200 }}
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

        <Button
          variant="outlined"
          color="secondary"
          onClick={imprimirConsulta}
          sx={{ minWidth: 110, fontWeight: 600 }}
        >
          Imprimir
        </Button>
      </Paper>

      {loading && (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {erro && !loading && <Alert severity="error" sx={{ my: 2 }}>{erro}</Alert>}

      {!loading && mainQuery && <DynamicResumo info={mainData} />}

      {!loading && otherQueries.length > 0 && (
        <DynamicAbas
          queries={otherQueries}
          data={dados}
          onTabChange={setActiveTab} // pega a aba ativa
        />
      )}
    </Box>
  );
}
