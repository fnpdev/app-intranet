CREATE TABLE intranet_pages (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES intranet_modules(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,               -- Identificador interno (ex: 'consulta_produto')
  name TEXT NOT NULL,                     -- Nome amigável da página
  layout TEXT DEFAULT 'default',          -- Tipo de layout (ex: default, full, modal)
  path TEXT NOT NULL DEFAULT '/',         -- Caminho da rota
  path_ignore TEXT DEFAULT '',            -- Trecho opcional ignorado
  component TEXT DEFAULT NULL,            -- Nome do componente React (opcional)
  public BOOLEAN DEFAULT FALSE,           -- Página pública ou protegida
  with_layout BOOLEAN DEFAULT TRUE,       -- Usa layout padrão?
  order_index INTEGER DEFAULT 0,          -- Ordem de exibição
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 🌐 Módulo: INTRANET
-- ============================
INSERT INTO intranet_pages (
  module_id, key, name, layout, path, path_ignore, public, with_layout, order_index, active
)
SELECT id, 'dashboard', 'Dashboard', 'default', '/intranet/dashboard', '', FALSE, TRUE, 1, TRUE
FROM intranet_modules WHERE key = 'intranet';

-- ============================
-- 🛒 Módulo: SUPRIMENTOS
-- ============================
INSERT INTO intranet_pages (
  module_id, key, name, layout, path, path_ignore, public, with_layout, order_index, active
)
SELECT id, 'consulta_produto', 'Consulta de Produto', 'default',
       '/suprimentos/consulta-produto/:produto?', '/:produto?', FALSE, TRUE, 1, TRUE
FROM intranet_modules WHERE key = 'suprimentos';

INSERT INTO intranet_pages (
  module_id, key, name, layout, path, path_ignore, public, with_layout, order_index, active
)
SELECT id, 'consulta_sc', 'Consulta de SC', 'default',
       '/suprimentos/consulta-sc/:sc?', '/:sc?', FALSE, TRUE, 2, TRUE
FROM intranet_modules WHERE key = 'suprimentos';

INSERT INTO intranet_pages (
  module_id, key, name, layout, path, path_ignore, public, with_layout, order_index, active
)
SELECT id, 'consulta_sa', 'Consulta de SA', 'default',
       '/suprimentos/consulta-sa/:sa?', '/:sa?', FALSE, TRUE, 3, TRUE
FROM intranet_modules WHERE key = 'suprimentos';

-- ============================
-- 👥 Módulo: RH
-- ============================
INSERT INTO intranet_pages (
  module_id, key, name, layout, path, path_ignore, public, with_layout, order_index, active
)
SELECT id, 'solicitacoes', 'Solicitações', 'default',
       '/rh/solicitacoes', '', FALSE, TRUE, 1, TRUE
FROM intranet_modules WHERE key = 'rh';

-- ============================
-- 🔓 Módulo: PÚBLICO
-- ============================
INSERT INTO intranet_pages (
  module_id, key, name, layout, path, path_ignore, public, with_layout, order_index, active
)
SELECT id, 'home', 'Página Inicial', 'default',
       '/', '', TRUE, TRUE, 1, TRUE
FROM intranet_modules WHERE key = 'public';

INSERT INTO intranet_pages (
  module_id, key, name, layout, path, path_ignore, public, with_layout, order_index, active
)
SELECT id, 'login', 'Login', 'default',
       '/login', '', TRUE, FALSE, 2, TRUE
FROM intranet_modules WHERE key = 'public';
