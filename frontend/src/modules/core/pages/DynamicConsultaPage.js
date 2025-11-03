import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, TextField, Button, Paper, CircularProgress, Alert
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import DynamicResumo from '../components/DynamicResumo';
import DynamicAbas from '../components/DynamicAbas';

const API_URL = process.env.REACT_APP_API_URL;

export default function DynamicConsultaPage({ moduleKey, pageKey }) {
  const params = useParams();
  const navigate = useNavigate();
  const { token, variables = [] } = useAuth();

  const codFilial = variables.find(v => v.key === 'filial_padrao')?.value || '0101';
  const idParam = params.produto || params.sc || params.sa || params.id || '';

  const [query, setQuery] = useState(idParam || '');
  const [config, setConfig] = useState(null);
  const [dados, setDados] = useState({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const fetchedOnMount = useRef(false);

  // =========================================================
  // 1️⃣ Carrega a definição da página (lista de queries)
  // =========================================================
  useEffect(() => {
    const loadPageDefinition = async () => {
      if (!token || !pageKey) return;

      try {
        const resp = await axios.get(`${API_URL}/api/queries/page/${pageKey}`, {
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
        console.error('❌ Erro ao carregar definição da página:', err);
        setConfig(null);
        setErro('Erro ao carregar configuração da página.');
      }
    };

    loadPageDefinition();
  }, [pageKey, token]);

  // =========================================================
  // 2️⃣ Executa as queries (dados da página)
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

    setLoading(true);
    setErro('');

    try {
      const resp = await axios.post(
        `${API_URL}/api/queries/page/${pageKey}`,
        { codProduto: valor, codFilial },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp.data?.success) {
        setDados(resp.data.data || {});
      } else {
        setDados({});
        setErro(resp.data?.message || 'Nenhum registro encontrado.');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar dados:', err);
      setDados({});
      setErro('Erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 3️⃣ Busca automática se tiver ID na URL
  // =========================================================
  useEffect(() => {
    if (query && config && !fetchedOnMount.current) {
      buscarDados(query);
      fetchedOnMount.current = true;
    }
  }, [query, config]);

  // =========================================================
  // 4️⃣ Buscar/Navegar
  // =========================================================
  const buscarOuNavegar = () => {
    if (!query) {
      setErro('Informe um código para consulta.');
      return;
    }
    buscarDados(query);
  };

  // =========================================================
  // 5️⃣ Define query principal e infoData
  // =========================================================
  const infoKey = config?.queries?.find(q => q.is_main)?.key;
  const infoData = infoKey ? (dados[infoKey]?.[0] || {}) : {};

  // =========================================================
  // Renderização
  // =========================================================
  return (
    <Box sx={{ maxWidth: 1900, mx: 'auto', mt: 4 }}>
      {/* 🔍 Busca */}
      <Paper
        sx={{
          p: { xs: 1, sm: 2 },
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: 'center',
        }}
      >
        <TextField
          label="Buscar por código"
          variant="outlined"
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
      </Paper>

      {/* ⏳ Loading */}
      {loading && (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ⚠️ Erro */}
      {erro && !loading && <Alert severity="error" sx={{ my: 2 }}>{erro}</Alert>}

      {/* 🧾 Resumo principal */}
      {!loading && infoKey && <DynamicResumo info={infoData} />}

      {/* 📊 Abas dinâmicas */}
      {!loading && config?.queries?.length > 0 && (
        <DynamicAbas queries={config.queries} data={dados} />
      )}
    </Box>
  );
}
