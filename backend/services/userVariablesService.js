const { query } = require('../config/db_postgres');

/**
 * 🔍 Retorna as variáveis efetivas de um usuário.
 * - Se o usuário não tiver variáveis registradas, aplica os defaults globais (is_default = TRUE).
 */
async function getUserVariablesEffective(username) {
  // 1️⃣ Verifica se o usuário já possui variáveis
  const existing = await query(
    'SELECT COUNT(*)::int AS total FROM intranet_user_variables WHERE username = $1',
    [username]
  );

  const hasVariables = existing.rows[0]?.total > 0;

  // 2️⃣ Se não houver variáveis do usuário, cria com base nos defaults globais
  if (!hasVariables) {
    console.log(`[INFO] Nenhuma variável encontrada para ${username}, aplicando defaults globais...`);

    const defaults = await query(`
      SELECT key, value AS default_value
      FROM intranet_global_variables
      WHERE active = TRUE AND is_default = TRUE
    `);

    for (const def of defaults.rows) {
      await query(
        `
        INSERT INTO intranet_user_variables (username, key, value, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (username, key)
        DO NOTHING;
        `,
        [username, def.key, def.default_value]
      );
    }
  }

  // 3️⃣ Retorna as variáveis efetivas (user + fallback default)
  const sql = `
    WITH defaults AS (
      SELECT key, value AS default_value
      FROM intranet_global_variables
      WHERE active = TRUE AND is_default = TRUE
    ),
    distinct_keys AS (
      SELECT DISTINCT key FROM intranet_global_variables WHERE active = TRUE
    )
    SELECT
      k.key,
      COALESCE(u.value, d.default_value) AS value,
      (u.value IS NOT NULL) AS is_user_set,
      (d.default_value IS NOT NULL) AS has_default,
      u.updated_at
    FROM distinct_keys k
    LEFT JOIN defaults d ON d.key = k.key
    LEFT JOIN intranet_user_variables u ON u.key = k.key AND u.username = $1
    ORDER BY k.key;
  `;

  const result = await query(sql, [username]);
  return result.rows;
}

/**
 * 🔧 Cria ou atualiza (upsert) uma variável de usuário.
 * - Atualiza se já existir (mesma username + key)
 * - Insere se não existir
 */
async function upsertUserVariable({ username, key, value }) {
  const sql = `
    INSERT INTO intranet_user_variables (username, key, value, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (username, key)
    DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = NOW()
    RETURNING *;
  `;
  const result = await query(sql, [username, key, value]);
  return result.rows[0];
}

/**
 * 🔍 Busca uma variável específica do usuário
 */
async function getUserVariable(username, key) {
  const sql = `
    SELECT key, value, updated_at
    FROM intranet_user_variables
    WHERE username = $1 AND key = $2
  `;
  const result = await query(sql, [username, key]);
  return result.rows[0];
}

/**
 * ❌ Remove uma variável específica do usuário
 */
async function deleteUserVariable(username, key) {
  await query(
    'DELETE FROM intranet_user_variables WHERE username = $1 AND key = $2',
    [username, key]
  );
  return { success: true };
}

module.exports = {
  getUserVariablesEffective,
  upsertUserVariable,
  getUserVariable,
  deleteUserVariable,
};
