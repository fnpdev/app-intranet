-- ===============================================================
-- 🔹 BPMN - ESTRUTURA DE CONTROLE DE SERVIÇOS E WORKFLOWS
-- ===============================================================
-- Prefixo padrão: bpmn_
-- Banco: mesmo da Intranet
-- Autor: Geovane Prestes
-- Data: 2025-11-08
-- ===============================================================

-- ===========================================
-- 1️⃣ TABELA: bpmn_services
-- Tipos de processos disponíveis
-- ===========================================
CREATE TABLE public.bpmn_services (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	description text NULL,
	category varchar(50) NULL,
	"version" int4 DEFAULT 1 NULL,
	active bool DEFAULT true NULL,
	created_by int4 NULL,
	updated_by int4 NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	bpmn_xml text NULL,
	CONSTRAINT bpmn_services_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_bpmn_services_name ON public.bpmn_services USING btree (name);

-- ===========================================
-- 2️⃣ TABELA: bpmn_service_forms
-- Estrutura JSON dos formulários por etapa
-- ===========================================
CREATE TABLE IF NOT EXISTS bpmn_service_forms (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL REFERENCES bpmn_services(id) ON DELETE CASCADE,
    step INT NOT NULL,
    name VARCHAR(100),
    status VARCHAR(30) DEFAULT 'draft',
    form_schema JSONB NOT NULL,         -- estrutura JSON do formulário dinâmico
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(service_id, step)
);

CREATE INDEX IF NOT EXISTS idx_bpmn_forms_service_step ON bpmn_service_forms (service_id, step);


-- ===========================================
-- 3️⃣ TABELA: bpmn_service_flows
-- Controle de sequência de etapas e grupos responsáveis
-- ===========================================
CREATE TABLE IF NOT EXISTS bpmn_service_flows (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL REFERENCES bpmn_services(id) ON DELETE CASCADE,
    step INT NOT NULL,
    name VARCHAR(100),
    group_id INT,                         -- grupo responsável pela etapa
    next_step INT,                        -- próxima etapa do fluxo
    rule_expression TEXT,                 -- condição (ex: valor_total > 5000 ? 3 : 4)
    is_manual BOOLEAN DEFAULT FALSE,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(service_id, step)
);

CREATE INDEX IF NOT EXISTS idx_bpmn_flows_service_step ON bpmn_service_flows (service_id, step);



-- ===========================================
-- 🔹 TABELA: bpmn_service_tasks
-- Scripts de execução das tarefas BPMN
-- ===========================================
CREATE TABLE IF NOT EXISTS bpmn_service_tasks (
    id SERIAL PRIMARY KEY,
    service_id INT REFERENCES bpmn_services(id) ON DELETE CASCADE, -- opcional: vincula ao processo
    name VARCHAR(100) NOT NULL,              -- nome da task (ex: RegistrarNF)
    description TEXT,
    version INT DEFAULT 1,
    active BOOLEAN DEFAULT TRUE,
    script TEXT NOT NULL,                    -- código JS da função (handler)
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name, version)
);

CREATE INDEX IF NOT EXISTS idx_bpmn_service_tasks_name ON bpmn_service_tasks (LOWER(name));
COMMENT ON TABLE bpmn_service_tasks IS 'Handlers dinâmicos de execução para ServiceTasks BPMN';



-- ===========================================
-- 4️⃣ TABELA: bpmn_groups
-- Grupos responsáveis pelas etapas
-- ===========================================
CREATE TABLE IF NOT EXISTS bpmn_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bpmn_groups_name ON bpmn_groups (LOWER(name));


