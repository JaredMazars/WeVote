import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.DB_USER || '', 
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || '',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'yes',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'yes',
    enableArithAbort: true,
  },
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) * 1000 || 60000, // Convert seconds to ms
  requestTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

const database = {
  async getPool() {
    if (!pool) {
      pool = await sql.connect(config);
    }
    return pool;
  },

  async query(sqlQuery, params = []) {
    try {
      const poolConnection = await this.getPool();
      const result = await poolConnection.request().query(sqlQuery);
      return result.recordset;
    } catch (error) {
      console.error('❌ Database query error:', error.message);
      // If connection error, reset pool and retry once
      if (error.code === 'ENOTOPEN' || error.code === 'ECONNCLOSED') {
        pool = null;
        const poolConnection = await this.getPool();
        const result = await poolConnection.request().query(sqlQuery);
        return result.recordset;
      }
      throw error;
    }
  },

  async testConnection() {
    try {
      console.log('🔄 Testing database connection...');
      console.log('📊 Connection config:', {
        server: config.server,
        database: config.database,
        user: config.user,
        port: config.port,
        encrypt: config.options.encrypt,
        connectionTimeout: config.connectionTimeout
      });
      
      await this.getPool();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error originalError:', error.originalError?.message || 'N/A');
    }
  }
};

// Test the connection
database.testConnection();

export default database;
