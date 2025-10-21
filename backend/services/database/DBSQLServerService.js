// services/database/DatabaseService.js
const { sql, getPool } = require('../../config/db_sqlserver');

class DatabaseService {
  /**
   * Executa uma query parametrizada de forma segura
   */
  async executeQuery(query, params = {}) {
    try {
      const pool = await getPool();
      const request = pool.request();

      // ===== LOG PARA DEBUG =====
      //console.log('🔍 Query:', query);
      //console.log('🔍 Params recebidos:', params);

      // Adiciona parâmetros de forma segura com detecção automática de tipo
      this._addParameters(request, params);

      const result = await request.query(query);
      
      // ===== LOG DO RESULTADO =====
      //console.log('✅ Query executada com sucesso. Linhas retornadas:', result.recordset.length);
      
      return {
        success: true,
        data: result.recordset,
        rowsAffected: result.rowsAffected[0],
        metadata: {
          columns: result.recordset.columns,
          rowCount: result.recordset.length,
        },
      };
    } catch (error) {
      console.error('❌ Erro ao executar query:', error);
      console.error('❌ Query que falhou:', query);
      console.error('❌ Params:', params);
      return {
        success: false,
        error: error.message,
        errorCode: error.code,
        data: null,
      };
    }
  }

  /**
   * Adiciona parâmetros ao request com detecção automática de tipo
   */
  _addParameters(request, params) {
    Object.keys(params).forEach((key) => {
      const value = params[key];

      // ===== LOG PARA DEBUG =====
      //console.log(`📌 Adicionando parâmetro: @${key} = ${value} (tipo: ${typeof value})`);

      if (value === null || value === undefined) {
        request.input(key, sql.NVarChar, null);
        //console.log(`   ↳ Tipo SQL: NVarChar (NULL)`);
        return;
      }

      // Detecta o tipo automaticamente
      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          request.input(key, sql.Int, value);
          //console.log(`   ↳ Tipo SQL: Int`);
        } else {
          request.input(key, sql.Decimal(18, 2), value);
          //console.log(`   ↳ Tipo SQL: Decimal(18,2)`);
        }
      } else if (value instanceof Date) {
        request.input(key, sql.DateTime, value);
        //console.log(`   ↳ Tipo SQL: DateTime`);
      } else if (typeof value === 'boolean') {
        request.input(key, sql.Bit, value);
        //console.log(`   ↳ Tipo SQL: Bit`);
      } else if (Buffer.isBuffer(value)) {
        request.input(key, sql.VarBinary, value);
        //console.log(`   ↳ Tipo SQL: VarBinary`);
      } else {
        // String por padrão
        request.input(key, sql.NVarChar, String(value));
        //console.log(`   ↳ Tipo SQL: NVarChar`);
      }
    });
  }

  // ... resto do código
}

module.exports = new DatabaseService();
