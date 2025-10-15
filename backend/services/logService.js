// services/logService.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
});

/**
 * Registra log de autenticação/acesso no banco.
 * @param {Object} log
 * @param {string} log.username
 * @param {string} log.ip_address
 * @param {boolean} log.success
 * @param {string} log.message
 */


async function logEvent({ username, ip_address, success, message }) {
  try {
    await pool.query(
      `INSERT INTO intranet_access_logs (username, ip_address, success, message)
       VALUES ($1, $2, $3, $4)`,
      [username, ip_address, success, message]
    );
  } catch (err) {
    // Log de erro local apenas para debug/admin, não expõe para o app.
    console.error('Erro ao registrar log:', err);
  }
}

module.exports = { logEvent };
