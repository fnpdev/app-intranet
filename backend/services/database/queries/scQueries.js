// services/database/queries/produtosQueries.js

const scQueries = {
  /**
   * Query para buscar produto por código
   */

  buscarPorCodigo: `
  SELECT 
        SC1.C1_NUM		            AS numero_sc, 
        SC1.C1_PRODUTO            as produto,
        SC1.C1_DESCRI             as descricao,
        SC1.C1_QUANT	            AS qtde_solicitada, 
        SC1.C1_QUJE		            AS qtde_entregue, 
        SC1.C1_QUANT - C1_QUJE		AS qtde_pendente, 
        SC1.C1_EMISSAO	          AS data_emissao, 
        SC1.C1_DATPRF         	  AS data_necessidade, 
        SC1.C1_SOLICIT	          AS solicitante, 
        SC1.C1_PEDIDO	            AS pc, 
        SC1.C1_RESIDUO	          AS residuo,
        'consulta-produto/'+SC1.C1_PRODUTO AS link_produto,
        CASE
            WHEN C1_APROV = 'B' THEN 'Bloqueada'
            WHEN C1_APROV = 'R' THEN 'Rejeitada'
            ELSE 'Liberada'
        END                        AS  sc_status,
        'consulta-pc/'+SC1.C1_PEDIDO AS link_pc,
        CASE
            WHEN C1_RESIDUO = 'S' THEN 'green[900]'
            WHEN C1_APROV = 'B' THEN 'green[900]'
            WHEN C1_APROV = 'R' THEN 'green[A700]'
            WHEN C1_QUANT = C1_QUJE OR C1_QUJE > C1_QUANT THEN 'green[A700]'
            WHEN C1_COTACAO<>'      ' AND C1_PEDIDO='      ' THEN 'green[A700]'
            WHEN C1_QUJE>0 AND C1_QUJE <= C1_QUANT THEN 'green[A700]'
            WHEN (C1_APROV='L' OR C1_APROV=' ' ) AND C1_COTACAO='      ' AND C1_PEDIDO='      ' THEN 'green[A700]'
            ELSE 'green[A700]' 
        END                        AS  cor_status
    FROM SC1010 SC1
   WHERE SC1.D_E_L_E_T_ <> '*'   
     AND left(SC1.C1_FILIAL, 2) = @codFilial 
     AND SC1.C1_NUM = @codSC
   ORDER BY SC1.C1_EMISSAO desc, 
             SC1.C1_QUANT desc
  `,
   buscarPorProduto: `
    SELECT TOP 30
          SC1.C1_NUM		            AS numero_sc, 
          SC1.C1_QUANT	            AS qtde_solicitada, 
          SC1.C1_QUJE		            AS qtde_entregue, 
          SC1.C1_QUANT - C1_QUJE		AS qtde_pendente, 
          SC1.C1_EMISSAO	          AS data_emissao, 
          SC1.C1_DATPRF         	  AS data_necessidade, 
          SC1.C1_SOLICIT	          AS solicitante, 
          SC1.C1_PEDIDO	            AS pc, 
          SC1.C1_RESIDUO	          AS residuo,
          'consulta-sc/'+SC1.C1_NUM AS link_numero_sc,
          CASE
              WHEN C1_RESIDUO = 'S' THEN 'green[900]'
              WHEN C1_APROV = 'B' THEN 'green[900]'
              WHEN C1_APROV = 'R' THEN 'green[A700]'
              WHEN C1_QUANT = C1_QUJE OR C1_QUJE > C1_QUANT THEN 'green[A700]'
              WHEN C1_COTACAO<>'      ' AND C1_PEDIDO='      ' THEN 'green[A700]'
              WHEN C1_QUJE>0 AND C1_QUJE <= C1_QUANT THEN 'green[A700]'
              WHEN (C1_APROV='L' OR C1_APROV=' ' ) AND C1_COTACAO='      ' AND C1_PEDIDO='      ' THEN 'green[A700]'
          ELSE 'green[A700]' END cor_status
     FROM SC1010 SC1
    WHERE SC1.D_E_L_E_T_ <> '*'   
      AND left(SC1.C1_FILIAL, 2) = @codFilial 
      AND SC1.C1_PRODUTO = @codProduto  
    ORDER BY SC1.C1_EMISSAO desc, 
             SC1.C1_QUANT desc
  `,
  buscarAprovadorPorSC:`
    SELECT 
        SAL.AL_COD+' - '+SAL.AL_DESC    AS grupo_aprovacao, 
        SAK.AK_NOME                     AS aprovador,
        SCR.CR_EMISSAO	                AS data_emissao,
        SAL.AL_NIVEL                    AS nivel_aprovador,    
        CASE
              WHEN SCR.CR_STATUS = '01' THEN 'Aguardando nivel anterior'
              WHEN SCR.CR_STATUS = '02' THEN 'Pendente Aprovação'
              WHEN SCR.CR_STATUS = '03' THEN 'Liberado'
              WHEN SCR.CR_STATUS = '04' THEN 'Bloqueado'
              WHEN SCR.CR_STATUS = '05' THEN 'Liberado outro aprov'
              WHEN SCR.CR_STATUS = '06' THEN 'Rejeitado'
              ELSE 'Rej/Bloq outro aprov'
        END                             AS aprovacao_status,
	      SCR.CR_DATALIB			            AS data_liberacao
    FROM SCR010 SCR
    LEFT JOIN protheus_prd.dbo.SAL010 SAL
      ON SAL.AL_FILIAL = SCR.CR_FILIAL
     AND SAL.AL_COD = SCR.CR_GRUPO
     AND SAL.AL_USER = SCR.CR_USER
     AND SAL.D_E_L_E_T_ <> '*'
    LEFT JOIN protheus_prd.dbo.SAK010 SAK
      ON SAK.AK_FILIAL = SAL.AL_FILIAL
     AND SAK.AK_COD = SAL.AL_APROV
   WHERE SCR.D_E_L_E_T_ <> '*' 
     AND CR_TIPO = 'SC' 
     AND left(CR_FILIAL, 2) = @codFilial 
     AND CR_NUM = @codSC
     `
};

module.exports = scQueries;
