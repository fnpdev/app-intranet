// services/ERPService.js
const DatabaseService = require('../DBSQLServerService');
const queries = require('../database/queries');

class consultaprodutoervice {
  constructor() {
    this.db = DatabaseService;
    this.queries = queries;
  }

  /**
 * Busca produto por código
 * @param {string|number} codProduto - Código do produto
 * @returns {Promise<object>} Dados do produto
 */
  async consultaProdutoPage(codProduto) {



    let codFilial = '01';
    
    let produto = await this.db.executeQuery(
      this.queries.produto.buscarPorCodigo,
      { codProduto, codFilial }
    );


    let lote = await this.db.executeQuery(
      this.queries.produto.buscarLoteProduto,
      { codProduto, codFilial }
    );

    let result = {
      success: produto.rowsAffected > 0 ? true : false,
      info: produto.success ? produto.data[0] : {},
      lote: lote.data ? lote.data : {}
    }


    return result
  }
}

module.exports = new consultaprodutoervice();
