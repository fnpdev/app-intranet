// controllers/erpController.js
const consultaProdutoService = require('../services/suprimentos/consultaProdutoService');
const consultaSAService = require('../services/suprimentos/consultaSAService');
const consultaSCService = require('../services/suprimentos/consultaSCService');

class suprimentosController {
  /**
   * GET /api/erp/produtos
   * Lista produtos com filtros e paginação
   */
  async getConsultaProdutoPage(req, res) {
    try {
      const codigo = req.params.codigo;
      const result = await consultaProdutoService.consultaProdutoPage(codigo);

      if (result.success) {
        return res.json(result);
      }

      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
    } catch (error) {
      console.error('Erro no controller consultaProdutoService:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  async getConsultaSAPage(req, res) {
    try {
      const codigo = req.params.codigo;
      const result = await consultaSAService.consultaSAPage(codigo);

      if (result.success) {
        return res.json(result);
      }

      return res.status(404).json({
        success: false,
        message: 'SA não encontrado',
      });
    } catch (error) {
      console.error('Erro no controller consultaSAService:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  async getConsultaSCPage(req, res) {
    try {
      const codigo = req.params.codigo;
      const result = await consultaSCService.consultaSCPage(codigo);

      if (result.success) {
        return res.json(result);
      }

      return res.status(404).json({
        success: false,
        message: 'SC não encontrado',
      });
    } catch (error) {
      console.error('Erro no controller consultaSCService:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }




}

module.exports = new suprimentosController();
