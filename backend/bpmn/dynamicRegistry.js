// ================================================================
// PATH: backend/bpmn/dynamicRegistry.js
// Carrega dinamicamente os handlers BPMN do banco de dados
// ================================================================

const db = require('../config/db_postgres');

async function getDynamicRegistry() {
  const registry = {};

  try {
    const { rows } = await db.query(`
      SELECT name, script
      FROM bpmn_service_tasks
      WHERE active = TRUE AND script IS NOT NULL
    `);

    for (const row of rows) {
      try {
        // ⚠️ Carrega o script do banco (precisa ser uma função JS válida)
        const fn = eval(row.script);
        if (typeof fn === 'function') {
          const key = row.name.replace(/\s+/g, '').trim();
          registry[key] = fn;
        } else {
          console.warn(`[BPMN] ⚠️ Serviço '${row.name}' não retornou função válida.`);
        }
      } catch (err) {
        console.error(`[BPMN] ❌ Erro ao carregar serviço '${row.name}':`, err.message);
      }
    }

    console.log(`🧩 Serviços BPMN dinâmicos carregados: [ ${Object.keys(registry).join(', ')} ]`);
  } catch (err) {
    console.error('[BPMN] ❌ Erro ao montar registry dinâmico:', err);
  }

  return registry;
}

module.exports = { getDynamicRegistry };