-- ===========================================
-- 5️⃣ TABELA: bpmn_group_users
-- Relacionamento grupo <-> usuário
-- ===========================================
CREATE TABLE IF NOT EXISTS bpmn_group_users (
    group_id INT REFERENCES bpmn_groups(id) ON DELETE CASCADE,
    user_id INT REFERENCES intranet_users (id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bpmn_group_users_user ON bpmn_group_users (user_id);


-- ===========================================
-- 6️⃣ TABELA: bpmn_service_instances
-- Cada execução de um processo
-- ===========================================
CREATE TABLE IF NOT EXISTS bpmn_service_instances (
    id SERIAL PRIMARY KEY,
    service_id INT REFERENCES bpmn_services(id) ON DELETE CASCADE,
    instance_uuid UUID DEFAULT gen_random_uuid(),
    group_id INT REFERENCES bpmn_groups(id),
    title VARCHAR(150),
    status VARCHAR(30) DEFAULT 'in_progress',  -- in_progress, completed, cancelled, error
    current_step INT DEFAULT 1,
    form_data JSONB DEFAULT '{}',
    bpmn_state JSONB DEFAULT '{}',             -- estado serializado do engine (opcional)
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bpmn_instances_status ON bpmn_service_instances (status);
CREATE INDEX IF NOT EXISTS idx_bpmn_instances_service ON bpmn_service_instances (service_id);


-- ===========================================
-- 7️⃣ TABELA: bpmn_instance_steps
-- Etapas executadas dentro de uma instância
-- ===========================================
CREATE TABLE IF NOT EXISTS bpmn_instance_steps (
    id SERIAL PRIMARY KEY,
    instance_id INT NOT NULL REFERENCES bpmn_service_instances(id) ON DELETE CASCADE,
    step INT NOT NULL,
    actor_id INT,
    started_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP,
    status VARCHAR(30) DEFAULT 'pending',      -- pending, completed, error
    data JSONB DEFAULT '{}',
    UNIQUE(instance_id, step)
);

CREATE INDEX IF NOT EXISTS idx_bpmn_steps_instance ON bpmn_instance_steps (instance_id);


-- ===========================================
-- 8️⃣ TABELA: bpmn_logs
-- Histórico detalhado e auditoria
-- ===========================================
CREATE TABLE IF NOT EXISTS bpmn_logs (
    id SERIAL PRIMARY KEY,
    instance_id INT REFERENCES bpmn_service_instances(id) ON DELETE CASCADE,
    step INT,
    actor_id INT,
    action VARCHAR(100),
    log_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bpmn_logs_instance ON bpmn_logs (instance_id);
CREATE INDEX IF NOT EXISTS idx_bpmn_logs_step ON bpmn_logs (step);


-- ===========================================
-- 9️⃣ VIEWS - Monitoramento e BI
-- ===========================================

-- 🔹 View: Instâncias em andamento
CREATE OR REPLACE VIEW vw_bpmn_active_instances AS
SELECT 
  si.id AS instance_id,
  s.name AS service_name,
  si.title,
  si.status,
  si.current_step,
  si.created_by,
  si.created_at
FROM bpmn_service_instances si
JOIN bpmn_services s ON s.id = si.service_id
WHERE si.status = 'in_progress';

-- 🔹 View: Histórico consolidado
CREATE OR REPLACE VIEW vw_bpmn_instance_history AS
SELECT 
  si.id AS instance_id,
  s.name AS service_name,
  sis.step,
  sis.status,
  sis.started_at,
  sis.finished_at,
  sl.log_message,
  si.created_by
FROM bpmn_service_instances si
JOIN bpmn_services s ON s.id = si.service_id
LEFT JOIN bpmn_instance_steps sis ON sis.instance_id = si.id
LEFT JOIN bpmn_logs sl ON sl.instance_id = si.id;

-- 🔹 View: Estatísticas por tipo de processo
CREATE OR REPLACE VIEW vw_bpmn_summary AS
SELECT 
  s.name AS service_name,
  COUNT(si.id) AS total_instances,
  SUM(CASE WHEN si.status = 'completed' THEN 1 ELSE 0 END) AS total_completed,
  SUM(CASE WHEN si.status = 'in_progress' THEN 1 ELSE 0 END) AS total_in_progress,
  SUM(CASE WHEN si.status = 'error' THEN 1 ELSE 0 END) AS total_errors,
  MIN(si.created_at) AS first_execution,
  MAX(si.updated_at) AS last_execution
FROM bpmn_service_instances si
JOIN bpmn_services s ON s.id = si.service_id
GROUP BY s.name;

-- ===========================================
-- 🔹 ÍNDICES DE PERFORMANCE ADICIONAIS
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_bpmn_logs_created_at ON bpmn_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_bpmn_instances_created_at ON bpmn_service_instances (created_at);
CREATE INDEX IF NOT EXISTS idx_bpmn_steps_status ON bpmn_instance_steps (status);

-- ===========================================
-- 🔹 FINALIZAÇÃO
-- ===========================================
COMMENT ON SCHEMA public IS 'Estrutura de controle de processos BPMN - Intranet';
