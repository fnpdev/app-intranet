const { createCrudService } = require('./baseCrudService');
const db = require('../config/db_postgres');

// ============================================================
// 🧱 CAMPOS PERMITIDOS
// ============================================================
const allowedFieldsModules = [
  'key',
  'name',
  'description',
  'route_path',
  'icon',
  'order_index',
  'category',
  'is_active',
  'is_public',
  'is_visible',
  'deleted_at'
];

// ============================================================
// ⚙️ CRUD GENÉRICO
// ============================================================
const modulesCrud = createCrudService('intranet_modules', allowedFieldsModules);


async function getAllModules() {
  const res = await db.query(`
    SELECT 
      m.id AS id,
      m.key AS key,
      m.name AS name,
      m.description AS description,
      m.is_active AS active,
      json_agg(
        json_build_object(
          'key', p.key,
          'label', p.name,
          'path', p.path,
          'public', p.is_public,
          'withLayout', p.with_layout,
          'pathIgnore', p.path_ignore,
          'component', p.component,
          'layout', p.layout
        ) ORDER BY p.order_index
      ) AS pages
    FROM intranet_modules m
    LEFT JOIN intranet_pages p ON p.module_id = m.id AND p.is_active = TRUE
    WHERE m.is_active = TRUE
    GROUP BY m.id, m.key, m.name, m.description, m.is_active
    ORDER BY m.id;
  `);
  return res.rows;
}


module.exports = {
  modulesService: {
    ...modulesCrud,
    getAllModules
  }
};
