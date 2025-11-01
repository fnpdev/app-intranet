DROP TABLE IF EXISTS intranet_global_variables;

CREATE TABLE intranet_global_variables (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL,                -- Nome da variável, ex: 'filial_padrao'
  value VARCHAR(100) NOT NULL,              -- Valor técnico, ex: '0101'
  description TEXT,                         -- Descrição amigável, ex: 'Fazenda Piratininga'
  is_default BOOLEAN DEFAULT FALSE,         -- Indica se é o valor padrão
  active BOOLEAN DEFAULT TRUE,              -- Pode desativar valores antigos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (key, value)
);

-- Índice para consultas rápidas
CREATE INDEX idx_intranet_global_variables_key ON intranet_global_variables(key);
