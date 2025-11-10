// ================================================================
// 🔹 Corrige definitivamente o erro "service not defined"
// 🔹 Injeta funções no environment.options.services + behaviour.implementation
// ================================================================

const { Engine } = require('bpmn-engine');
const { v4: uuidv4 } = require('uuid');
const { getDynamicRegistry } = require('./dynamicRegistry');
const {
  createInstanceRecord,
  registerStep,
  registerLog,
  updateInstanceStatus,
  saveEngineState,
  getWorkflowDefinition,
} = require('../services/workflowService');

function normalizeKey(text) {
  return text?.toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
}

async function startWorkflow(definitionName, variables = {}) {
  try {
    const definition = await getWorkflowDefinition(definitionName);
    if (!definition || !definition.xml) {
      throw new Error(`Definição BPMN '${definitionName}' não encontrada ou sem XML.`);
    }

    const source = definition.xml;
    const registry = await getDynamicRegistry();
    const instanceId = uuidv4();

    const instance = await createInstanceRecord(
      variables.service_id,
      instanceId,
      'in_progress',
      variables.user_id
    );

    await registerLog(instance.id, null, variables.user_id, 'start', `Workflow '${definitionName}' iniciado.`);

    console.log(`🚀 Iniciando workflow '${definitionName}' (versão ${definition.version})`);
    console.log(`🧩 Serviços BPMN disponíveis: [ ${Object.keys(registry).join(', ')} ]`);

    // ⚙️ Cria engine
    const engine = new Engine({ name: definitionName, source, variables });
    const env = engine.environment;
    env.services = env.services || {};
    env.options = env.options || {};
    env.options.services = env.options.services || {};

    // 🔧 Injetar serviços normalizados globalmente
    for (const [key, fn] of Object.entries(registry)) {
      const normalized = normalizeKey(key);
      env.services[key] = fn;
      env.services[normalized] = fn;
      env.options.services[key] = fn;
      env.options.services[normalized] = fn;
    }

    console.log(`⚙️ Serviços injetados globalmente: ${Object.keys(env.services).join(', ')}`);

    // 🧠 Garante carregamento das definições antes da execução
    const defs = await engine.getDefinitions();
    const defArray = Array.isArray(defs) ? defs : [defs];

    for (const def of defArray) {
      const defEnv = def.environment || {};
      defEnv.services = defEnv.services || {};
      defEnv.options = defEnv.options || {};
      defEnv.options.services = defEnv.options.services || {};

      // 🔁 Injetar serviços também no nível da definição
      for (const [key, fn] of Object.entries(registry)) {
        const normalized = normalizeKey(key);
        defEnv.services[key] = fn;
        defEnv.services[normalized] = fn;
        defEnv.options.services[key] = fn;
        defEnv.options.services[normalized] = fn;
      }

      // 🔩 Ajustar atividades de serviço
      const activities = def.getActivities ? def.getActivities() : [];
      for (const activity of activities) {
        if (activity.type !== 'bpmn:ServiceTask') continue;

        const behaviour = activity.behaviour || {};
        const xmlAttrs = behaviour.$ || {};

        const topic =
          behaviour['camunda:topic'] ||
          xmlAttrs['camunda:topic'] ||
          behaviour.topic ||
          behaviour.name ||
          activity.id;

        const normalized = normalizeKey(topic);
        const fn =
          registry[normalized] ||
          registry[topic] ||
          registry[topic?.toLowerCase()] ||
          null;

        if (fn) {
          // ⚙️ Configura a implementação
          activity.behaviour.implementation = normalized;

          // 🔗 Injeta diretamente no options.services
          defEnv.options.services[normalized] = fn;
          defEnv.services[normalized] = fn;

          console.log(`🔧 Vinculado ServiceTask '${activity.id}' → '${normalized}'`);
        } else {
          console.warn(`⚠️ Serviço '${normalized}' não encontrado no registry (referenciado em '${activity.id}')`);
        }
      }
    }

    // 🚀 Executa o engine
    engine.execute(
      {
        services: env.options.services,
      },
      async (err, execution) => {
        if (err) {
          await updateInstanceStatus(instanceId, 'error');
          await registerLog(instance.id, null, variables.user_id, 'error', err.message);
          console.error(`[BPMN] ❌ Erro na execução do workflow '${definitionName}':`, err);
          return;
        }

        execution.on('activity.start', async (activity) => {
          console.log(`[BPMN] ▶️ Iniciando atividade: ${activity.id}`);
          await registerStep(instance.id, activity.id, variables.user_id, 'in_progress');
          await registerLog(instance.id, activity.id, variables.user_id, 'activity.start', `Atividade '${activity.id}' iniciada.`);
        });

        execution.on('activity.end', async (activity) => {
          console.log(`[BPMN] ✅ Finalizando atividade: ${activity.id}`);
          await registerStep(instance.id, activity.id, variables.user_id, 'completed');
          await registerLog(instance.id, activity.id, variables.user_id, 'activity.end', `Atividade '${activity.id}' concluída.`);
        });

        execution.once('end', async () => {
          console.log(`[BPMN] 🏁 Workflow '${definitionName}' concluído com sucesso.`);
          await updateInstanceStatus(instanceId, 'completed');
          await registerLog(instance.id, null, variables.user_id, 'end', `Workflow '${definitionName}' finalizado.`);
        });

        execution.on('save', async () => {
          const state = engine.getState();
          await saveEngineState(instanceId, JSON.stringify(state));
        });
      }
    );

    return { instanceId, status: 'in_progress' };
  } catch (error) {
    console.error(`[BPMN] Erro ao iniciar workflow '${definitionName}':`, error);
    throw error;
  }
}

module.exports = { startWorkflow };
