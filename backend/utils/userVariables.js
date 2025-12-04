const db = require('../config/db_postgres');

/**
 * Retorna as variáveis do usuário em formato OBJETO:
 * {
 *   competencia: "202502",
 *   fazenda: "1",
 *   setor: "SUP",
 *   ...
 * }
 */
async function getUserVarsObject(user_id) {
    const sql = `
        SELECT var.key, uvar.value
          FROM intranet_user_variables uvar
          LEFT JOIN intranet_variables var 
            ON var.id = uvar.variable_id
         WHERE uvar.user_id = $1;
    `;

    const { rows } = await db.query(sql, [user_id]);

    const vars = {};
    rows.forEach(r => {
        vars[r.key] = r.value;
    });

    return vars;
}

module.exports = { getUserVarsObject };
