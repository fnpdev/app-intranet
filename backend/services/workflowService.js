// ================================================================
// PATH: backend/services/workflowService.js
// Serviço responsável por persistência e controle BPMN no PostgreSQL
// ================================================================

const db = require('../config/db_postgres');
const dayjs = require('dayjs');

// 🔹 Cria uma nova instância de workflow
async function createInstanceRecord(service_id, instance_uuid, status, user_id, current_step = 1, form_data = {}) {
  const title = `Instância ${instance_uuid}`;
  const { rows } = await db.query(
    `INSERT INTO bpmn_service_instances (
        service_id, instance_uuid, title, status, current_step, created_by, form_data, created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING id, service_id, instance_uuid, status, current_step`,
    [service_id, instance_uuid, title, status, current_step, user_id, form_data]
  );
  return rows[0];
}

// 🔹 Registra o início ou fim de uma etapa
async function registerStep(instance_id, step, actor_id, status = 'pending', data = {}) {
  const { rows } = await db.query(
    `INSERT INTO bpmn_instance_steps (
        instance_id, step, actor_id, status, data, started_at
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (instance_id, step)
     DO UPDATE SET 
        status = EXCLUDED.status,
        data = EXCLUDED.data,
        finished_at = CASE WHEN EXCLUDED.status='completed' THEN NOW() ELSE NULL END
     RETURNING id, status, step`,
    [instance_id, step, actor_id, status, data, dayjs().toISOString()]
  );
  return rows[0];
}

// 🔹 Registra logs de eventos
async function registerLog(instance_id, step, actor_id, action, log_message) {
  try {
    await db.query(
      `INSERT INTO bpmn_logs (instance_id, step, actor_id, action, log_message, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [instance_id, step, actor_id, action, log_message]
    );
  } catch (err) {
    console.error(`[BPMN] Erro ao registrar log:`, err.message);
  }
}

// 🔹 Atualiza status da instância
async function updateInstanceStatus(instance_uuid, status, current_step = null) {
  const params = [status];
  let query = `UPDATE bpmn_service_instances SET status = $1, updated_at = NOW()`;

  if (current_step !== null) {
    query += `, current_step = $2`;
    params.push(current_step);
  }

  query += ` WHERE instance_uuid = $${params.length + 1} RETURNING id, status, current_step`;
  params.push(instance_uuid);

  const { rows } = await db.query(query, params);
  return rows[0];
}

// 🔹 Salva estado do engine
async function saveEngineState(instance_uuid, state) {
  await db.query(
    `UPDATE bpmn_service_instances 
        SET bpmn_state = $1, updated_at = NOW() 
      WHERE instance_uuid = $2`,
    [state, instance_uuid]
  );
}

// 🔹 Recupera estado salvo
async function getEngineState(instance_uuid) {
  const { rows } = await db.query(
    `SELECT bpmn_state FROM bpmn_service_instances WHERE instance_uuid = $1`,
    [instance_uuid]
  );
  return rows.length ? rows[0].bpmn_state : null;
}

// 🔹 Busca XML BPMN do banco
async function getWorkflowDefinition(service_name) {
  const { rows } = await db.query(
    `SELECT id, name, version, bpmn_xml, active, updated_at
       FROM bpmn_services
      WHERE LOWER(name) = LOWER($1)
        AND active = TRUE
      ORDER BY version DESC
      LIMIT 1`,
    [service_name]
  );

  if (!rows.length) {
    console.warn(`[BPMN] ⚠️ Serviço '${service_name}' não encontrado no banco.`);
    return null;
  }

  const service = rows[0];
  if (!service.bpmn_xml) {
    console.warn(`[BPMN] ⚠️ O campo bpmn_xml está vazio para '${service_name}'.`);
  }

  return {
    id: service.id,
    name: service.name,
    version: service.version,
    xml: service.bpmn_xml
  };
}

// 🔹 Lista workflows disponíveis
async function listWorkflowDefinitions() {
  const { rows } = await db.query(
    `SELECT id, name, version, category, active, updated_at 
       FROM bpmn_services 
      WHERE active = TRUE 
      ORDER BY name`
  );
  return rows;
}

module.exports = {
  createInstanceRecord,
  registerStep,
  registerLog,
  updateInstanceStatus,
  saveEngineState,
  getEngineState,
  getWorkflowDefinition,
  listWorkflowDefinitions
};
