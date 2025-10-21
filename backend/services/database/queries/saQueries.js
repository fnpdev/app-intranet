// services/database/queries/produtosQueries.js

const saQueries = {
  /**
   * Query para buscar produto por código
   */

  buscarPorCodigo: `
    SELECT 
	    SCP.CP_NUM		                as numero_sa, 
	    SCP.CP_PRODUTO	              as produto,
      SCP.CP_DESCRI                 as descricao,
	    SCP.CP_LOCAL	                as local_estoque,
	    SCP.CP_QUANT	                as qtde_solicitada, 
	    SCP.CP_QUJE		                as qtde_entregue,
	    SCP.CP_QUANT - CP_QUJE        as qtde_pendente, 
	    SCP.CP_EMISSAO	              as data_emissao, 
	    SCP.CP_DATPRF	                as data_necessidade, 
	    SCP.CP_SOLICIT	              as solicitante, 
	    CASE 
        WHEN SCP.CP_STATUS = 'E' THEN 'Entregue' 
	      ELSE 'Pendente' 
      END                           as status_sa, 
	    CASE 
        WHEN SCP.CP_PREREQU = 'S' THEN 'Gerada' 
	      ELSE 'Pendente' 
      END                           as status_req,
	    CASE
        WHEN SCP.CP_STATUS = 'E' THEN 'green[A700]' 
		    WHEN SCP.CP_PREREQU = 'S' THEN 'yellow[A700]' 
	      ELSE 'red[A700]' 
        END                         as cor_status,
        'consulta-produto/'+SCP.CP_PRODUTO   as link_produto
      FROM SCP010 SCP
     WHERE SCP.D_E_L_E_T_ <> '*'   
       AND left(SCP.CP_FILIAL, 2) = @codFilial   
       AND SCP.CP_NUM = @codSA  
     ORDER BY SCP.CP_EMISSAO DESC
  `,
   buscarPorProduto: `
    SELECT TOP 30
	    SCP.CP_NUM		                as numero_sa, 
	    SCP.CP_LOCAL	                as local_estoque,
	    SCP.CP_QUANT	                as qtde_solicitada, 
	    SCP.CP_QUJE		                as qtde_entregue,
	    SCP.CP_QUANT - CP_QUJE        as qtde_pendente, 
	    SCP.CP_EMISSAO	              as data_emissao, 
	    SCP.CP_DATPRF	                as data_necessidade, 
	    SCP.CP_SOLICIT	              as solicitante, 
	    CASE 
        WHEN SCP.CP_STATUS = 'E' THEN 'Entregue' 
	      ELSE 'Pendente' 
      END                           as status_sa, 
	    CASE 
        WHEN SCP.CP_PREREQU = 'S' THEN 'Gerada' 
	      ELSE 'Pendente' 
      END                           as status_req,
	    CASE
        WHEN SCP.CP_STATUS = 'E' THEN 'green[A700]' 
		    WHEN SCP.CP_PREREQU = 'S' THEN 'yellow[A700]' 
	      ELSE 'red[A700]' 
        END                         as cor_status,
        'consulta-sa/'+SCP.CP_NUM   as link_numero_sa
      FROM SCP010 SCP
     WHERE SCP.D_E_L_E_T_ <> '*'   
       AND left(SCP.CP_FILIAL, 2) = @codFilial   
       AND SCP.CP_PRODUTO = @codProduto  
     ORDER BY SCP.CP_EMISSAO DESC
  `,
  

};

module.exports = saQueries;


