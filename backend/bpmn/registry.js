// ================================================================
// PATH: backend/bpmn/dynamicRegistry.js
// 🔹 Carrega dinamicamente os serviços BPMN do banco de dados
// 🔹 Registra as chaves em versões normalizadas (ex: RegistrarNF, registrarnf)
// ================================================================

const db = require('../config/db');

function normalizeKey(text) {
  return text
    ?.toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
}

async function getDynamicRegistry() {
  const result = await db.query(`
    SELECT name
    FROM bpmn_services
    WHERE active = TRUE
  `);

  const registry = {};

  for (const row of result.rows) {
    const serviceName = row.name;
    const normalized = normalizeKey(serviceName);

    // 🔧 Mock temporário de execução — substitua pelo código real
    const fn = async (api, next) => {
      console.log(`[SERVICE] ▶️ Executando serviço '${serviceName}'`);
      // Simula delay e log
      await new Promise((r) => setTimeout(r, 500));
      console.log(`[SERVICE] ✅ Serviço '${serviceName}' finalizado`);
      next();
    };

    // Registra tanto a versão original quanto a normalizada
    registry[serviceName] = fn;
    registry[normalized] = fn;
  }

  console.log(`🧩 Serviços BPMN dinâmicos carregados: [ ${Object.keys(registry).join(', ')} ]`);
  return registry;
}

module.exports = { getDynamicRegistry };
