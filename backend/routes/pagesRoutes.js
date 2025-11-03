const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getPages, getPageByKey, getPageQueries } = require('../services/pageService');
const { getQueryByKey, executeDynamicQuery } = require('../services/queriesService');

// =======================================================
// 🔹 GET /api/pages → Lista todas as páginas
// =======================================================
router.get('/', verifyToken, async (req, res) => {
  try {
    const pages = await getPages();
    res.json({ success: true, data: pages });
  } catch (err) {
    console.error('Erro ao listar páginas:', err);
    res.status(500).json({ success: false, message: 'Erro ao listar páginas' });
  }
});

// =======================================================
// 🔹 GET /api/pages/:pageKey → Busca uma página e suas queries
// =======================================================
router.get('/:pageKey', verifyToken, async (req, res) => {
  try {
    const { pageKey } = req.params;
    const page = await getPageByKey(pageKey);
    if (!page)
      return res
        .status(404)
        .json({ success: false, message: 'Página não encontrada' });

    const queries = await getPageQueries(pageKey);
    res.json({
      success: true,
      data: { ...page, queries },
    });
  } catch (err) {
    console.error('Erro ao buscar página:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar página' });
  }
});

// =======================================================
// 🔹 POST /api/pages/run-query
// Executa uma query cadastrada no banco, com parâmetros
// =======================================================
router.post('/run-query', verifyToken, async (req, res) => {
  try {
    const { queryKey, params = {} } = req.body;

    if (!queryKey)
      return res
        .status(400)
        .json({ success: false, message: 'queryKey é obrigatório' });

    // Busca a query pelo key
    const queryDef = await getQueryByKey(queryKey);
    if (!queryDef)
      return res
        .status(404)
        .json({ success: false, message: 'Query não encontrada' });

    // Executa no banco correspondente
    const result = await executeDynamicQuery(queryDef, params);

    res.json({
      success: true,
      data: result.data || [],
      meta: {
        rowsAffected: result.rowsAffected || 0,
        db: queryDef.db,
        queryKey: queryKey,
      },
    });
  } catch (err) {
    console.error('❌ Erro ao executar query dinâmica:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar query dinâmica',
      details: err.message,
    });
  }
});

module.exports = router;
