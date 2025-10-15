import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, TextField, Button, Paper,
  Typography, Tabs, Tab, CircularProgress, Alert, Badge
} from '@mui/material';
import SCResumo from '../components/SCResumo';
import TabelaAtributos from '../components/TabelaAtributos';

const API_URL = process.env.REACT_APP_N8N_URL + '/get_sc';
const BASIC_USER = process.env.REACT_APP_BASIC_USER;
const BASIC_PASS = process.env.REACT_APP_BASIC_PASS;
const basicAuth = 'Basic ' + btoa(`${BASIC_USER}:${BASIC_PASS}`);

const abas = [
  { label: 'Itens da SC', key: 'sc_itens' },
  { label: 'Aprovação', key: 'aprovacao' }
];

export default function ConsultaSCPage() {
  const { sc } = useParams();
  const navigate = useNavigate();
  const fetchedOnMount = useRef(false);
  
  const [query, setQuery] = useState(sc || '');
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (sc && !fetchedOnMount.current) {
      buscarSC(sc);
      fetchedOnMount.current = true;
    }
  }, [sc]);

  useEffect(() => {
    setQuery(sc || '');
    if (!sc) {
      setDados(null);
      setErro('');
      fetchedOnMount.current = false;
    }
  }, [sc]);

  const buscarSC = async (valor) => {
    if (!valor) {
      setErro('Informe um número de SC');
      setDados(null);
      return;
    }

    setLoading(true);
    setErro('');
    setDados(null);

    try {
      const resp = await axios.get(API_URL, {
        headers: {
          sc: valor,
          Authorization: basicAuth,
        }
      });

      if (resp.data && resp.data.length > 0) {
        setDados(resp.data[0]);
      } else {
        setErro('SC não encontrada.');
      }
    } catch (err) {
      setErro('Erro ao buscar SC.');
    }
    setLoading(false);
  };

  const buscarOuNavegar = () => {
    if (!query) {
      setErro('Informe um número de SC');
      setDados(null);
      return;
    }

    if (query !== sc) {
      navigate(`/suprimentos/consulta-sc/${query}`);
    } else {
      buscarSC(query);
    }
  };

  // Função para quantidade de itens em cada aba
  const getBadgeCount = (key) => {
    return dados && Array.isArray(dados[key]) ? dados[key].length : 0;
  };

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
          label="Buscar por número da SC"
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
          <SCResumo info={dados.info_sc} />
          
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
              <TabelaAtributos dados={dados[abas[tab].key]} />
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
