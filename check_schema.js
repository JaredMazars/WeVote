// Check users table schema
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import sql from 'mssql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, 'server/.env') });

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

async function checkTablesSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    await sql.connect(dbConfig);
    
    // Check users table columns
    console.log('\n📋 Users table columns:');
    const userColumns = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    userColumns.recordset.forEach(col => {
      console.log(`   ${col.COLUMN_NAME} (${col.DATA_TYPE}) - Nullable: ${col.IS_NULLABLE}`);
    });

    // Check sample users data
    console.log('\n👥 Sample users data:');
    const usersData = await sql.query(`SELECT TOP 3 * FROM users ORDER BY id`);
    if (usersData.recordset.length > 0) {
      console.log('   Columns in users table:', Object.keys(usersData.recordset[0]).join(', '));
      usersData.recordset.forEach(user => {
        console.log(`   User ${user.id}: ${JSON.stringify(user, null, 2)}`);
      });
    }

    // Check audit_logs table columns  
    console.log('\n📋 Audit_logs table columns:');
    const auditColumns = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'audit_logs'
      ORDER BY ORDINAL_POSITION
    `);
    
    auditColumns.recordset.forEach(col => {
      console.log(`   ${col.COLUMN_NAME} (${col.DATA_TYPE}) - Nullable: ${col.IS_NULLABLE}`);
    });

  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await sql.close();
  }
}

checkTablesSchema();
