// config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Configuração do PostgreSQL
const dbConfig = {
  host: process.env.DB_PG_HOST_SAAM || 'localhost',
  port: parseInt(process.env.DB_PG_PORT_SAAM || '5432'),
  database: process.env.DB_PG_NAME_SAAM,
  user: process.env.DB_PG_USER_SAAM,
  password: process.env.DB_PG_PASS_SAAM,
  
  ssl: process.env.DB_PG_SSL_SAAM === 'true' ? {
    rejectUnauthorized: false
  } : false,
  
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
  query_timeout: parseInt(process.env.DB_REQUEST_TIMEOUT || '30000'),
  statement_timeout: parseInt(process.env.DB_REQUEST_TIMEOUT || '30000'),
  
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

let pool = null;

const getPool = async () => {
  if (!pool) {
    try {
      pool = new Pool(dbConfig);
      
      const client = await pool.connect();
      console.log('✅ Conexão com PostgreSQL estabelecida com sucesso - SAAM');
      client.release();
      
      pool.on('error', (err) => {
        console.error('❌ Erro no pool de conexões PostgreSQL:', err);
        pool = null;
      });
      
    } catch (err) {
      console.error('❌ Erro ao conectar ao PostgreSQL:', err);
      pool = null;
      throw err;
    }
  }
  
  return pool;
};

const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 Pool de conexões PostgreSQL fechado');
  }
};

const query = async (text, params) => {
  const poolInstance = await getPool();
  try {
    const result = await poolInstance.query(text, params);
    return result;
  } catch (err) {
    console.error('❌ Erro ao executar query:', err);
    throw err;
  }
};

const getClient = async () => {
  const poolInstance = await getPool();
  return await poolInstance.connect();
};

// IMPORTANTE: Certifique-se de que está exportando a função query
module.exports = {
  getPool,
  closePool,
  query,
  getClient
};
