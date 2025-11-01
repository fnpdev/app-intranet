import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  FormControl, Select, MenuItem, Typography, CircularProgress, Box
} from '@mui/material';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [variables, setVariables] = useState([]);       // array das variáveis do usuário
  const [variableMap, setVariableMap] = useState({});   // objeto { key: { value, description } }
  const [definitions, setDefinitions] = useState([]);   // 🔹 catálogo de variáveis globais
  const [globalVars, setGlobalVars] = useState([]);     // 🔹 valores padrão do sistema
  const [loading, setLoading] = useState(true);

  const [showVarDialog, setShowVarDialog] = useState(false);
  const [tempVars, setTempVars] = useState({});
  const [savingVars, setSavingVars] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;

  // 🧭 Carrega token salvo e busca dados do usuário
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserInfo(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // 🔍 Busca informações do usuário e variáveis
  const fetchUserInfo = async (jwtToken = token) => {
    try {
      // 1️⃣ /api/me → usuário e variáveis atuais
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
      setVariableMap({ ...data.variablesObject }); // ✅ reatividade garantida

      // 2️⃣ /api/variable-definitions → catálogo de variáveis
      const defsResp = await axios.get(`${API_URL}/api/variable-definitions`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setDefinitions(defsResp.data.data || []);

      // 3️⃣ /api/global-vars → valores globais do sistema
      // 🔸 agora o backend já devolve options como JSON
      const globalResp = await axios.get(`${API_URL}/api/global-vars`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setGlobalVars(globalResp.data.data || []); // ✅ não precisa mais de parse

      // 4️⃣ Define estado inicial para o popup
      const initialVars = {};
      (data.variables || []).forEach(v => {
        initialVars[v.key] = v.value;
      });
      setTempVars(initialVars);

      // 5️⃣ Verifica se há variáveis faltando
      const userKeys = new Set(Object.keys(initialVars));
      const missingDefs = defsResp.data.data.filter(d => !userKeys.has(d.key) && d.active);
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

  // 🚪 Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setVariables([]);
    setVariableMap({});
    setShowVarDialog(false);
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

      // 🔁 Atualiza o contexto com novos dados
      await fetchUserInfo();
      setShowVarDialog(false);
    } catch (err) {
      console.error('Erro ao salvar variáveis:', err);
    } finally {
      setSavingVars(false);
    }
  };

  // 🎨 Popup de definição de variáveis
  const VariableDialog = () => {
    const [localVars, setLocalVars] = useState(tempVars);
    const [dirty, setDirty] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);

    useEffect(() => {
      setLocalVars(tempVars);
      setDirty(false);
      setConfirmClose(false);
    }, [showVarDialog, tempVars]);

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

    const handleCancel = () => {
      if (dirty) setConfirmClose(true);
      else setShowVarDialog(false);
    };

    return (
      <>
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
            <Button onClick={handleCancel} color="inherit">Cancelar</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!dirty || savingVars}
            >
              {savingVars ? 'Salvando...' : 'Salvar e Continuar'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  };

  if (loading)
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Carregando autenticação...
        </Typography>
      </Box>
    );

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        variables,
        variableMap,
        definitions,
        login,
        logout,
        setShowVarDialog,
        refetchUser: fetchUserInfo,
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
