const express = require('express');
const router = express.Router();

// Serviços
const { 
  getUserVariablesEffective, 
  upsertUserVariable, 
  deleteUserVariable 
} = require('../services/userVariablesService');

const { getVariable } = require('../services/globalVariablesService'); // para validar opções válidas

// 🔐 Função para pegar o username do token JWT (ou do body em ambiente de teste)
function getUsernameFromToken(req) {
  return req.user?.username || req.body.username || 'anonimo';
}

// ================================================
//  GET /api/user-vars
//  Retorna as variáveis do usuário (com fallback no default global)
// ================================================
router.get('/', async (req, res) => {
  try {
    const username = getUsernameFromToken(req);
    const vars = await getUserVariablesEffective(username);
    res.json({ success: true, data: vars });
  } catch (err) {
    console.error('Erro ao listar variáveis do usuário:', err);
    res.status(500).json({ success: false, error: 'Erro ao listar variáveis' });
  }
});

// ================================================
//  POST /api/user-vars
//  Cria ou atualiza variável do usuário
// ================================================
router.post('/', async (req, res) => {
  try {
    const username = getUsernameFromToken(req);
    const { key, value, description } = req.body;

    // ✅ 1. Busca as opções válidas dessa variável global
    const globalVar = await getVariable(key);

    // ✅ 2. Valida se o valor enviado está entre as opções permitidas
    const isValid = globalVar?.options?.some(opt => opt.value === value);

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Valor não permitido para essa variável' });
    }

    // ✅ 3. Faz o upsert (insert/update)
    const result = await upsertUserVariable({ username, key, value, description });

    // ✅ 4. Retorna a variável atualizada
    res.json({ success: true, data: result });

  } catch (err) {
    console.error('Erro ao salvar variável do usuário:', err);
    res.status(500).json({ success: false, error: 'Erro ao salvar variável' });
  }
});

// ================================================
//  DELETE /api/user-vars/:key
//  Remove uma variável do usuário
// ================================================
router.delete('/:key', async (req, res) => {
  try {
    const username = getUsernameFromToken(req);
    const key = req.params.key;
    await deleteUserVariable(username, key);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao remover variável do usuário:', err);
    res.status(500).json({ success: false, error: 'Erro ao remover variável' });
  }
});

module.exports = router;
