import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, TextField, Button, Paper,
  Typography, Tabs, Tab, CircularProgress, Alert, Badge
} from '@mui/material';
import ProdutoResumo from '../components/ProdutoResumo';
import TabelaAtributos from '../components/TabelaAtributos';
import { useAuth } from '../../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL + '/api/suprimento/consulta-produto/';
const abas = [
  { label: 'Estoques', key: 'estoque' },
  { label: 'Endereços', key: 'endereco' },
  { label: 'Lotes', key: 'lote' },
  { label: 'SA', key: 'sa' },
  { label: 'SC', key: 'sc' },
  { label: 'PC', key: 'pc' },
  { label: 'Kardex', key: 'kardex' },
];

export default function ConsultaProduto() {
  
  const { token } = useAuth();
  const { produto } = useParams();
  const navigate = useNavigate();
  const fetchedOnMount = useRef(false);
  const [query, setQuery] = useState(produto || '');
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (produto && !fetchedOnMount.current) {
      buscarProduto(produto);
      fetchedOnMount.current = true;
    }
  }, [produto]);

  useEffect(() => {
    setQuery(produto || '');
    if (!produto) {
      setDados(null);
      setErro('');
      fetchedOnMount.current = false;
    }
  }, [produto]);

  const buscarProduto = async (valor) => {
    if (!valor) {
      setErro('Informe um código de produto');
      setDados(null);
      return;
    }
    setLoading(true);
    setErro('');
    setDados(null);
    try {
      const resp = await axios.get(`${API_URL}${valor}`, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Bearer token no header
        }
      });
      if (resp.data && resp.data.success) {
        setDados(resp.data);
      } else {
        setErro('Produto não encontrado.');
      }
    } catch (err) {
      setErro('Erro ao buscar produto.');
    }
    setLoading(false);
  };

  const buscarOuNavegar = () => {
    if (!query) {
      setErro('Informe um código de produto');
      setDados(null);
      return;
    }
    if (query !== produto) {
      navigate(`/suprimentos/consulta-produto/${query}`);
    } else {
      buscarProduto(query);
    }
  };

  // Função para quantidade de itens em cada aba
  const getBadgeCount = key =>
    dados && Array.isArray(dados[key]) ? dados[key].length : 0;

  // 🔍 Filtra abas conforme tipo do produto
  const abasFiltradas = dados?.info?.tipo_produto === 'SV'
    ? abas.filter(a => !['sa', 'estoque', 'endereco', 'lote'].includes(a.key))
    : abas;

  // 🔒 Garante que o índice da aba ativa seja válido
  useEffect(() => {
    if (tab >= abasFiltradas.length) setTab(0);
  }, [abasFiltradas, tab]);

  return (
    <Box sx={{ maxWidth: 1900, mx: 'auto', mt: 4 }}>
      <Paper
        sx={{
          p: { xs: 1, sm: 2 }, mb: 3, display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' }, gap: 2,
          alignItems: 'center'
        }}
      >
        <TextField
          label="Buscar por produto"
          variant="outlined"
          size="small"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => (e.key === 'Enter' ? buscarOuNavegar() : undefined)}
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

      {loading && (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {erro && <Alert severity="error" sx={{ my: 2 }}>{erro}</Alert>}

      {dados && (
        <>
          <ProdutoResumo info={dados.info} />

          <Tabs
            value={tab}
            onChange={(e, v) => setTab(v)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{
              mb: 2,
              '& .MuiTab-root': { fontWeight: 500, fontSize: '1rem' },
              bgcolor: '#f4f8fb'
            }}
          >
            {abasFiltradas.map((aba, idx) => (
              <Tab
                key={aba.key}
                sx={{
                  minWidth: 150,
                  px: 4,
                  maxWidth: 300,
                  fontWeight: 500,
                  fontSize: '1.05rem',
                  textTransform: 'none'
                }}
                label={
                  <Badge
                    color="primary"
                    badgeContent={getBadgeCount(aba.key)}
                    invisible={getBadgeCount(aba.key) === 0}
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        right: -20,
                        top: 0,
                        fontSize: '0.7em',
                        minWidth: 18,
                        height: 18
                      }
                    }}
                  >
                    {aba.label}
                  </Badge>
                }
              />
            ))}
          </Tabs>

          <Paper
            sx={{
              p: 1,
              width: '100%',
              maxWidth: '100vw',
              mb: 5,
              background: '#fcfcfc',
              boxShadow: '0 2px 9px -8px #444'
            }}
          >
            <Box
              sx={{
                width: '100%',
                overflowX: 'auto',
                '& table': { minWidth: 600 },
                '&::-webkit-scrollbar': { height: 8 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#e0e0e0' }
              }}
            >
              <TabelaAtributos dados={dados[abasFiltradas[tab].key]} />
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
