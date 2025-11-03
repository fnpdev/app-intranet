// routes/erpRoutes.js
const express = require('express');
const router = express.Router();
const suprimentosController = require('../controllers/suprimentosController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Todas as rotas requerem autenticação
router.use(verifyToken);

// Rotas de produtos
router.get('/consulta-produto/:codigo', suprimentosController.getConsultaProdutoPage);
router.get('/consulta-sa/:codigo', suprimentosController.getConsultaSAPage);
router.get('/consulta-sc/:codigo', suprimentosController.getConsultaSCPage);

module.exports = router;
