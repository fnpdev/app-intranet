CREATE TABLE IF NOT EXISTS accounting_invoice_receivings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    invoice_key VARCHAR(44) NOT NULL UNIQUE,
    current_step VARCHAR(30) NOT NULL DEFAULT 'GATE',
    message VARCHAR(100),
    note TEXT,
    active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS accounting_invoice_logs (
    id SERIAL PRIMARY KEY,
    id INTEGER NOT NULL REFERENCES accounting_invoice_receivings(id) ON DELETE CASCADE,
    from_step VARCHAR(30),
    to_step VARCHAR(30) NOT NULL,
    message VARCHAR(100),
    user_id INTEGER,
    note TEXT,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW()
);