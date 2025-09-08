import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.DB_USER || 'admin1',
  password: process.env.DB_PASSWORD || 'wevote123$',
  server: process.env.DB_HOST || 'wevote.database.windows.net',
  database: process.env.DB_NAME || 'wevote',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  connectionTimeout: 30000,
};

const database = {
  async query(sqlQuery, params = []) {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(sqlQuery);
      return result.recordset;
    } catch (error) {
      console.error('❌ Database query error:', error.message);
      throw error;
    } finally {
      await sql.close();
    }
  },

  async testConnection() {
    try {
      await sql.connect(config);
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
    } finally {
      await sql.close();
    }
  }
};

// Test the connection
database.testConnection();

export default database;
