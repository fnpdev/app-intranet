// services/moduleService.js
const { query } = require('../config/db_postgres');

/**
 * 🔍 Retorna todos os módulos e suas páginas associadas
 */
async function getAllModules() {
  const sql = `
    SELECT 
      m.id AS module_id,
      m.key AS module_key,
      m.name AS module_name,
      m.description AS module_description,
      m.active AS module_active,
      json_agg(
        json_build_object(
          'key', p.key,
          'label', p.name,
          'path', p.path,
          'public', p.public,
          'withLayout', p.with_layout,
          'pathIgnore', p.path_ignore,
          'component', p.component,
          'layout', p.layout
        ) ORDER BY p.order_index
      ) AS pages
    FROM intranet_modules m
    LEFT JOIN intranet_pages p ON p.module_id = m.id AND p.active = TRUE
    WHERE m.active = TRUE
    GROUP BY m.id, m.key, m.name, m.description, m.active
    ORDER BY m.id;
  `;
  const result = await query(sql);
  return result.rows;
}

module.exports = {
  getAllModules,
};
