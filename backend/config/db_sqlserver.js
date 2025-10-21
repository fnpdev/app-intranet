// config/database.js
const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT || '30000'),
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    idleTimeoutMillis: 30000,
  },
};

// Pool de conexões global
let pool = null;

/**
 * Obtém ou cria o pool de conexões
 */
const getPool = async () => {
  if (!pool) {
    try {
      pool = await sql.connect(dbConfig);
      console.log('✅ Conexão com SQL Server estabelecida com sucesso');
      
      // Listener para erros de conexão
      pool.on('error', (err) => {
        console.error('❌ Erro no pool de conexões SQL Server:', err);
        pool = null; // Reseta o pool para forçar reconexão
      });
    } catch (err) {
      console.error('❌ Erro ao conectar ao SQL Server:', err);
      throw err;
    }
  }
  return pool;
};

/**
 * Fecha o pool de conexões
 */
const closePool = async () => {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('🔌 Pool de conexões SQL Server fechado');
  }
};

module.exports = {
  sql,
  getPool,
  closePool,
  dbConfig,
};
