import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, TextField, Button, Paper,
  Typography, Tabs, Tab, CircularProgress, Alert, Badge
} from '@mui/material';
import ProdutoResumo from '../components/ProdutoResumo';
import TabelaAtributos from '../components/TabelaAtributos';

const API_URL = process.env.REACT_APP_N8N_URL + '/get_produto';
const BASIC_USER = process.env.REACT_APP_BASIC_USER;
const BASIC_PASS = process.env.REACT_APP_BASIC_PASS;
const basicAuth = 'Basic ' + btoa(`${BASIC_USER}:${BASIC_PASS}`);

const abas = [
  { label: 'Estoques', key: 'estoque' },
  { label: 'Endereços', key: 'endereco' },
  { label: 'Lotes', key: 'lote' },
  { label: 'SA', key: 'sa' },
  { label: 'SC', key: 'sc' },
  { label: 'PC', key: 'pc' },
];

export default function ConsultaProduto() {
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
      const resp = await axios.get(API_URL, {
        headers: {
          produto: valor,
          Authorization: basicAuth,
        }
      });
      if (resp.data && resp.data.length > 0) setDados(resp.data[0]);
      else setErro('Produto não encontrado.');
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
          <ProdutoResumo info={dados.info_produto} />

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
            {abas.map((aba, idx) => (
              <Tab
                key={aba.key}
                sx={{
                  minWidth: 150,       // aumente conforme necessário
                  px: 4,               // padding horizontal maior
                  maxWidth: 300,
                  fontWeight: 500,
                  fontSize: '1.05rem',
                  // Deixe o texto em uma linha só:
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
              <TabelaAtributos dados={dados[abas[tab].key]} />
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
