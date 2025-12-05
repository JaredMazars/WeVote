// Test script to insert audit log entries for testing
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

async function insertTestAuditLogs() {
  try {
    console.log('🔄 Connecting to database...');
    await sql.connect(dbConfig);
    console.log('✅ Connected to database');

    const testLogs = [
      {
        action_category: 'AUTH',
        action_type: 'LOGIN',
        user_id: '171',
        status: 'success',
        description: 'User logged in successfully',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        entity_type: 'users',
        entity_id: '171',
        metadata: JSON.stringify({ login_method: 'password', session_id: 'sess_123' })
      },
      {
        action_category: 'VOTE',
        action_type: 'CAST_VOTE',
        user_id: '171',
        status: 'success',
        description: 'Vote cast for employee',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        entity_type: 'votes',
        entity_id: '1',
        metadata: JSON.stringify({ vote_type: 'employee', employee_id: '1', weight: 1.0 })
      },
      {
        action_category: 'ADMIN',
        action_type: 'CREATE_USER',
        user_id: '171',
        status: 'success',
        description: 'New user account created',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        entity_type: 'users',
        entity_id: '172',
        metadata: JSON.stringify({ new_user_email: 'newuser@company.com', role: 'voter' })
      },
      {
        action_category: 'PROXY',
        action_type: 'CREATE_GROUP',
        user_id: '171',
        status: 'success',
        description: 'Proxy group created',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        entity_type: 'proxy_groups',
        entity_id: '1',
        metadata: JSON.stringify({ group_name: 'Test Proxy Group', members_count: 3 })
      },
      {
        action_category: 'TIMER',
        action_type: 'START_AGM',
        user_id: '171',
        status: 'success',
        description: 'AGM timer started',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        entity_type: 'agm_timer',
        entity_id: '1',
        metadata: JSON.stringify({ start_time: '09:00', end_time: '17:00' })
      },
      {
        action_category: 'SYSTEM',
        action_type: 'DATABASE_BACKUP',
        user_id: null,
        status: 'success',
        description: 'Automated database backup completed',
        ip_address: '127.0.0.1',
        user_agent: 'System/1.0',
        entity_type: 'system',
        entity_id: null,
        metadata: JSON.stringify({ backup_size: '125MB', duration: '45s' })
      }
    ];

    console.log('📝 Inserting test audit logs...');
    for (let i = 0; i < testLogs.length; i++) {
      const log = testLogs[i];
      const query = `
        INSERT INTO audit_logs (
          action_category, action_type, user_id, status, description,
          ip_address, user_agent, entity_type, entity_id, metadata, created_at
        ) VALUES (
          @action_category, @action_type, @user_id, @status, @description,
          @ip_address, @user_agent, @entity_type, @entity_id, @metadata, GETDATE()
        )
      `;
      
      const request = new sql.Request();
      request.input('action_category', sql.VarChar, log.action_category);
      request.input('action_type', sql.VarChar, log.action_type);
      request.input('user_id', sql.VarChar, log.user_id);
      request.input('status', sql.VarChar, log.status);
      request.input('description', sql.Text, log.description);
      request.input('ip_address', sql.VarChar, log.ip_address);
      request.input('user_agent', sql.Text, log.user_agent);
      request.input('entity_type', sql.VarChar, log.entity_type);
      request.input('entity_id', sql.VarChar, log.entity_id);
      request.input('metadata', sql.Text, log.metadata);
      
      await request.query(query);
      console.log(`✅ Inserted audit log ${i + 1}: ${log.action_category} - ${log.action_type}`);
    }

    console.log('🎉 All test audit logs inserted successfully!');
    
    // Verify insertion
    const countResult = await sql.query('SELECT COUNT(*) as count FROM audit_logs');
    console.log(`📊 Total audit logs in database: ${countResult.recordset[0].count}`);

  } catch (error) {
    console.error('❌ Error inserting test audit logs:', error);
  } finally {
    await sql.close();
  }
}

insertTestAuditLogs();
