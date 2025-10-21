// services/ERPService.js
const DatabaseService = require('../database/DBSQLServerService');
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



    // Função robusta para montar Kardex e retornar apenas itens com movimento
    function montarKardex(dados) {
      const {
        kardexEstrutura = [],
        kardexSaldoInicial = [],
        kardexEntrada = [],
        kardexSaida = [],
        KardexMovimentacaoInterna = []
      } = dados || {};

      // helper para garantir número
      const toNum = (v) => {
        if (v === null || v === undefined || v === '') return 0;
        const n = Number(v);
        return isNaN(n) ? 0 : n;
      };

      // helper para somar todos os registros correspondentes em um array
      const somaCampos = (arr, filial, produto, local, campos) => {
        if (!Array.isArray(arr)) return campos.reduce((acc, c) => ({ ...acc, [c]: 0 }), {});
        const matches = arr.filter(it =>
          (it.filial === filial) && (it.produto === produto) && (it.local === local)
        );
        const soma = {};
        for (const c of campos) soma[c] = 0;
        for (const m of matches) {
          for (const c of campos) {
            // aceita variações de nomes comuns (por ex.: saldo_incial vs saldo_inicial)
            const val = m[c] !== undefined ? m[c] :
              (m[c.replace('inicial', 'incial')] !== undefined ? m[c.replace('inicial', 'incial')] : 0);
            soma[c] += toNum(val);
          }
        }
        return soma;
      };

      const resultado = kardexEstrutura.map(item => {
        const { filial, produto, local, tipo } = item;

        // saldo inicial (possível variação de nome no JSON: saldo_incial)
        const saldo = somaCampos(kardexSaldoInicial, filial, produto, local, ['saldo_incial', 'custo_inicial']);
        // entrada, saida e movimentos internos (somam todos os registros)
        const entrada = somaCampos(kardexEntrada, filial, produto, local,
          ['entrada_inicial', 'entrada_final', 'custo_entrada_inicial', 'custo_entrada_final']);
        const saida = somaCampos(kardexSaida, filial, produto, local,
          ['saida_inicial', 'saida_final', 'custo_saida_inicial', 'custo_saida_final']);
        const movInt = somaCampos(KardexMovimentacaoInterna, filial, produto, local,
          ['entrada_inicial', 'entrada_final', 'saida_inicial', 'saida_final',
            'custo_entrada_inicial', 'custo_entrada_final', 'custo_saida_inicial', 'custo_saida_final']);

        // consolida somando entrada+movInt, saida+movInt
        const entrada_inicial = toNum(entrada.entrada_inicial) + toNum(movInt.entrada_inicial);
        const entrada_final = toNum(entrada.entrada_final) + toNum(movInt.entrada_final);
        const saida_inicial = toNum(saida.saida_inicial) + toNum(movInt.saida_inicial);
        const saida_final = toNum(saida.saida_final) + toNum(movInt.saida_final);

        const custo_entrada_inicial = toNum(entrada.custo_entrada_inicial) + toNum(movInt.custo_entrada_inicial);
        const custo_entrada_final = toNum(entrada.custo_entrada_final) + toNum(movInt.custo_entrada_final);
        const custo_saida_inicial = toNum(saida.custo_saida_inicial) + toNum(movInt.custo_saida_inicial);
        const custo_saida_final = toNum(saida.custo_saida_final) + toNum(movInt.custo_saida_final);

        const saldo_inicial = toNum(saldo.saldo_incial);
        const custo_inicial = toNum(saldo.custo_inicial);

        const saldo_final = saldo_inicial + entrada_final - saida_final;
        const custo_final = custo_inicial + custo_entrada_final - custo_saida_final;

        return {
          filial,
          produto,
          local,
          tipo,
          saldo_inicial,
          //custo_inicial,
          entrada_inicial,
          entrada_final,
          saida_inicial,
          saida_final,
          //custo_entrada_inicial,
          //custo_entrada_final,
          //custo_saida_inicial,
          //custo_saida_final,
          saldo_final,
          //custo_final
        };
      });

      // Filtra apenas quem tem "movimento": quantidade ou custo diferente de zero
      const comMovimento = resultado.filter(k => {
        return (
          k.entrada_inicial > 0 || k.entrada_final > 0 ||
          k.saida_inicial > 0 || k.saida_final > 0 ||
          k.custo_entrada_final > 0 || k.custo_saida_final > 0
        );
      });

      return comMovimento;
    }




    let codFilial = '01';
    let dataSaldoInicial = '20250930'
    let dataInicial = '20251001'
    let dataFinal = '20251031'

    let produto = await this.db.executeQuery(
      this.queries.produto.buscarPorCodigo,
      { codProduto, codFilial }
    );

    let estoque = await this.db.executeQuery(
      this.queries.produto.buscarEstoqueProduto,
      { codProduto, codFilial }
    );

    let endereco = await this.db.executeQuery(
      this.queries.produto.buscarEnderecoProduto,
      { codProduto, codFilial }
    );

    let lote = await this.db.executeQuery(
      this.queries.produto.buscarLoteProduto,
      { codProduto, codFilial }
    );

    let sc = await this.db.executeQuery(
      this.queries.sc.buscarPorProduto,
      { codProduto, codFilial }
    );

    let sa = await this.db.executeQuery(
      this.queries.sa.buscarPorProduto,
      { codProduto, codFilial }
    );

    let pc = await this.db.executeQuery(
      this.queries.pc.buscarPorProduto,
      { codProduto, codFilial }
    );

    let kardexEstrutura = await this.db.executeQuery(
      this.queries.produto.buscarKardexEstrutura,
      { codProduto, codFilial }
    );

    let kardexSaldoInicial = await this.db.executeQuery(
      this.queries.produto.buscarKardexSaldoInicial,
      { codProduto, codFilial, dataSaldoInicial }
    );

    let kardexEntrada = await this.db.executeQuery(
      this.queries.produto.buscarKardexEntrada,
      { codProduto, codFilial, dataInicial, dataFinal }
    );

    let kardexSaida = await this.db.executeQuery(
      this.queries.produto.buscarKardexSaida,
      { codProduto, codFilial, dataInicial, dataFinal }
    );

    let KardexMovimentacaoInterna = await this.db.executeQuery(
      this.queries.produto.buscarKardexMovimentacaoInterna,
      { codProduto, codFilial, dataInicial, dataFinal }
    );


    let kardex = {
      kardexEstrutura: kardexEstrutura.data ? kardexEstrutura.data : {},
      kardexSaldoInicial: kardexSaldoInicial.data ? kardexSaldoInicial.data : {},
      kardexEntrada: kardexEntrada.data ? kardexEntrada.data : {},
      kardexSaida: kardexSaida.data ? kardexSaida.data : {},
      KardexMovimentacaoInterna: KardexMovimentacaoInterna.data ? KardexMovimentacaoInterna.data : {},
    }
    const kardexFinal = montarKardex(kardex);


    let result = {
      success: true,
      info: produto.success ? produto.data[0] : {},
      estoque: estoque.success ? estoque.data : {},
      endereco: endereco.data ? endereco.data : {},
      lote: lote.data ? lote.data : {},
      sc: sc.data ? sc.data : {},
      sa: sa.data ? sa.data : {},
      pc: pc.data ? pc.data : {},
      kardex: kardexFinal
    }


    return result
  }
}

module.exports = new consultaprodutoervice();
