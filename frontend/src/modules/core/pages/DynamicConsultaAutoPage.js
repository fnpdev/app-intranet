import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box, Button, Paper, CircularProgress, Alert
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import DynamicResumo from '../components/DynamicResumo';
import DynamicAbas from '../components/DynamicAbas';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * Página dinâmica sem campo de busca.
 * Executa a consulta automaticamente ao carregar e possui um botão "Atualizar".
 */
export default function DynamicConsultaAutoPage({ moduleKey, pageKey }) {
  const { token, user, variables = [] } = useAuth();

  const [config, setConfig] = useState(null);
  const [dados, setDados] = useState({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
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
  // 🔄 Monta payload dinâmico a partir das variáveis
  // =========================================================
  const montarPayload = () => {
    const payload = {};

    variables.forEach((v) => {
      if (v?.key) payload[v.key] = v.value ?? null;
    });

    if (user) {
      payload.username = user.username;
      payload.userlevel = user.user_level;
    }

    return payload;
  };

  // =========================================================
  // 🔍 Buscar dados
  // =========================================================
  const buscarDados = async () => {
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
      const payload = montarPayload();

      const resp = await axios.post(
        `${API_URL}/api/pages/queries/${pageKey}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.debug('🔹 Payload enviado:', payload);
      console.debug('🔹 Resposta buscaDados:', resp.data);

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
  // 🚀 Busca automática ao montar
  // =========================================================
  useEffect(() => {
    if (!fetchedOnMount.current && config && token) {
      buscarDados();
      fetchedOnMount.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, token]);

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
      {/* 🔄 Atualizar */}
      <Paper
        sx={{
          p: { xs: 1, sm: 2 },
          mb: 3,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={buscarDados}
          disabled={loading}
          sx={{ minWidth: 150, fontWeight: 600 }}
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
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
        <DynamicAbas queries={otherQueries} data={dados} />
      )}
    </Box>
  );
}
