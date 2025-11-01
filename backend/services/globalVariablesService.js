const { query } = require('../config/db_postgres');

/**
 * 🔍 Retorna todas as variáveis globais do sistema,
 * com suas opções formatadas como JSON.
 */
async function getAllGlobalVariables() {
  const sql = `
    SELECT 
      d.key,
      d.description AS variable_description,
      d.active,
      COALESCE(
        json_agg(
          json_build_object(
            'value', g.value,
            'description', g.description,
            'is_default', g.is_default
          ) ORDER BY g.value
        ) FILTER (WHERE g.key IS NOT NULL),
        '[]'::json
      ) AS options
    FROM intranet_variable_definitions d
    LEFT JOIN intranet_global_variables g 
      ON g.key = d.key AND g.active = TRUE
    WHERE d.active = TRUE
    GROUP BY d.key, d.description, d.active
    ORDER BY d.key;
  `;

  const result = await query(sql);
  return result.rows.map(row => ({
    key: row.key,
    description: row.variable_description,
    active: row.active,
    options: row.options || [],
  }));
}

/**
 * 🔍 Retorna uma variável global específica
 */
async function getVariable(key) {
  const sql = `
    SELECT 
      d.key,
      d.description AS variable_description,
      d.active,
      COALESCE(
        json_agg(
          json_build_object(
            'value', g.value,
            'description', g.description,
            'is_default', g.is_default
          ) ORDER BY g.value
        ) FILTER (WHERE g.key IS NOT NULL),
        '[]'::json
      ) AS options
    FROM intranet_variable_definitions d
    LEFT JOIN intranet_global_variables g 
      ON g.key = d.key AND g.active = TRUE
    WHERE d.key = $1
    GROUP BY d.key, d.description, d.active
  `;

  const result = await query(sql, [key]);
  return result.rows[0] || null;
}

module.exports = {
  getAllGlobalVariables,
  getVariable,
};
