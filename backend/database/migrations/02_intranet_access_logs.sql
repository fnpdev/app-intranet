CREATE TABLE IF NOT EXISTS intranet_access_logs (
    id SERIAL PRIMARY KEY,
    username VARCHAR(128) NOT NULL,
    login_time TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45),
    success BOOLEAN NOT NULL,
    message TEXT
);

