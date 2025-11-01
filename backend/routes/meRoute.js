const express = require('express');
const router = express.Router();
const { getUserVariablesEffective } = require('../services/userVariablesService');

/**
 * GET /api/me
 * Retorna as informações do usuário autenticado + variáveis de contexto
 */
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const username = req.user.username;
    const permissions = req.user.permissions || {};
    const adGroups = req.user.adGroups || [];

    // 🔧 Carrega variáveis efetivas do usuário
    let userVariables = [];
    try {
      userVariables = await getUserVariablesEffective(username);
    } catch (err) {
      console.warn('⚠️ Erro ao carregar variáveis do usuário:', err.message);
    }

    // 🧩 Converte o array em objeto para acesso rápido no frontend
    const variablesObject = {};
    for (const v of userVariables) {
      variablesObject[v.key] = {
        value: v.value,
        description: v.description,
        isUserSet: v.is_user_set,
        hasDefault: v.has_default,
      };
    }

    // 🧠 Monta o payload completo
    const payload = {
      username,
      permissions,
      adGroups,
      variables: userVariables,
      variablesObject, // ✅ novo campo para o AuthContext e LayoutBase
    };

    return res.json({
      success: true,
      data: payload,
    });
  } catch (err) {
    console.error('❌ Erro ao processar /api/me:', err);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar informações do usuário',
    });
  }
});

module.exports = router;
