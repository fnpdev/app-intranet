const { createCrudService } = require('./baseCrudService');
const db = require('../config/db_postgres');

// ============================================================
// 🧱 CAMPOS PERMITIDOS
// ============================================================
const allowedFieldsVariables = [
  'description',
  'is_active',
  'order',
];

const allowedFieldsVariableOptions = [
  'variable_id',
  'value',
  'description',
  'is_default',
  'is_active'
];

// ============================================================
// ⚙️ CRUD GENÉRICO
// ============================================================
const variablesCrud = createCrudService('intranet_variables', allowedFieldsVariables);
const variableOptionsCrud = createCrudService('intranet_variable_options', allowedFieldsVariableOptions);

// ============================================================
// 🔍 Retorna todas as variáveis globais com suas opções
// ============================================================
async function getAllVariables() {
  const sql = `
    SELECT 
      v.id AS variable_id,
      v.description AS variable_description,
      v.is_active,
      COALESCE(
        json_agg(
          json_build_object(
            'id', o.id,
            'value', o.value,
            'description', o.description,
            'is_default', o.is_default
          ) ORDER BY o.value
        ) FILTER (WHERE o.id IS NOT NULL),
        '[]'::json
      ) AS options
    FROM intranet_variables v
    LEFT JOIN intranet_variable_options o 
      ON o.variable_id = v.id AND o.is_active = TRUE
    WHERE v.is_active = TRUE
    GROUP BY v.id, v.description, v.is_active
    ORDER BY v.id;
  `;

  const result = await db.query(sql);
  return result.rows.map(row => ({
    id: row.variable_id,
    description: row.variable_description,
    is_active: row.is_active,
    options: row.options || [],
  }));
}

// ============================================================
// 🔍 Retorna uma variável específica com suas opções
// ============================================================
async function getVariableById(variableId) {
  const sql = `
    SELECT 
      v.id AS variable_id,
      v.description AS variable_description,
      v.is_active,
      COALESCE(
        json_agg(
          json_build_object(
            'id', o.id,
            'value', o.value,
            'description', o.description,
            'is_default', o.is_default
          ) ORDER BY o.value
        ) FILTER (WHERE o.id IS NOT NULL),
        '[]'::json
      ) AS options
    FROM intranet_variables v
    LEFT JOIN intranet_variable_options o 
      ON o.variable_id = v.id AND o.is_active = TRUE
    WHERE v.id = $1
    GROUP BY v.id, v.description, v.is_active;
  `;

  const result = await db.query(sql, [variableId]);
  return result.rows[0] || null;
}

module.exports = {
  variablesService: {
    ...variablesCrud,
    getAllVariables,
    getVariableById,
    createDefinition: variablesCrud.create,
    updateDefinition: variablesCrud.update,
    deactivateDefinition: variablesCrud.softDelete
  },
  variableOptionsService: {
    ...variableOptionsCrud
  }
};
