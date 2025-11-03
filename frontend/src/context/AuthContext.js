import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  FormControl, Select, MenuItem, Typography, CircularProgress, Box
} from '@mui/material';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [variables, setVariables] = useState([]);        // Variáveis do usuário
  const [definitions, setDefinitions] = useState([]);    // Definições globais
  const [globalVars, setGlobalVars] = useState([]);      // Valores e opções
  const [variableMap, setVariableMap] = useState({});    // key → value
  const [loading, setLoading] = useState(true);

  const [showVarDialog, setShowVarDialog] = useState(false);
  const [tempVars, setTempVars] = useState({});
  const [savingVars, setSavingVars] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;

  // 🧭 Carrega token salvo e busca informações
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserInfo(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // 🔍 Carrega todas as informações do usuário e sistema
  const fetchUserInfo = async (jwtToken = token) => {
    try {
      // 1️⃣ Dados do usuário
      const resp = await axios.get(`${API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (!resp.data?.success) throw new Error('Resposta inválida de /api/me');

      const data = resp.data.data;
      setUser({
        username: data.username,
        permissions: data.permissions,
        adGroups: data.adGroups,
      });
      setVariables(data.variables || []);
      setVariableMap(data.variablesObject || {});

      // 2️⃣ Definições de variáveis
      const defsResp = await axios.get(`${API_URL}/api/variable-definitions`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setDefinitions(defsResp.data.data || []);

      // 3️⃣ Variáveis globais com opções
      const globalsResp = await axios.get(`${API_URL}/api/global-vars`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setGlobalVars(globalsResp.data.data || []);

      // 4️⃣ Verifica se faltam variáveis obrigatórias
      const userKeys = new Set((data.variables || []).map(v => v.key));
      const missingDefs = (defsResp.data.data || []).filter(d => !userKeys.has(d.key) && d.active);
      if (missingDefs.length > 0) {
        console.log('⚙️ Variáveis obrigatórias faltando — abrindo popup...');
        setShowVarDialog(true);
      }
    } catch (err) {
      console.error('Erro ao carregar /api/me:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Login
  const login = async ({ token }) => {
    localStorage.setItem('token', token);
    setToken(token);
    await fetchUserInfo(token);
  };

// 🚪 Logout: limpa tudo e redireciona
const logout = () => {
  try {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setVariables([]);
    setVariableMap({});
    setShowVarDialog(false);

    // Redireciona para o login
    window.location.href = '/login';
  } catch (err) {
    console.error('Erro ao executar logout:', err);
  }
};

  // 💾 Salva variáveis do usuário
  const saveUserVariables = async (localVars) => {
    setSavingVars(true);
    try {
      const updates = Object.entries(localVars).map(([key, value]) =>
        axios.post(`${API_URL}/api/user-vars`, { key, value }, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      await Promise.all(updates);
      await fetchUserInfo();
      setShowVarDialog(false);
    } catch (err) {
      console.error('Erro ao salvar variáveis:', err);
    } finally {
      setSavingVars(false);
    }
  };

  // 🧱 Dialog de configuração
  const VariableDialog = () => {
    const [localVars, setLocalVars] = useState(tempVars);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
      const map = {};
      (variables || []).forEach(v => (map[v.key] = v.value));
      setLocalVars(map);
      setDirty(false);
    }, [showVarDialog]);

    const handleChange = (key, value) => {
      setLocalVars(prev => {
        const updated = { ...prev, [key]: value };
        setDirty(JSON.stringify(updated) !== JSON.stringify(tempVars));
        return updated;
      });
    };

    const handleSave = async () => {
      await saveUserVariables(localVars);
      setDirty(false);
    };

    return (
      <Dialog open={showVarDialog} fullWidth maxWidth="sm">
        <DialogTitle>Definir Preferências do Usuário</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Escolha as opções padrão que serão utilizadas nas telas do sistema.
          </Typography>
          {definitions.filter(d => d.active).map(def => {
            const global = globalVars.find(g => g.key === def.key);
            const options = global?.options || [];
            return (
              <Box key={def.key} sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  {def.description}
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={localVars[def.key] || ''}
                    onChange={e => handleChange(def.key, e.target.value)}
                  >
                    {options.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.description || opt.value}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={logout} color="error">Sair</Button>
          <Button onClick={() => setShowVarDialog(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={!dirty || savingVars}>
            {savingVars ? 'Salvando...' : 'Salvar e Continuar'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Carregando autenticação...
        </Typography>
      </Box>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        variables,
        variableMap,
        definitions,
        globalVars,
        login,
        logout,
        refetchUser: fetchUserInfo,
        setShowVarDialog
      }}
    >
      {children}
      {showVarDialog && <VariableDialog />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
