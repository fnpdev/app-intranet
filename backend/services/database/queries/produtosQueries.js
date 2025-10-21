// services/database/queries/produtosQueries.js

const produtosQueries = {
  /**
   * Query para buscar produto por código
   */

  buscarPorCodigo: `
    SELECT   
        trim(SB1.B1_COD)		as produto,       
        trim(SB1.B1_DESC)		as descricao,       
        trim(SB1.B1_COD)		as codigo_barras,
        SB1.B1_LOCALIZ			as controla_endereco,
        SB1.B1_TIPO				  as tipo_PRODUTO,
        SB1.B1_RASTRO			  as controla_lote
     FROM SB1010 SB1
    WHERE SB1.D_E_L_E_T_ <> '*'   
      AND SB1.B1_FILIAL = @codfilial   
      AND SB1.B1_COD = @codProduto
  `,
  buscarLoteProduto: `
    SELECT  
      SB8.B8_FILIAL           as filial,
	    trim(SB8.B8_LOTECTL)	  as lote,
	    SB8.B8_DTVALID			    as validade,
	    SB8.B8_SALDO			      as qtde
      FROM SB8010 SB8
     WHERE SB8.D_E_L_E_T_ <> '*'  
       AND left(SB8.B8_FILIAL, 2) = @codfilial   
       AND SB8.B8_SALDO <> 0
       AND SB8.B8_PRODUTO = @codProduto
     ORDER BY SB8.B8_DTVALID asc, 
              SB8.B8_SALDO desc
  `,
  buscarEnderecoProduto: `
    SELECT 
      SBF.BF_LOCAL              as local,
	    trim(SBF.BF_LOCALIZ)	    as endereco,
	    sum(SBF.BF_QUANT)		      as qtde
      FROM SBF010 SBF
      left join NNR010 NNR
        ON NNR.NNR_FILIAL = left(SBF.BF_FILIAL, 2)
       AND NNR.NNR_CODIGO = SBF.BF_LOCAL
       AND NNR.D_E_L_E_T_ <> '*' 
     WHERE SBF.D_E_L_E_T_ <> '*'   
       AND left(SBF.BF_FILIAL, 2) = @codfilial   
       AND SBF.BF_PRODUTO = @codProduto
       AND SBF.BF_QUANT <> 0
       GROUP BY SBF.BF_LOCAL, 
                SBF.BF_LOCALIZ
      ORDER BY SBF.BF_LOCAL desc
  `,
  buscarEstoqueProduto: `
    SELECT 
      SB2.B2_FILIAL           as filial,
	    NNR.NNR_CODIGO			    as id,
	    trim(NNR.NNR_DESCRI)	  as local,
	    SB2.B2_QATU				      as qtde,
	    SB2.B2_QEMP				      as qtde_empenho
      FROM SB2010 SB2
     INNER JOIN NNR010 NNR
        ON NNR.NNR_FILIAL = left(SB2.B2_FILIAL, 2)
       AND NNR.NNR_CODIGO = SB2.B2_LOCAL
       AND NNR.D_E_L_E_T_ <> '*' 
     WHERE SB2.D_E_L_E_T_ <> '*' 
       AND left(SB2.B2_FILIAL, 2) = @codfilial   
       AND SB2.B2_COD = @codProduto
       AND SB2.B2_QATU <> 0
     ORDER BY SB2.B2_QATU DESC
  `,
  
  buscarKardexEstrutura: `
    SELECT 
        B2.B2_FILIAL    AS filial,
        B2.B2_COD       AS produto,
        B2.B2_LOCAL     AS local,
        B1.B1_TIPO      AS tipo
    FROM SB2010 (NOLOCK) AS B2
    INNER JOIN SB1010 (NOLOCK) AS B1 
       ON B1.B1_FILIAL = left(B2.B2_FILIAL, 2)
      AND B1.B1_COD = B2.B2_COD
      AND B1.D_E_L_E_T_ != '*'
    WHERE B2.D_E_L_E_T_ != '*'
      AND left(B2.B2_FILIAL, 2) = @codfilial
      AND B2.B2_COD = @codProduto
    GROUP BY 
          B2.B2_FILIAL, 
          B2.B2_COD, 
          B2.B2_LOCAL, 
          B1.B1_TIPO
  `,
  buscarKardexSaldoInicial: `
    SELECT 
        B9.B9_FILIAL                AS filial,
        B9.B9_COD                   AS produto, 
        B9.B9_LOCAL                 AS local,
        B1.B1_TIPO                  AS tipo,
        SUM(B9_QINI)                AS saldo_incial,
        SUM(B9_VINI1)               AS custo_inicial
    FROM SB9010 (NOLOCK) AS B9
    INNER JOIN SB1010 (NOLOCK) AS B1 
       ON B1.B1_FILIAL = LEFT(B9.B9_FILIAL, 2)
      AND B1.B1_COD = B9.B9_COD
      AND B1.D_E_L_E_T_ != '*'
    WHERE B9.D_E_L_E_T_ != '*'
      AND B9.B9_DATA = @dataSaldoInicial
      AND LEFT(B9.B9_FILIAL, 2) = @codfilial
      AND B9.B9_COD = @codProduto
    GROUP BY 
          B9.B9_FILIAL, 
          B9.B9_COD, 
          B9.B9_LOCAL, 
          B1.B1_TIPO
  `,
  buscarKardexEntrada: `
    
    SELECT 
        D1.D1_FILIAL                        AS filial,
        D1.D1_COD                           AS produto, 
        D1.D1_LOCAL                         AS local,
        B1.B1_TIPO                          AS tipo,
        ROUND(SUM(CASE WHEN D1_DTDIGIT BETWEEN @dataInicial AND @dataFinal-1 THEN D1_QUANT ELSE 0 END ),2)    AS entrada_inicial,
        ROUND(SUM(CASE WHEN D1_DTDIGIT BETWEEN @dataInicial AND @dataFinal THEN D1_QUANT ELSE 0 END ),2)      AS entrada_final,
        ROUND(SUM(CASE WHEN D1_DTDIGIT BETWEEN @dataInicial AND @dataFinal-1 THEN D1_CUSTO ELSE 0 END ),2)    AS custo_entrada_inicial,
        ROUND(SUM(CASE WHEN D1_DTDIGIT BETWEEN @dataInicial AND @dataFinal THEN D1_CUSTO ELSE 0 END ),2)      AS custo_entrada_final
    FROM SD1010 (NOLOCK) AS D1
    INNER JOIN SF4010 (NOLOCK) AS F4 
       ON F4.F4_FILIAL = LEFT(D1.D1_FILIAL, 2)
      AND F4_CODIGO = D1_TES
      AND F4.D_E_L_E_T_ != '*'
    INNER JOIN SB1010 (NOLOCK) AS B1 
       ON B1.B1_FILIAL = LEFT(D1.D1_FILIAL, 2)
      AND B1.B1_COD = D1.D1_COD
      AND B1.D_E_L_E_T_ != '*'
    WHERE D1.D_E_L_E_T_ != '*'
      AND LEFT(D1.D1_FILIAL, 2) = @codfilial
      AND D1.D1_COD = @codProduto
      AND D1_DTDIGIT BETWEEN @dataInicial AND @dataFinal
      AND D1.D1_ORIGLAN != 'LF'
      AND F4.F4_TIPO = 'E'
      AND F4_ESTOQUE = 'S'
    GROUP BY 
          D1.D1_FILIAL, 
          D1.D1_COD, 
          D1.D1_LOCAL, 
          B1.B1_TIPO
    
  `,
  buscarKardexSaida:`
    
    SELECT 
        D2.D2_FILIAL        AS filial,
        D2_COD              AS produto, 
        D2_LOCAL            AS local,
        B1_TIPO             AS tipo,
    ROUND(SUM(CASE WHEN D2_EMISSAO BETWEEN @dataInicial AND @dataFinal-1 THEN D2_QUANT ELSE 0 END ),2)    AS saida_inicial,
    ROUND(SUM(CASE WHEN D2_EMISSAO BETWEEN @dataInicial AND @dataFinal THEN D2_QUANT ELSE 0 END ),2)      AS saida_final,
  
    ROUND(SUM(CASE WHEN D2_EMISSAO BETWEEN @dataInicial AND @dataFinal-1 THEN D2_CUSTO1 ELSE 0 END ),2)   AS custo_saida_inicial,
    ROUND(SUM(CASE WHEN D2_EMISSAO BETWEEN @dataInicial AND @dataFinal THEN D2_CUSTO1 ELSE 0 END ),2)     AS custo_saida_final
  
  
    FROM SD2010 (NOLOCK) AS D2
    INNER JOIN SF4010 (NOLOCK) AS F4 
       ON F4.F4_FILIAL = LEFT(D2.D2_FILIAL, 2)
      AND F4_CODIGO = D2.D2_TES
      AND F4.D_E_L_E_T_ != '*' 
    INNER JOIN SB1010 (NOLOCK) AS B1 
       ON B1.B1_FILIAL = LEFT(D2.D2_FILIAL, 2)
      AND B1.B1_COD = D2.D2_COD
      AND B1.D_E_L_E_T_ != '*'
    WHERE D2.D_E_L_E_T_ != '*'
      AND LEFT(D2.D2_FILIAL, 2) = @codfilial
      AND D2.D2_COD = @codProduto
      AND D2.D2_EMISSAO BETWEEN @dataInicial AND @dataFinal
      AND F4.F4_TIPO = 'S'
      AND D2.D2_ORIGLAN != 'LF'
      AND F4_ESTOQUE = 'S'
    GROUP BY 
          D2.D2_FILIAL, 
          D2.D2_COD, 
          D2.D2_LOCAL, 
          B1.B1_TIPO
  
  `,
  buscarKardexMovimentacaoInterna: `
    
    SELECT 
        D3.D3_FILIAL        AS filial,
        D3.D3_COD           AS produto,
        D3.D3_LOCAL         AS local,
        B1.B1_TIPO          AS tipo,
        ROUND(SUM(CASE WHEN D3_TM <='499' AND D3_EMISSAO BETWEEN @dataInicial AND @dataFinal-1 THEN D3_QUANT ELSE 0 END ),2)      AS entrada_inicial,
        ROUND(SUM(CASE WHEN D3_TM <='499' AND D3_EMISSAO BETWEEN @dataInicial AND @dataFinal THEN D3_QUANT ELSE 0 END ),2)        AS entrada_final,
        ROUND(SUM(CASE WHEN D3_TM >'499' AND D3_EMISSAO BETWEEN @dataInicial AND @dataFinal-1 THEN D3_QUANT ELSE 0 END ),2)       AS saida_inicial,
        ROUND(SUM(CASE WHEN D3_TM >'499' AND D3_EMISSAO BETWEEN @dataInicial AND @dataFinal THEN D3_QUANT ELSE 0 END ),2)         AS saida_final,
  
        ROUND(SUM(CASE WHEN D3_TM <='499' AND D3_EMISSAO BETWEEN @dataInicial AND @dataFinal-1 THEN D3_CUSTO1 ELSE 0 END ),2)     AS custo_entrada_inicial,
        ROUND(SUM(CASE WHEN D3_TM <='499' AND D3_EMISSAO BETWEEN @dataInicial AND @dataFinal THEN D3_CUSTO1 ELSE 0 END ),2)       AS custo_entrada_final,
        ROUND(SUM(CASE WHEN D3_TM >'499' AND D3_EMISSAO BETWEEN @dataInicial AND @dataFinal-1 THEN D3_CUSTO1 ELSE 0 END ),2)      AS custo_saida_inicial,
        ROUND(SUM(CASE WHEN D3_TM >'499' AND D3_EMISSAO BETWEEN @dataInicial AND @dataFinal THEN D3_CUSTO1 ELSE 0 END ),2)        AS custo_saida_final
  
    FROM SD3010 (NOLOCK) AS D3
    INNER JOIN SB1010 (NOLOCK) AS B1
       ON B1.B1_FILIAL = LEFT(D3.D3_FILIAL, 2)
      AND B1.B1_COD = D3.D3_COD
      AND B1.D_E_L_E_T_ != '*'
    WHERE D3.D_E_L_E_T_ != '*'
      AND LEFT(D3.D3_FILIAL, 2) = @codfilial
      AND D3.D3_COD = @codProduto
      AND D3.D3_EMISSAO  BETWEEN @dataInicial AND @dataFinal
      AND D3.D3_ESTORNO != 'S'
    GROUP BY D3.D3_FILIAL, 
             D3.D3_COD, 
             D3.D3_LOCAL, 
             B1.B1_TIPO
  `


};

module.exports = produtosQueries;
