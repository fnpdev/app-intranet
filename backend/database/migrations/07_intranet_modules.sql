CREATE TABLE intranet_modules (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,          -- Identificador interno (ex: 'suprimentos')
  name TEXT NOT NULL,                -- Nome amigável (ex: 'Suprimentos')
  description TEXT,                  -- Descrição detalhada (opcional)
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 🌐 Módulo: INTRANET
-- ============================
INSERT INTO intranet_modules (key, name, description, active)
VALUES ('intranet', 'Intranet', 'Módulo principal da Intranet corporativa', TRUE)
ON CONFLICT (key) DO NOTHING;

-- ============================
-- 🛒 Módulo: SUPRIMENTOS
-- ============================
INSERT INTO intranet_modules (key, name, description, active)
VALUES ('suprimentos', 'Suprimentos', 'Gestão de materiais, produtos e solicitações de compra', TRUE)
ON CONFLICT (key) DO NOTHING;

-- ============================
-- 👥 Módulo: RH
-- ============================
INSERT INTO intranet_modules (key, name, description, active)
VALUES ('rh', 'Recursos Humanos', 'Gestão de solicitações e informações de colaboradores', TRUE)
ON CONFLICT (key) DO NOTHING;

-- ============================
-- 🔓 Módulo: PÚBLICO
-- ============================
INSERT INTO intranet_modules (key, name, description, active)
VALUES ('public', 'Público', 'Páginas acessíveis sem autenticação', TRUE)
ON CONFLICT (key) DO NOTHING;
