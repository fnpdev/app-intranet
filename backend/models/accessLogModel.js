const pool = require('../config/db');

async function createAccessLog({ username, ip_address, success, message }) {
  return pool.query(
    `INSERT INTO intranet_access_logs (username, ip_address, success, message)
    VALUES ($1, $2, $3, $4)`,
    [username, ip_address, success, message]
  );
}

async function getLogs(limit = 100) {
  const res = await pool.query(
    'SELECT * FROM intranet_access_logs ORDER BY login_time DESC LIMIT $1',
    [limit]
  );
  return res.rows;
}

module.exports = { createAccessLog, getLogs };
