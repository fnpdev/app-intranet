-- 1. Crie o banco de dados
CREATE DATABASE intranet_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'pt_BR.UTF-8'
    LC_CTYPE = 'pt_BR.UTF-8'
    TEMPLATE = template0;

-- 2. Crie o usuário/aplicação
CREATE USER intranet_user WITH
    ENCRYPTED PASSWORD 'Intr@netFNP2025';

-- 3. Permissões de acesso ao banco
GRANT CONNECT ON DATABASE intranet_db TO intranet_user;

-- 4. Caso use schemas, conceda uso no PUBLIC
\c intranet_db

-- (No banco correto agora)
GRANT USAGE ON SCHEMA public TO intranet_user;
GRANT CREATE ON SCHEMA public TO intranet_user;

-- 5. Permissão total nas tabelas do schema public
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO intranet_user;

-- 6. Permissões futuras em novas tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO intranet_user;

-- (Se quiser liberar também para SEQUENCES -- IDs automáticos)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO intranet_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO intranet_user;
