const express = require('express');
const router = express.Router();
const {
  listDefinitions,
  createDefinition,
  updateDefinition,
  deactivateDefinition
} = require('../services/variableDefinitionsService');
const { verifyToken } = require('../middleware/authMiddleware');

// ✅ Lista todas as variáveis definidas
router.get('/', verifyToken, async (req, res) => {
  try {
    const data = await listDefinitions();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Erro ao listar variáveis definidas:', err);
    res.status(500).json({ success: false, error: 'Erro ao listar variáveis' });
  }
});

// 🆕 Cria ou atualiza uma variável
router.post('/', verifyToken, async (req, res) => {
  try {
    const def = await createDefinition(req.body);
    res.json({ success: true, data: def });
  } catch (err) {
    console.error('Erro ao criar variável global:', err);
    res.status(500).json({ success: false, error: 'Erro ao salvar variável' });
  }
});

// 🔄 Atualiza
router.put('/:key', verifyToken, async (req, res) => {
  try {
    const def = await updateDefinition({ key: req.params.key, ...req.body });
    res.json({ success: true, data: def });
  } catch (err) {
    console.error('Erro ao atualizar variável global:', err);
    res.status(500).json({ success: false, error: 'Erro ao atualizar variável' });
  }
});

// ❌ Desativa
router.delete('/:key', verifyToken, async (req, res) => {
  try {
    const def = await deactivateDefinition(req.params.key);
    res.json({ success: true, data: def });
  } catch (err) {
    console.error('Erro ao desativar variável global:', err);
    res.status(500).json({ success: false, error: 'Erro ao desativar variável' });
  }
});

module.exports = router;
