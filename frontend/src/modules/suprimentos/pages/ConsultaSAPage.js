import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, TextField, Button, Paper,
  Tabs, Tab, CircularProgress, Alert, Badge
} from '@mui/material';
import SAResumo from '../components/SAResumo';
import TabelaAtributos from '../components/TabelaAtributos';
import { useAuth } from '../../../context/AuthContext';


const API_URL = process.env.REACT_APP_API_URL + '/api/suprimento/consulta-sa/';
const abas = [
  { label: 'Itens da SA', key: 'itens' }
];

export default function ConsultaSAPage() {
  const { token } = useAuth();
  const { sa } = useParams();
  const navigate = useNavigate();
  const fetchedOnMount = useRef(false);

  const [query, setQuery] = useState(sa || '');
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (sa && !fetchedOnMount.current) {
      buscarSA(sa);
      fetchedOnMount.current = true;
    }
  }, [sa]);

  useEffect(() => {
    setQuery(sa || '');
    if (!sa) {
      setDados(null);
      setErro('');
      fetchedOnMount.current = false;
    }
  }, [sa]);

  const buscarSA = async (valor) => {
    if (!valor) {
      setErro('Informe o número da SA');
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

      if (resp.data && resp.data.success){
        setDados(resp.data);
      } else {
        setErro('SA não encontrada.');
      }
 
    } catch (err) {
      setErro('Erro ao buscar SA.');
    }
    setLoading(false);
  };

  const buscarOuNavegar = () => {
    if (!query) {
      setErro('Informe o número da SA');
      setDados(null);
      return;
    }
    if (query !== sa) {
      navigate(`/suprimentos/consulta-sa/${query}`);
    } else {
      buscarSA(query);
    }
  };

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
          label="Buscar por número da SA"
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
          <SAResumo info={dados.info} />

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
            <TabelaAtributos dados={dados[abas[tab].key]} />
          </Paper>
        </>
      )}
    </Box>
  );
}
