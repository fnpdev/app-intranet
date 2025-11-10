-- ===============================================================
-- BPMN - Processo: Entrada de Nota Fiscal
-- ===============================================================
-- Prefixo padrão: bpmn_
-- ===============================================================

-- ===========================================
-- 1️⃣ Cadastro do processo principal
-- ===========================================
INSERT INTO bpmn_services (name, description, category, version, active, bpmn_file, created_by)
VALUES 
('Entrada de Nota Fiscal', 
 'Fluxo para registrar, validar e aprovar a entrada de notas fiscais de fornecedores.', 
 'Financeiro', 
 1, 
 TRUE, 
 'entrada_nf.bpmn',
 1)
RETURNING id;

-- ⚠️ Guarde o ID retornado (ex: 1)
-- Para referência, vamos assumir que o ID = 1 no restante do script
-- ===============================================================

-- ===========================================
-- 2️⃣ Grupos e responsáveis
-- ===========================================
INSERT INTO bpmn_groups (name, description)
VALUES 
('Solicitante', 'Usuários que cadastram as NFs'),
('Financeiro', 'Responsáveis pela validação financeira da NF'),
('Gerência', 'Aprovadores finais das notas fiscais');

-- IDs assumidos:
-- 1 = Solicitante
-- 2 = Financeiro
-- 3 = Gerência
-- ===============================================================

-- ===========================================
-- 3️⃣ Mapeamento de usuários nos grupos
-- (ajuste os user_id conforme sua tabela de usuários AD/intranet)
-- ===========================================
INSERT INTO bpmn_group_users (group_id, user_id)
VALUES
(1, 1),  -- João - Solicitante
(1, 2),  -- Maria - Solicitante
(2, 1),  -- Paulo - Financeiro
(3, 1);  -- Ana - Gerência
-- ===============================================================


-- ===========================================
-- 4️⃣ Etapas do fluxo
-- ===========================================
INSERT INTO bpmn_service_flows (service_id, step, name, group_id, next_step, rule_expression, is_manual)
VALUES
(1, 1, 'Cadastro da NF', 1, 2, NULL, TRUE),
(1, 2, 'Validação Financeira', 2, 3, NULL, TRUE),
(1, 3, 'Aprovação Gerencial', 3, NULL, NULL, TRUE);
-- ===============================================================


-- ===========================================
-- 5️⃣ Formulário - Etapa 1: Cadastro da NF
-- ===========================================
INSERT INTO bpmn_service_forms (service_id, step, name, status, form_schema)
VALUES
(1, 1, 'Cadastro da NF', 'active',
'{
  "title": "Cadastro da Nota Fiscal",
  "fields": [
    { "name": "numero_nf", "label": "Número da NF", "type": "text", "required": true },
    { "name": "fornecedor", "label": "Fornecedor", "type": "select", "optionsApi": "/api/fornecedores", "required": true },
    { "name": "data_emissao", "label": "Data de Emissão", "type": "date", "required": true },
    { "name": "valor_total", "label": "Valor Total (R$)", "type": "number", "required": true },
    { "name": "anexo_xml", "label": "XML da NF", "type": "file", "required": true }
  ],
  "actions": [
    { "label": "Enviar para validação", "api": "/workflow/start", "method": "POST" }
  ]
}');
-- ===============================================================


-- ===========================================
-- 6️⃣ Formulário - Etapa 2: Validação Financeira
-- ===========================================
INSERT INTO bpmn_service_forms (service_id, step, name, status, form_schema)
VALUES
(1, 2, 'Validação Financeira', 'active',
'{
  "title": "Validação Financeira",
  "fields": [
    { "name": "valor_total", "label": "Valor Total", "type": "number", "readOnly": true },
    { "name": "fornecedor", "label": "Fornecedor", "type": "text", "readOnly": true },
    { "name": "centro_custo", "label": "Centro de Custo", "type": "select", "optionsApi": "/api/centroCusto", "required": true },
    { "name": "observacao", "label": "Observações", "type": "textarea" }
  ],
  "actions": [
    { "label": "Aprovar", "api": "/workflow/advance", "method": "POST", "params": { "status": "approved" } },
    { "label": "Rejeitar", "api": "/workflow/reject", "method": "POST", "params": { "status": "rejected" } }
  ]
}');
-- ===============================================================


-- ===========================================
-- 7️⃣ Formulário - Etapa 3: Aprovação Gerencial
-- ===========================================
INSERT INTO bpmn_service_forms (service_id, step, name, status, form_schema)
VALUES
(1, 3, 'Aprovação Gerencial', 'active',
'{
  "title": "Aprovação Final da Nota Fiscal",
  "fields": [
    { "name": "valor_total", "label": "Valor Total", "type": "number", "readOnly": true },
    { "name": "fornecedor", "label": "Fornecedor", "type": "text", "readOnly": true },
    { "name": "justificativa", "label": "Justificativa", "type": "textarea" }
  ],
  "actions": [
    { "label": "Aprovar", "api": "/workflow/complete", "method": "POST", "params": { "status": "approved" } },
    { "label": "Reprovar", "api": "/workflow/complete", "method": "POST", "params": { "status": "rejected" } }
  ]
}');
-- ===============================================================


-- ===========================================
-- 8️⃣ Log inicial do processo
-- ===========================================
INSERT INTO bpmn_logs (instance_id, step, actor_id, action, log_message)
VALUES
(NULL, NULL, 1, 'register', 'Processo Entrada de NF cadastrado no catálogo BPMN.');
-- ===============================================================


-- ===========================================
-- ✅ FIM DO SCRIPT
-- ===============================================================
