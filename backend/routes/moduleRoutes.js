// routes/moduleRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getAllModules } = require('../services/moduleService');

/**
 * GET /api/modules
 * Retorna todos os módulos ativos e suas páginas
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const modules = await getAllModules();
    res.json({ success: true, data: modules });
  } catch (err) {
    console.error('❌ Erro ao buscar módulos:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar módulos',
      error: err.message,
    });
  }
});

module.exports = router;
