// =====================================================
// Database Connection Configuration
// =====================================================

const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE || process.env.DB_NAME, // Support both DB_DATABASE and DB_NAME
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  driver: process.env.DB_DRIVER || 'msnodesqlv8', // Support ODBC Driver specification
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || process.env.DB_ENCRYPT === 'yes',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || process.env.DB_TRUST_SERVER_CERTIFICATE === 'yes',
    enableArithAbort: true,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 30000
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: 30000
  }
};

// Create a connection pool
let pool = null;

const getPool = async () => {
  if (!pool) {
    try {
      pool = await sql.connect(config);
      console.log('✅ Database connection pool established');
      
      // Handle pool errors
      pool.on('error', err => {
        console.error('❌ Database pool error:', err);
        pool = null;
      });
      
      return pool;
    } catch (err) {
      console.error('❌ Failed to create database pool:', err);
      throw err;
    }
  }
  return pool;
};

// Close pool
const closePool = async () => {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Database pool closed');
  }
};

// Execute query with automatic retry
const executeQuery = async (query, inputs = {}) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const dbPool = await getPool();
      const request = dbPool.request();
      
      // Add input parameters
      Object.keys(inputs).forEach(key => {
        request.input(key, inputs[key]);
      });
      
      const result = await request.query(query);
      return result;
    } catch (err) {
      attempt++;
      console.error(`Query attempt ${attempt} failed:`, err.message);
      
      if (attempt >= maxRetries) {
        throw err;
      }
      
      // Reset pool on connection errors
      if (err.code === 'ECONNRESET' || err.code === 'ETIMEOUT') {
        pool = null;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Execute stored procedure
const executeStoredProcedure = async (procedureName, inputs = {}) => {
  try {
    const dbPool = await getPool();
    const request = dbPool.request();
    
    // Add input parameters
    Object.keys(inputs).forEach(key => {
      const value = inputs[key];
      request.input(key, value);
    });
    
    const result = await request.execute(procedureName);
    return result;
  } catch (err) {
    console.error(`Stored procedure ${procedureName} failed:`, err);
    throw err;
  }
};

// Transaction wrapper
const executeTransaction = async (callback) => {
  const dbPool = await getPool();
  const transaction = new sql.Transaction(dbPool);
  
  try {
    await transaction.begin();
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// Health check
const healthCheck = async () => {
  try {
    const result = await executeQuery('SELECT 1 AS health');
    return result.recordset.length > 0;
  } catch (err) {
    return false;
  }
};

module.exports = {
  sql,
  getPool,
  closePool,
  executeQuery,
  executeStoredProcedure,
  executeTransaction,
  healthCheck
};
