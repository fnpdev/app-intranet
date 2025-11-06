const db = require('../config/db_postgres');
const dbPG = require('./DBPostgresSQLService');
const dbSQL = require('./DBSQLServerService');

async function getPages() {
  const sql = `
    SELECT p.id, p.key, p.description, p.layout, p.is_active, m.key AS module
    FROM intranet_pages p
    INNER JOIN intranet_modules m ON m.id = p.module_id
    WHERE p.is_active = TRUE
    ORDER BY p.description;
  `;
  const result = await db.query(sql);
  return result.rows;
}

async function getPageByKey(pageKey) {
  const sql = `
    SELECT p.id, p.key, p.description, p.layout, p.is_active, m.key AS module
    FROM intranet_pages p
    INNER JOIN intranet_modules m ON m.id = p.module_id
    WHERE p.key = $1 AND p.is_active = TRUE
    LIMIT 1;
  `;
  const result = await db.query(sql, [pageKey]);
  return result.rows[0];
}

async function getPageQueries(pageKey) {
  const sql = `
    SELECT q.key, q.name, q.description, q.db, q.query
    FROM intranet_page_queries pq
    INNER JOIN intranet_pages p ON p.id = pq.page_id
    INNER JOIN intranet_queries q ON q.id = pq.query_id
    WHERE p.key = $1
      AND pq.is_active = TRUE
      AND q.is_active = TRUE
    ORDER BY pq.order_index;
  `;
  const result = await db.query(sql, [pageKey]);
  return result.rows;
}


/**
 * 🔍 Busca definição da página e queries associadas (sem executar)
 */
async function getPageDefinition(pageKey) {
  if (!pageKey) throw new Error('pageKey é obrigatório');

  // 1️⃣ Busca página
  const sqlPage = `
    SELECT id, key, name, layout, is_active
    FROM intranet_pages
    WHERE key = $1 AND is_active = TRUE
    LIMIT 1;
  `;
  const pageResult = await db.query(sqlPage, [pageKey]);
  const page = pageResult.rows[0];
  if (!page) throw new Error('Página não encontrada');

  // 2️⃣ Busca queries vinculadas
  const sqlQueries = `
    SELECT 
      q.id,
      q.key,
      q.name,
      q.description,
      q.db,
      q.query,
      q.is_active,
      pq.order_index,
      pq.is_main
    FROM intranet_page_queries pq
    INNER JOIN intranet_queries q ON pq.query_id = q.id
    INNER JOIN intranet_pages p ON pq.page_id = p.id
    WHERE p.key = $1
      AND pq.is_active = TRUE
      AND q.is_active = TRUE
    ORDER BY pq.order_index ASC;
  `;
  const queryResult = await db.query(sqlQueries, [pageKey]);

  return {
    page,
    queries: queryResult.rows,
  };
}

/**
 * 🚀 Executa todas as queries associadas a uma página
 * Recebe apenas os parâmetros no body.
 */
async function executePageQueries(pageKey, params = {}) {
  const definition = await getPageDefinition(pageKey);
  if (!definition.queries?.length) {
    throw new Error('Nenhuma query associada à página.');
  }

  const resultData = {};

  // Executa cada query conforme o banco (SQL Server / Postgres)
  for (const q of definition.queries) {
    const result = await runQuery(q, params);
    resultData[q.key] = result.data || [];
  }

  return resultData;
}


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

module.exports = {
  pagesService: {
    getPages,
    getPageByKey,
    getPageQueries,

  },
  queriesService: {
    getPageDefinition,
    executePageQueries,

  }
};
