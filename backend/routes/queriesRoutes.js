const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getPageDefinition, executePageQueries } = require('../services/queriesService');

/**
 * 🔹 GET /api/queries/page/:pageKey
 * Retorna a estrutura da página (queries, layout etc)
 */
router.get('/page/:pageKey', verifyToken, async (req, res) => {
  try {
    const { pageKey } = req.params;
    const data = await getPageDefinition(pageKey);
    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ Erro ao buscar definição da página:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar definição da página',
      details: err.message,
    });
  }
});

/**
 * 🔹 POST /api/queries/page/:pageKey
 * Executa TODAS as queries associadas à página,
 * recebendo apenas os parâmetros no body.
 * Exemplo body:
 * {
 *   "codFilial": "0101",
 *   "codProduto": "100200"
 * }
 */
router.post('/page/:pageKey', verifyToken, async (req, res) => {
  try {
    const { pageKey } = req.params;
    const params = req.body || {};

    // Executa todas as queries dessa página com base no banco
    const result = await executePageQueries(pageKey, params);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('❌ Erro ao executar queries da página:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar queries da página',
      details: err.message,
    });
  }
});

module.exports = router;
