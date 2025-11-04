import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
  const { token, variables = [] } = useAuth();

  const codFilial = variables.find(v => v.key === 'filial_padrao')?.value || '0101';

  // aceita vários nomes de param da URL
  const idParam = params.produto || params.sc || params.sa || params.id || '';
  const [codBusca, setCodBusca] = useState(idParam || '');
  const [config, setConfig] = useState(null);
  const [dados, setDados] = useState({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const fetchedOnMount = useRef(false);

  // --- Carrega definição da página (depende de token)
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
        console.error('Erro ao carregar definição da página:', err);
        setConfig(null);
        setErro('Erro ao carregar configuração da página.');
      }
    };

    loadPageDefinition();
  }, [pageKey, token]);

  // --- Função de busca: usa explicitamente o body com codBusca e o header Authorization
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
      // <-- corpo e headers exatamente como você esperava
      const resp = await axios.post(
        `${API_URL}/api/queries/page/${pageKey}`,
        { codBusca: valor, codFilial },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.debug('Resposta buscaDados:', resp.data);

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

  // --- Se o cod vem da URL, atualiza o campo e tenta buscar automaticamente
  useEffect(() => {
    // sempre mantemos o valor do campo sincronizado com params
    if (idParam && idParam !== codBusca) {
      setCodBusca(idParam);
      fetchedOnMount.current = false; // forçar nova busca quando param muda
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam]);

  // --- Run automática: só quando temos token, config e codBusca e ainda não buscou
  useEffect(() => {
    if (!fetchedOnMount.current && codBusca && config && token) {
      buscarDados(codBusca);
      fetchedOnMount.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codBusca, config, token]);

  const buscarOuNavegar = () => {
    if (!codBusca) {
      setErro('Informe um código para consulta.');
      return;
    }
    buscarDados(codBusca);
  };

    // =========================================================
  // 5️⃣ Define query principal (is_main) e demais queries
  // =========================================================
  const mainQuery = config?.queries?.find(q => q.is_main);
  const otherQueries = config?.queries?.filter(q => !q.is_main) || [];
  const mainData = mainQuery ? (dados[mainQuery.key]?.[0] || {}) : {};

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
          label="Código de busca"
          variant="outlined"
          size="small"
          value={codBusca}
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
      {!loading && mainQuery && <DynamicResumo info={mainData} />}

      {/* 📊 Abas dinâmicas */}
      {!loading && otherQueries.length > 0 && (
        <DynamicAbas
          queries={otherQueries}
          data={dados}
        />
      )}
    </Box>
  );

}
