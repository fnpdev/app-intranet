const dbPG = require('./DBPostgresSQLService');
const dbSQL = require('./DBSQLServerService');

/**
 * Executa query de acordo com o banco configurado na tabela intranet_queries
 */
async function runQuery(queryDef, params = {}) {
  if (!queryDef?.query) throw new Error('Query não definida.');

  let db;
  if (queryDef.db === 'sql_server') db = dbSQL;
  else if (queryDef.db === 'postgres') db = dbPG;
  else throw new Error(`Banco de dados desconhecido: ${queryDef.db}`);

  // substitui placeholders tipo @param
  let queryText = queryDef.query;
  for (const [key, value] of Object.entries(params)) {
    const regex = new RegExp(`@${key}\\b`, 'g');
    queryText = queryText.replace(regex, `'${value}'`);
  }

  const result = await db.executeQuery(queryText);
  return result;
}

module.exports = { runQuery };
