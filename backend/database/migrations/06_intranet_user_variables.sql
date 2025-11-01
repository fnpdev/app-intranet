CREATE TABLE intranet_user_variables (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value VARCHAR(100) NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (username, key)
);

-- Índices
CREATE INDEX idx_user_variables_user ON intranet_user_variables(username);
CREATE INDEX idx_user_variables_key ON intranet_user_variables(key);