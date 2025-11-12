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
  const [variables, setVariables] = useState([]);
  const [variableDefs, setVariableDefs] = useState([]);
  const [variableMap, setVariableMap] = useState({});
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVarDialog, setShowVarDialog] = useState(false);
  const [savingVars, setSavingVars] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;

  // ======================================================
  // 🔑 Inicialização — carrega token e usuário
  // ======================================================
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserInfo(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // ======================================================
  // 🔍 Buscar informações do usuário logado
  // ======================================================
  const fetchUserInfo = async (jwtToken = token) => {
    try {
      setLoading(true);

      const resp = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      if (!resp.data?.success) throw new Error('Erro ao consultar /api/users/me');
      const data = resp.data.data;

      setUser({
        id: data.id,
        username: data.username,
        name: data.name,
        email: data.email,
        user_level: data.user_level,
        ad_account: data.ad_account,
        last_login: data.last_login,
        is_active: data.is_active,
      });

      setVariables(data.variables || []);
      setModules(data.modules || []);

      // 🔧 Variáveis globais
      const defsResp = await axios.get(`${API_URL}/api/variables`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      const defs = (defsResp.data.data || []).map(v => ({
        id: v.id,
        key: v.key || `var_${v.id}`,
        description: v.variable_description || v.description || v.key,
        options: v.options || [],
      }));
      setVariableDefs(defs);

      // 🗺️ Mapa de variáveis efetivas
      const userVarMap = {};
      (data.variables || []).forEach(v => {
        userVarMap[v.variable_id] = v.value;
      });

      const varMap = {};
      defs.forEach(def => {
        varMap[def.key] = userVarMap[def.id] || '';
      });

      setVariableMap(varMap);
    } catch (err) {
      console.error('❌ Erro ao carregar informações do usuário:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // 🔐 Login
  // ======================================================
  const login = async ({ token }) => {
    if (!token) return;
    localStorage.setItem('token', token);
    setToken(token);
    await fetchUserInfo(token);
  };

  // ======================================================
  // 🚪 Logout
  // ======================================================
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setVariables([]);
    setModules([]);
    setVariableDefs([]);
    setVariableMap({});
    setShowVarDialog(false);
    window.location.href = '/login';
  };

  // ======================================================
  // 💾 Salvar variáveis do usuário
  // ======================================================
  const saveUserVariables = async (localVars) => {
    if (!user?.id) return;
    setSavingVars(true);

    try {
      const updates = Object.entries(localVars).map(([variable_id, value]) => ({
        variable_id: parseInt(variable_id, 10),
        value,
      }));

      await axios.post(`${API_URL}/api/users/variables`, { variables: updates }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowVarDialog(false);
      setTimeout(() => fetchUserInfo(), 300);
    } catch (err) {
      console.error('❌ Erro ao salvar variáveis do usuário:', err);
    } finally {
      setSavingVars(false);
    }
  };

  // ======================================================
  // 🔒 Verificação de permissão de módulo (corrigida)
  // ======================================================
  const hasModuleAccess = (moduleKey) => {
    if (!user) return false;
    if (parseInt(user.user_level, 10) === 9 || user.user_level === 'admin') return true;
    if (!modules || modules.length === 0) return false;

    const key = (moduleKey || '').toLowerCase();
    const allowedModules = modules
      .filter(m => m?.module_key)
      .map(m => m.module_key.toLowerCase());

    return allowedModules.includes(key);
  };

  // ======================================================
  // 🧱 Modal de preferências
  // ======================================================
  const VariableDialog = () => {
    const [localVars, setLocalVars] = useState({});
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
      if (!showVarDialog) return;
      const init = {};
      (variables || []).forEach(v => {
        init[v.variable_id] = v.value;
      });
      setLocalVars(init);
      setDirty(false);
    }, [variables, showVarDialog]);

    const handleChange = (variable_id, value) => {
      setLocalVars(prev => ({ ...prev, [variable_id]: value }));
      setDirty(true);
    };

    const handleSave = async () => {
      await saveUserVariables(localVars);
      setDirty(false);
    };

    return (
      <Dialog open={showVarDialog} fullWidth maxWidth="sm">
        <DialogTitle>Preferências do Usuário</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Escolha as opções padrão que serão utilizadas nas telas do sistema.
          </Typography>
          {variableDefs.map(def => (
            <Box key={def.id} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {def.description || `Variável ${def.id}`}
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={localVars[def.id] || ''}
                  onChange={e => handleChange(def.id, e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Selecione</em>
                  </MenuItem>
                  {(def.options || []).map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.description || opt.value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ))}
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
        modules,
        variables,
        variableDefs,
        variableMap,
        login,
        logout,
        refetchUser: fetchUserInfo,
        setShowVarDialog,
        hasModuleAccess,
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
