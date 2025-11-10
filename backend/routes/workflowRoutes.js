const express = require('express');
const { startWorkflow } = require('../bpmn/engine');
const db = require('../config/db_postgres');
const { createInstanceRecord, getWorkflowDefinition } = require('../services/workflowService');

const router = express.Router();

/**
 * 🔹 Inicia uma nova instância de workflow
 */

  
router.post('/service', async (req, res) => {
  try {
    const { definitionName, service_id, user_id, variables } = req.body;
    const result = await getWorkflowDefinition(definitionName);

    res.json({ success: true, message: 'Workflow iniciado', result });
  } catch (err) {
    console.error('[BPMN] Erro ao iniciar workflow:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/start', async (req, res) => {
  try {
    const { definitionName, service_id, user_id, variables } = req.body;
    const result = await startWorkflow(definitionName, { ...variables, service_id, user_id });
    const record = await createInstanceRecord(service_id, result.instanceId, result.status, user_id);

    res.json({ success: true, message: 'Workflow iniciado', record });
  } catch (err) {
    console.error('[BPMN] Erro ao iniciar workflow:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 🔹 Lista todas as instâncias de workflow
 *    - Filtros opcionais: status, service_id, created_by
 */
router.get('/instances', async (req, res) => {
  try {
    const { status, service_id, created_by } = req.query;
    const filters = [];
    const params = [];

    if (status) {
      params.push(status);
      filters.push(`si.status = $${params.length}`);
    }
    if (service_id) {
      params.push(service_id);
      filters.push(`si.service_id = $${params.length}`);
    }
    if (created_by) {
      params.push(created_by);
      filters.push(`si.created_by = $${params.length}`);
    }

    const where = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const { rows } = await db.query(
      `
      SELECT 
        si.id,
        si.instance_uuid,
        s.name AS service_name,
        si.title,
        si.status,
        si.current_step,
        si.created_by,
        si.created_at,
        si.updated_at
      FROM bpmn_service_instances si
      JOIN bpmn_services s ON s.id = si.service_id
      ${where}
      ORDER BY si.created_at DESC
      `,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[BPMN] Erro ao listar instâncias:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 🔹 Consulta detalhada de uma instância específica
 * Inclui dados do processo, etapas e logs
 */
router.get('/instances/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;

    const { rows: instanceRows } = await db.query(
      `
      SELECT 
        si.id,
        si.instance_uuid,
        s.name AS service_name,
        s.description AS service_description,
        si.status,
        si.current_step,
        si.form_data,
        si.bpmn_state,
        si.created_by,
        si.created_at,
        si.updated_at
      FROM bpmn_service_instances si
      JOIN bpmn_services s ON s.id = si.service_id
      WHERE si.instance_uuid = $1
      `,
      [uuid]
    );

    if (instanceRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Instância não encontrada' });
    }

    const instance = instanceRows[0];

    // Busca steps dessa instância
    const { rows: steps } = await db.query(
      `
      SELECT 
        step, 
        actor_id, 
        status, 
        data, 
        started_at, 
        finished_at
      FROM bpmn_instance_steps
      WHERE instance_id = $1
      ORDER BY started_at ASC
      `,
      [instance.id]
    );

    // Busca logs dessa instância
    const { rows: logs } = await db.query(
      `
      SELECT 
        id, 
        step, 
        actor_id, 
        action, 
        log_message, 
        created_at
      FROM bpmn_logs
      WHERE instance_id = $1
      ORDER BY created_at ASC
      `,
      [instance.id]
    );

    res.json({
      success: true,
      data: {
        instance,
        steps,
        logs
      }
    });
  } catch (err) {
    console.error('[BPMN] Erro ao consultar instância:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
