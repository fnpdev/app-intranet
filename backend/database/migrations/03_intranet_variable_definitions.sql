CREATE TABLE intranet_variable_definitions (
  key VARCHAR(50) PRIMARY KEY,
  description VARCHAR(200) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);