/**
 * Base CRUD Service — padrão para todos os módulos da Intranet
 * Autor: Geovane Prestes
 * Versão: 1.0
 */

const db = require('../config/db_postgres');

/**
 * Cria uma instância de CRUD para uma tabela específica
 * @param {string} tableName Nome da tabela no banco
 * @param {Array<string>} allowedFields Campos que podem ser criados/atualizados
 */
function createCrudService(tableName, allowedFields = []) {
  if (!tableName) throw new Error('O parâmetro tableName é obrigatório.');

  // =====================================================
  // 🔹 LISTAR (todos os registros ativos)
  // =====================================================
  async function findAll(extraFilter = '') {
    const query = `
      SELECT * 
      FROM ${tableName}
      WHERE deleted_at IS NULL
      ${extraFilter ? `AND ${extraFilter}` : ''}
      ORDER BY id;
    `;
    const res = await db.query(query);
    return res.rows;
  }

  // =====================================================
  // 🔹 BUSCAR POR ID
  // =====================================================
  async function findById(id) {
    const res = await db.query(
      `SELECT * FROM ${tableName} WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return res.rows[0];
  }

  // =====================================================
  // 🔹 CRIAR NOVO REGISTRO
  // =====================================================
  async function create(data) {
    const keys = Object.keys(data).filter(k => allowedFields.includes(k));
    const values = keys.map(k => data[k]);
    const placeholders = keys.map((_, i) => `$${i + 1}`);

    if (keys.length === 0) throw new Error('Nenhum campo permitido foi informado.');

    const query = `
      INSERT INTO ${tableName} (${keys.join(', ')}, created_at, updated_at)
      VALUES (${placeholders.join(', ')}, NOW(), NOW())
      RETURNING *;
    `;

    const res = await db.query(query, values);
    return res.rows[0];
  }

  // =====================================================
  // 🔹 ATUALIZAR REGISTRO EXISTENTE
  // =====================================================
  async function update(id, data) {
    const keys = Object.keys(data).filter(k => allowedFields.includes(k));
    const values = keys.map(k => data[k]);
    if (keys.length === 0) throw new Error('Nenhum campo permitido foi informado.');

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const query = `
      UPDATE ${tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1} AND deleted_at IS NULL
      RETURNING *;
    `;

    const res = await db.query(query, [...values, id]);
    return res.rows[0];
  }

  // =====================================================
  // 🔹 SOFT DELETE (exclusão lógica)
  // =====================================================
  async function softDelete(id) {
    const res = await db.query(
      `UPDATE ${tableName}
       SET deleted_at = NOW(), is_active = false
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *;`,
      [id]
    );
    return res.rows[0];
  }

  // =====================================================
  // 🔹 RESTAURAR (opcional)
  // =====================================================
  async function restore(id) {
    const res = await db.query(
      `UPDATE ${tableName}
       SET deleted_at = NULL, is_active = true, updated_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [id]
    );
    return res.rows[0];
  }

  // =====================================================
  // 🔹 DELETE REAL (apenas admin)
  // =====================================================
  async function hardDelete(id) {
    const res = await db.query(
      `DELETE FROM ${tableName} WHERE id = $1`,
      [id]
    );
    return res.rowCount > 0;
  }

  // =====================================================
  // 🔹 Retorna API do CRUD
  // =====================================================
  return {
    findAll,
    findById,
    create,
    update,
    softDelete,
    restore,
    hardDelete
  };
}

module.exports = { createCrudService };
