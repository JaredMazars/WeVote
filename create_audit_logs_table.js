// Script to create audit_logs table
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, 'server/.env') });

import sql from 'mssql';

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function createAuditLogsTable() {
  try {
    console.log('🔄 Connecting to database...');
    await sql.connect(dbConfig);
    console.log('✅ Connected to database');

    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs' AND xtype='U')
      CREATE TABLE audit_logs (
        id int IDENTITY(1,1) PRIMARY KEY,
        action_category varchar(50) NOT NULL,
        action_type varchar(100) NOT NULL,
        user_id varchar(50),
        status varchar(20) NOT NULL,
        description text,
        ip_address varchar(45),
        user_agent text,
        entity_type varchar(100),
        entity_id varchar(50),
        metadata text,
        created_at datetime2 DEFAULT GETDATE()
      );
    `;

    console.log('📝 Creating audit_logs table...');
    await sql.query(createTableQuery);
    console.log('✅ audit_logs table created successfully!');

    // Check if table was created
    const checkTableQuery = `
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'audit_logs'
    `;
    
    const result = await sql.query(checkTableQuery);
    console.log(`📊 audit_logs table exists: ${result.recordset[0].count > 0 ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ Error creating audit_logs table:', error);
  } finally {
    await sql.close();
  }
}

createAuditLogsTable();
