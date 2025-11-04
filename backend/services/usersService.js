const { createCrudService } = require('./baseCrudService');
const db = require('../config/db_postgres');

// ============================================================
// 🧱 CAMPOS PERMITIDOS
// ============================================================
const allowedFieldsUsers = [
  'username',
  'name',
  'email',
  'user_level',
  'is_active',
  'ad_account'
];

const allowedFieldsUserPermissions = [
  'user_id',
  'module_id',
  'is_active'
];

// ============================================================
// ⚙️ CRUD GENÉRICO
// ============================================================
const userCrud = createCrudService('intranet_users', allowedFieldsUsers);
const userPermissionCrud = createCrudService('intranet_user_permissions', allowedFieldsUserPermissions);

// ============================================================
// 👤 USUÁRIO — Funções específicas
// ============================================================
async function updateLastLogin(userId) {
  await db.query(`
    UPDATE intranet_users
    SET last_login = NOW(), updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL;
  `, [userId]);
}

async function findOrCreateUser({ username, name, email, ad_account = false }) {
  const result = await db.query(
    `SELECT * FROM intranet_users WHERE username = $1 AND deleted_at IS NULL;`,
    [username]
  );

  if (result.rows.length > 0) return result.rows[0];

  const insert = await db.query(`
    INSERT INTO intranet_users 
      (username, name, email, ad_account, user_level, is_active, created_at, updated_at)
    VALUES ($1, $2, $3, $4, 1, true, NOW(), NOW())
    RETURNING *;
  `, [username, name || username, email || `${username}@empresa.com`, ad_account]);

  return insert.rows[0];
}

// ============================================================
// 🔐 PERMISSÕES DE USUÁRIO
// ============================================================
async function getUserPermissionsByUserId(user_id) {
  const res = await db.query(`
    SELECT m.key, m.name, p.is_active
    FROM intranet_user_permissions p
    JOIN intranet_users u ON u.id = p.user_id
    JOIN intranet_modules m ON m.id = p.module_id
    WHERE u.id = $1
      AND u.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND m.deleted_at IS NULL
      AND p.is_active = true
      AND m.is_active = true;
  `, [user_id]);

  const permissions = {};
  res.rows.forEach(row => {
    permissions[row.key] = true;
  });

  return permissions;
}

// ============================================================
// ⚙️ VARIÁVEIS DE USUÁRIO
// ============================================================
async function getUserVariablesEffective(user_id) {
  // Cria variáveis padrão se não existirem
  const { rows: existing } = await db.query(
    'SELECT COUNT(*)::int AS total FROM intranet_user_variables WHERE user_id = $1;',
    [user_id]
  );

  if (existing[0]?.total === 0) {
    
    const defaults = await db.query(`
      SELECT v.id AS variable_id, o.value AS default_value
      FROM intranet_variable_options o
      JOIN intranet_variables v ON v.id = o.variable_id
      WHERE o.is_active = TRUE AND o.is_default = TRUE;
    `);

    for (const def of defaults.rows) {
      await db.query(`
        INSERT INTO intranet_user_variables (user_id, variable_id, value, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, variable_id)
        DO NOTHING;
      `, [user_id, def.variable_id, def.default_value]);
    }
  }

  // Retorna variáveis efetivas
  const sql = `
    SELECT
      v.id AS variable_id,
      v.description AS variable_description,
      v.key AS key,
      COALESCE(uv.value, o.value) AS value,
      (uv.value IS NOT NULL) AS is_user_set,
      (o.is_default IS TRUE) AS has_default,
      uv.updated_at
    FROM intranet_variables v
    LEFT JOIN intranet_variable_options o
      ON o.variable_id = v.id AND o.is_default = TRUE
    LEFT JOIN intranet_user_variables uv
      ON uv.variable_id = v.id AND uv.user_id = $1
    WHERE v.is_active = TRUE
    ORDER BY v.id;
  `;
  const result = await db.query(sql, [user_id]);
  return result.rows;
}

async function upsertUserVariable({ user_id, variable_id, value }) {
  const result = await db.query(`
    INSERT INTO intranet_user_variables (user_id, variable_id, value, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id, variable_id)
    DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = NOW()
    RETURNING *;
  `, [user_id, variable_id, value]);
  return result.rows[0];
}

async function getUserVariable(user_id, variable_id) {
  const result = await db.query(`
    SELECT variable_id, value, updated_at
    FROM intranet_user_variables
    WHERE user_id = $1 AND variable_id = $2;
  `, [user_id, variable_id]);
  return result.rows[0];
}

// ============================================================
// 👤 /api/users/me
// ============================================================
async function getUserMe(username) {
  const { rows } = await db.query(`
    SELECT id, username, name, email, user_level, is_active, ad_account, last_login
    FROM intranet_users
    WHERE username = $1;
  `, [username]);

  const dbUser = rows[0];
  if (!dbUser) return null;

  const variables = await getUserVariablesEffective(dbUser.id);

  const modulesRes = await db.query(`
    SELECT 
      m.id AS module_id,
      m.key AS module_key,
      m.name AS module_name,
      m.description AS module_description,
      json_agg(
        json_build_object(
          'id', p.id,
          'key', p.key,
          'label', p.name,
          'path', p.path,
          'public', p.is_public,
          'withLayout', p.with_layout,
          'component', p.component,
          'pathIgnore', p.path_ignore
        )
      ) AS pages
    FROM intranet_users u
    JOIN intranet_user_permissions iup ON iup.user_id = u.id AND iup.is_active = TRUE
    JOIN intranet_modules m ON m.id = iup.module_id AND m.is_active = TRUE
    JOIN intranet_pages p ON p.module_id = m.id AND p.is_active = TRUE
    WHERE u.id = $1
    GROUP BY m.id, m.key, m.name, m.description
    ORDER BY m.id;
  `, [dbUser.id]);

  return {
    ...dbUser,
    variables,
    modules: modulesRes.rows || [],
  };
}

// ============================================================
// 📦 EXPORTAÇÃO FINAL
// ============================================================
module.exports = {
  usersService: {
    ...userCrud,
    updateLastLogin,
    findOrCreateUser,
    getUserMe
  },

  permissionsService: {
    ...userPermissionCrud,
    getUserPermissionsByUserId
  },

  variablesService: {
    getUserVariablesEffective,
    upsertUserVariable,
    getUserVariable
  }
};
