// services/logService.js
const { query  } = require('../config/db_postgres');
require('dotenv').config();

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
    await query(
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



