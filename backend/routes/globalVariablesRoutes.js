const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getAllGlobalVariables, getVariable } = require('../services/globalVariablesService');

// 🔐 Todas as rotas exigem token válido
router.use(verifyToken);

// 📋 GET /api/global-vars
router.get('/', async (req, res) => {
  try {
    const vars = await getAllGlobalVariables();
    res.json({ success: true, data: vars });
  } catch (err) {
    console.error('Erro ao listar variáveis globais:', err);
    res.status(500).json({ success: false, error: 'Erro ao listar variáveis globais' });
  }
});

// 📋 GET /api/global-vars/:key
router.get('/:key', async (req, res) => {
  try {
    const variable = await getVariable(req.params.key);
    if (!variable) {
      return res.status(404).json({ success: false, error: 'Variável não encontrada' });
    }
    res.json({ success: true, data: variable });
  } catch (err) {
    console.error('Erro ao buscar variável global:', err);
    res.status(500).json({ success: false, error: 'Erro ao buscar variável global' });
  }
});

module.exports = router;
