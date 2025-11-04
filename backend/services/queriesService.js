const { query } = require('../config/db_postgres');
const { runQuery } = require('./queryExecutorService');

/**
 * 🔍 Busca definição da página e queries associadas (sem executar)
 */
async function getPageDefinition(pageKey) {
  if (!pageKey) throw new Error('pageKey é obrigatório');

  // 1️⃣ Busca página
  const sqlPage = `
    SELECT id, key, name, layout, is_active
    FROM intranet_pages
    WHERE key = $1 AND active = TRUE
    LIMIT 1;
  `;
  const pageResult = await query(sqlPage, [pageKey]);
  const page = pageResult.rows[0];
  if (!page) throw new Error('Página não encontrada');

  // 2️⃣ Busca queries vinculadas
  const sqlQueries = `
    SELECT 
      q.id,
      q.key,
      q.description,
      q.db,
      q.query,
      q.active,
      pq.order_index,
      pq.is_main
    FROM intranet_page_queries pq
    INNER JOIN intranet_queries q ON pq.query_id = q.id
    INNER JOIN intranet_pages p ON pq.page_id = p.id
    WHERE p.key = $1
      AND pq.active = TRUE
      AND q.active = TRUE
    ORDER BY pq.order_index ASC;
  `;
  const queryResult = await query(sqlQueries, [pageKey]);

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

module.exports = {
  getPageDefinition,
  executePageQueries,
};
