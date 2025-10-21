// services/database/queries/produtosQueries.js

const pcQueries = {
  /**
   * Query para buscar produto por código
   */

  buscarPorCodigo: `
    SELECT TOP 30
	    SC7.C7_NUM		              as numero_pc, 
      SC7.C7_QUANT	              as qtde_solicitada, 
      SC7.C7_QUJE		              as qtde_entregue, 
      SC7.C7_QUANT - C7_QUJE		  as qtde_pendente, 
      SC7.C7_EMISSAO	            as data_emissao, 
      SC7.C7_DATPRF	              as data_necessidade, 
      SC7.C7_SOLICIT	            as solicitatnte, 
      SC7.C7_STATME	              as status_pc, 
      SC7.C7_RESIDUO	            as residuo,
      'consulta-pc/'+SC7.C7_NUM   as link_numero_pc,
      'green[A700]'               as cor_status
      FROM SC7010 SC7
     WHERE SC7.D_E_L_E_T_ <> '*'   
       AND left(SC7.C7_FILIAL, 2) = @codFilial  
       AND SC7.C7_NUM = @codPC  
     ORDER BY SC7.C7_EMISSAO DESC, 
              SC7.C7_QUANT desc
  `,
   buscarPorProduto: `
    SELECT TOP 30
	    SC7.C7_NUM		              as numero_pc, 
      SC7.C7_QUANT	              as qtde_solicitada, 
      SC7.C7_QUJE		              as qtde_entregue, 
      SC7.C7_QUANT - C7_QUJE		  as qtde_pendente, 
      SC7.C7_EMISSAO	            as data_emissao, 
      SC7.C7_DATPRF	              as data_necessidade, 
      SC7.C7_SOLICIT	            as solicitatnte, 
      SC7.C7_STATME	              as status_pc, 
      SC7.C7_RESIDUO	            as residuo,
      'consulta-pc/'+SC7.C7_NUM   as link_numero_pc,
      'green[A700]'               as cor_status
      FROM SC7010 SC7
     WHERE SC7.D_E_L_E_T_ <> '*'   
       AND left(SC7.C7_FILIAL, 2) = @codFilial  
       AND SC7.C7_PRODUTO = @codProduto  
     ORDER BY SC7.C7_EMISSAO DESC, 
              SC7.C7_QUANT desc
  `,
};

module.exports = pcQueries;


