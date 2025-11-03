CREATE TABLE intranet_queries (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES intranet_modules(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  db TEXT NOT NULL,
  description TEXT,
  query TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



INSERT INTO intranet_queries (module_id, key, db, description, query)
SELECT id, 'produto_por_codigo', 'sql_server', 'Produto - Busca por código', '
  SELECT trim(SB1.B1_COD) AS produto, trim(SB1.B1_DESC) AS descricao
  FROM SB1010 SB1
  WHERE SB1.D_E_L_E_T_ <> ''*''
    AND SB1.B1_FILIAL = @codfilial
    AND SB1.B1_COD = @codProduto
' FROM intranet_modules WHERE key = 'suprimentos';

INSERT INTO intranet_queries (module_id, key, db, description, query)
SELECT id, 'lote_por_produto', 'sql_server', 'Produto - Lotes disponíveis', '
  SELECT SB8.B8_FILIAL AS filial, trim(SB8.B8_LOTECTL) AS lote, SB8.B8_SALDO AS qtde
  FROM SB8010 SB8
  WHERE SB8.D_E_L_E_T_ <> ''*''
    AND LEFT(SB8.B8_FILIAL, 2) = @codfilial
    AND SB8.B8_PRODUTO = @codProduto
' FROM intranet_modules WHERE key = 'suprimentos';

INSERT INTO intranet_queries (module_id, key, db, description, query)
SELECT id, 'estoque_por_produto', 'sql_server', 'Produto - Lotes disponíveis', '
  SELECT 
      SBF.BF_LOCAL              as local,
	    trim(SBF.BF_LOCALIZ)	    as endereco,
	    sum(SBF.BF_QUANT)		      as qtde
      FROM SBF010 SBF
      left join NNR010 NNR
        ON NNR.NNR_FILIAL = left(SBF.BF_FILIAL, 2)
       AND NNR.NNR_CODIGO = SBF.BF_LOCAL
       AND NNR.D_E_L_E_T_ <> ''*'' 
     WHERE SBF.D_E_L_E_T_ <> ''*''   
       AND left(SBF.BF_FILIAL, 2) = @codfilial   
       AND SBF.BF_PRODUTO = @codProduto
       AND SBF.BF_QUANT <> 0
       GROUP BY SBF.BF_LOCAL, 
                SBF.BF_LOCALIZ
      ORDER BY SBF.BF_LOCAL desc
' FROM intranet_modules WHERE key = 'suprimentos';




