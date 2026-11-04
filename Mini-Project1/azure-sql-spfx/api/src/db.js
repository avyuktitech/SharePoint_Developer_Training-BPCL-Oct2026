const sql = require('mssql');

let poolPromise;

function requiredSetting(name) {
  const value = process.env[name];
  if (!value) throw new Error(`The ${name} app setting is missing.`);
  return value;
}

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool({
      server: requiredSetting('SQL_SERVER'),
      database: requiredSetting('SQL_DATABASE'),
      // Uses the Function App's managed identity in Azure and your "az login" locally, so no password is stored.
      authentication: { type: 'azure-active-directory-default', options: {} },
      options: { encrypt: true },
      // A free-tier database that has auto-paused can take about a minute to wake up.
      connectionTimeout: 60000,
      requestTimeout: 30000
    }).connect().catch(error => {
      poolPromise = undefined; // Lets the next request try again.
      throw error;
    });
  }
  return poolPromise;
}

async function query(text, params = {}) {
  const pool = await getPool();
  const request = pool.request();
  for (const [name, value] of Object.entries(params)) request.input(name, value);
  const result = await request.query(text);
  return result.recordset;
}

module.exports = { query };
