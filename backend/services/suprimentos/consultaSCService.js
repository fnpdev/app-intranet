// services/ERPService.js
const DatabaseService = require('../database/DBSQLServerService');
const queries = require('../database/queries');

class consultaSCService {
  constructor() {
    this.db = DatabaseService;
    this.queries = queries;
  }



  /**
 * Busca SA por código
 * @param {string|number} codSC - Código do SC
 * @returns {Promise<object>} Dados do SC
 */
  async consultaSCPage(codSC) {


    function separarAtributos(objOriginal) {
      // Garante que o objeto tem o array esperado
      if (!objOriginal || !Array.isArray(objOriginal) || objOriginal.length === 0) {
        return { info: {}, itens: [] };
      }

      // Pega o primeiro item como base para os dados gerais
      const primeiroItem = objOriginal[0];

      // Extrai apenas os atributos desejados para o campo info
      const info = {
        numero_sc: primeiroItem.numero_sc,
        data_emissao: primeiroItem.data_emissao,
        solicitante: primeiroItem.solicitante,
        sc_status: primeiroItem.sc_status,
      };

      // Cria os itens, removendo os atributos que já estão em "info"
      const itens = objOriginal.map(item => {
        const {
          numero_sc,      // removido
          data_emissao,   // removido
          solicitante,
          sc_status,
          ...rest
        } = item;
        return rest;
      });

      // Retorna no formato desejado
      return { info, itens };
    } 

    let codFilial = '01';
    let sc_itens = await this.db.executeQuery(
      this.queries.sc.buscarPorCodigo,
      { codFilial, codSC }
    );

    let aprovacao = await this.db.executeQuery(
      this.queries.sc.buscarAprovadorPorSC,
      { codFilial, codSC }
    );


    let sc = separarAtributos(sc_itens.data);

    let result = {
      success: sc_itens.rowsAffected > 0 ? true : false,
      info: sc.info,
      itens: sc.itens,
      aprovacao: aprovacao.data ? aprovacao.data : {}
    }


    return result
  }
}

module.exports = new consultaSCService();
