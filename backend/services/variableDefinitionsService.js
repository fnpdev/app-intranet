// services/variableDefinitionsService.js
const { query } = require('../config/db_postgres');

/**
 * 🔍 Lista todas as variáveis cadastradas
 */
async function listDefinitions() {
  const sql = `
    SELECT key, description, active, "order"
    FROM intranet_variable_definitions
    WHERE active = TRUE
    ORDER BY "order" asc, description;
  `;
  const result = await query(sql);
  return result.rows;
}

/**
 * 🆕 Cria uma nova variável global
 */
async function createDefinition({ key, description, active = true, order = 0 }) {
  const sql = `
    INSERT INTO intranet_variable_definitions (key, description, active, "order")
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (key) DO UPDATE
    SET description = EXCLUDED.description,
        active = EXCLUDED.active,
        "order" = EXCLUDED."order",
        updated_at = NOW()
    RETURNING *;
  `;
  const result = await query(sql, [key, description, active, order]);
  return result.rows[0];
}

/**
 * 🔄 Atualiza uma definição existente
 */
async function updateDefinition({ key, description, active, order }) {
  const sql = `
    UPDATE intranet_variable_definitions
    SET description = COALESCE($2, description),
        active = COALESCE($3, active),
        "order" = COALESCE($4, "order"),
        updated_at = NOW()
    WHERE key = $1
    RETURNING *;
  `;
  const result = await query(sql, [key, description, active, order]);
  return result.rows[0];
}

/**
 * ❌ Desativa uma variável
 */
async function deactivateDefinition(key) {
  const sql = `
    UPDATE intranet_variable_definitions
    SET active = FALSE, updated_at = NOW()
    WHERE key = $1
    RETURNING *;
  `;
  const result = await query(sql, [key]);
  return result.rows[0];
}

module.exports = {
  listDefinitions,
  createDefinition,
  updateDefinition,
  deactivateDefinition,
};
