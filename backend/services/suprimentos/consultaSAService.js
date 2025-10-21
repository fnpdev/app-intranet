// services/ERPService.js
const DatabaseService = require('../database/DBSQLServerService');
const queries = require('../database/queries');

class consultaSAService {
  constructor() {
    this.db = DatabaseService;
    this.queries = queries;
  }

  /**
 * Busca SA por código
 * @param {string|number} codSA - Código do SA
 * @returns {Promise<object>} Dados do SA
 */
  async consultaSAPage(codSA) {

    function separarAtributos(objOriginal) {
      // Garante que o objeto tem o array esperado
      if (!objOriginal || !Array.isArray(objOriginal) || objOriginal.length === 0) {
        return { info: {}, itens: [] };
      }

      // Pega o primeiro item como base para os dados gerais
      const primeiroItem = objOriginal[0];

      // Extrai apenas os atributos desejados para o campo info
      const info = {
        numero_sa: primeiroItem.numero_sa,
        data_emissao: primeiroItem.data_emissao,
        solicitante: primeiroItem.solicitante,
        status_sc: primeiroItem.status_sc,
      };

      // Cria os itens, removendo os atributos que já estão em "info"
      const itens = objOriginal.map(item => {
        const {
          numero_sa,      // removido
          data_emissao,   // removido
          solicitante,
          status_sc,
          ...rest
        } = item;
        return rest;
      });

      // Retorna no formato desejado
      return { info, itens };
    } 

    let codFilial = '01'
    let sa_itens = await this.db.executeQuery(
      this.queries.sa.buscarPorCodigo,
      { codSA, codFilial }
    );

    
    let sa = separarAtributos(sa_itens.data);

    let result = {
      success: sa_itens.rowsAffected > 0 ? true : false,
      info: sa.info,
      itens: sa.itens
    }


    return result
  }
}

module.exports = new consultaSAService();
