const { query } = require('../config/db_postgres');

async function getPages() {
  const sql = `
    SELECT p.id, p.key, p.description, p.layout, p.active, m.key AS module
    FROM intranet_pages p
    INNER JOIN intranet_modules m ON m.id = p.module_id
    WHERE p.active = TRUE
    ORDER BY p.description;
  `;
  const result = await query(sql);
  return result.rows;
}

async function getPageByKey(pageKey) {
  const sql = `
    SELECT p.id, p.key, p.description, p.layout, p.active, m.key AS module
    FROM intranet_pages p
    INNER JOIN intranet_modules m ON m.id = p.module_id
    WHERE p.key = $1 AND p.active = TRUE
    LIMIT 1;
  `;
  const result = await query(sql, [pageKey]);
  return result.rows[0];
}

async function getPageQueries(pageKey) {
  const sql = `
    SELECT q.key, q.description, q.db, q.query
    FROM intranet_page_queries pq
    INNER JOIN intranet_pages p ON p.id = pq.page_id
    INNER JOIN intranet_queries q ON q.id = pq.query_id
    WHERE p.key = $1
      AND pq.active = TRUE
      AND q.active = TRUE
    ORDER BY pq.order_index;
  `;
  const result = await query(sql, [pageKey]);
  return result.rows;
}

module.exports = {
  getPages,
  getPageByKey,
  getPageQueries,
};
