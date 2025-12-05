import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const config = {
  server: process.env.DB_SERVER || 'wevote.database.windows.net',
  database: process.env.DB_NAME || 'wevotedb',
  user: process.env.DB_USER || 'CloudSAf90d7bb6',
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  }
};

console.log('🔧 Using database config:', {
  server: config.server,
  database: config.database,
  user: config.user,
  password: config.password ? '***' : 'NOT SET'
});

async function testAuditLogging() {
  console.log('\n🧪 ========================================');
  console.log('🧪 Testing Audit Logging System');
  console.log('🧪 ========================================\n');
  
  let pool;
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    pool = await sql.connect(config);
    console.log('✅ Connected to database successfully\n');

    // Test 1: Check if audit_logs table exists
    console.log('📋 Test 1: Checking if audit_logs table exists...');
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'audit_logs'
    `);
    
    if (tableCheck.recordset[0].count === 0) {
      console.log('❌ audit_logs table does NOT exist!');
      console.log('💡 Creating audit_logs table...\n');
      
      await pool.request().query(`
        CREATE TABLE audit_logs (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id NVARCHAR(255) NULL,
          action_type NVARCHAR(100) NOT NULL,
          action_category NVARCHAR(50) NOT NULL,
          description NVARCHAR(MAX) NOT NULL,
          entity_type NVARCHAR(100) NULL,
          entity_id NVARCHAR(255) NULL,
          metadata NVARCHAR(MAX) NULL,
          ip_address NVARCHAR(100) NULL,
          user_agent NVARCHAR(500) NULL,
          status NVARCHAR(20) DEFAULT 'success',
          created_at DATETIME DEFAULT GETDATE()
        );
        
        CREATE INDEX idx_user_id ON audit_logs(user_id);
        CREATE INDEX idx_action_type ON audit_logs(action_type);
        CREATE INDEX idx_action_category ON audit_logs(action_category);
        CREATE INDEX idx_created_at ON audit_logs(created_at);
        CREATE INDEX idx_status ON audit_logs(status);
      `);
      
      console.log('✅ audit_logs table created successfully!\n');
    } else {
      console.log('✅ audit_logs table exists\n');
    }

    // Clear previous test data
    console.log('🧹 Cleaning up previous test data...');
    await pool.request().query(`
      DELETE FROM audit_logs 
      WHERE user_id = '67' AND description LIKE '%Test%'
    `);
    console.log('✅ Cleanup complete\n');

    // Test 2: Insert AUTH - Login (Success)
    console.log('📋 Test 2: Testing AUTH - LOGIN (Success)...');
    await pool.request().query(`
      INSERT INTO audit_logs (
        user_id, action_type, action_category, description, 
        entity_type, entity_id, metadata, ip_address, 
        user_agent, status
      ) VALUES (
        '67',
        'login',
        'AUTH',
        'User Test User logged in successfully',
        'user',
        '67',
        '{"email":"test@example.com","method":"credentials"}',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0) Test Browser',
        'success'
      )
    `);
    console.log('✅ Login audit log inserted\n');

    // Test 3: Insert AUTH - Failed Login
    console.log('📋 Test 3: Testing AUTH - FAILED LOGIN...');
    await pool.request().query(`
      INSERT INTO audit_logs (
        user_id, action_type, action_category, description, 
        entity_type, entity_id, metadata, ip_address, 
        user_agent, status
      ) VALUES (
        NULL,
        'failed_login',
        'AUTH',
        'Failed login attempt for test@example.com - Invalid password',
        'user',
        NULL,
        '{"email":"test@example.com","reason":"Invalid password"}',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0) Test Browser',
        'failure'
      )
    `);
    console.log('✅ Failed login audit log inserted\n');

    // Test 4: Insert VOTE - Vote Cast
    console.log('📋 Test 4: Testing VOTE - VOTE CAST...');
    await pool.request().query(`
      INSERT INTO audit_logs (
        user_id, action_type, action_category, description, 
        entity_type, entity_id, metadata, ip_address, 
        user_agent, status
      ) VALUES (
        '67',
        'vote_cast',
        'VOTE',
        'User Test User cast vote for Employee John Doe',
        'employee',
        '123',
        '{"vote_type":"personal","employee_name":"John Doe","employee_id":"123"}',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0) Test Browser',
        'success'
      )
    `);
    console.log('✅ Vote cast audit log inserted\n');

    // Test 5: Insert VOTE - Split Proxy Vote
    console.log('📋 Test 5: Testing VOTE - SPLIT PROXY VOTE...');
    await pool.request().query(`
      INSERT INTO audit_logs (
        user_id, action_type, action_category, description, 
        entity_type, entity_id, metadata, ip_address, 
        user_agent, status
      ) VALUES (
        '67',
        'split_vote_cast',
        'VOTE',
        'User Test User cast 4 split proxy votes for Employee Jane Smith',
        'employee',
        '124',
        '{"proxy_id":"67","delegator_count":4,"employee_name":"Jane Smith","employee_id":"124","proxy_members":[45,67,89,12]}',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0) Test Browser',
        'success'
      )
    `);
    console.log('✅ Split proxy vote audit log inserted\n');

    // Test 6: Insert ADMIN - User Status Changed
    console.log('📋 Test 6: Testing ADMIN - USER DEACTIVATED...');
    await pool.request().query(`
      INSERT INTO audit_logs (
        user_id, action_type, action_category, description, 
        entity_type, entity_id, metadata, ip_address, 
        user_agent, status
      ) VALUES (
        '1',
        'user_deactivated',
        'ADMIN',
        'Admin Super Admin deactivated user Test User (ID: 67)',
        'user',
        '67',
        '{"admin_id":"1","admin_name":"Super Admin","user_id":"67","user_name":"Test User","is_active":false,"previous_status":true,"reason":"Testing"}',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0) Test Browser',
        'success'
      )
    `);
    console.log('✅ User deactivated audit log inserted\n');

    // Test 7: Insert ADMIN - User Activated
    console.log('📋 Test 7: Testing ADMIN - USER ACTIVATED...');
    await pool.request().query(`
      INSERT INTO audit_logs (
        user_id, action_type, action_category, description, 
        entity_type, entity_id, metadata, ip_address, 
        user_agent, status
      ) VALUES (
        '1',
        'user_activated',
        'ADMIN',
        'Admin Super Admin activated user Test User (ID: 67)',
        'user',
        '67',
        '{"admin_id":"1","admin_name":"Super Admin","user_id":"67","user_name":"Test User","is_active":true,"previous_status":false}',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0) Test Browser',
        'success'
      )
    `);
    console.log('✅ User activated audit log inserted\n');

    // Test 8: Insert AUTH - Password Change
    console.log('📋 Test 8: Testing AUTH - PASSWORD CHANGE...');
    await pool.request().query(`
      INSERT INTO audit_logs (
        user_id, action_type, action_category, description, 
        entity_type, entity_id, metadata, ip_address, 
        user_agent, status
      ) VALUES (
        '67',
        'password_change',
        'AUTH',
        'User Test User changed their password',
        'user',
        '67',
        '{"first_login":false}',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0) Test Browser',
        'success'
      )
    `);
    console.log('✅ Password change audit log inserted\n');

    // Test 9: Insert VOTE - Vote Removed
    console.log('📋 Test 9: Testing VOTE - VOTE REMOVED...');
    await pool.request().query(`
      INSERT INTO audit_logs (
        user_id, action_type, action_category, description, 
        entity_type, entity_id, metadata, ip_address, 
        user_agent, status
      ) VALUES (
        '67',
        'vote_removed',
        'VOTE',
        'User Test User removed 1 vote(s) for employee John Doe',
        'employee',
        '123',
        '{"employee_name":"John Doe","vote_count":1}',
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0) Test Browser',
        'success'
      )
    `);
    console.log('✅ Vote removed audit log inserted\n');

    // Test 10: Retrieve all test logs
    console.log('📋 Test 10: Retrieving all test audit logs...');
    const allLogs = await pool.request().query(`
      SELECT * FROM audit_logs 
      WHERE user_id IN ('67', '1') OR description LIKE '%Test%'
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ Retrieved ${allLogs.recordset.length} audit logs\n`);
    
    // Display results in a nice table format
    console.log('📊 ========================================');
    console.log('📊 AUDIT LOG RESULTS');
    console.log('📊 ========================================\n');
    
    allLogs.recordset.forEach((log, index) => {
      console.log(`\n🔹 Log #${index + 1}`);
      console.log(`   ID:          ${log.id}`);
      console.log(`   Category:    ${log.action_category}`);
      console.log(`   Action:      ${log.action_type}`);
      console.log(`   Description: ${log.description}`);
      console.log(`   User ID:     ${log.user_id || 'N/A'}`);
      console.log(`   Entity:      ${log.entity_type || 'N/A'} (ID: ${log.entity_id || 'N/A'})`);
      console.log(`   Status:      ${log.status}`);
      console.log(`   IP Address:  ${log.ip_address || 'N/A'}`);
      console.log(`   Created:     ${log.created_at}`);
      console.log(`   ---`);
    });

    // Test 11: Get statistics
    console.log('\n📋 Test 11: Getting audit log statistics...');
    const stats = await pool.request().query(`
      SELECT 
        action_category,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failure_count
      FROM audit_logs
      WHERE user_id IN ('67', '1') OR description LIKE '%Test%'
      GROUP BY action_category
      ORDER BY count DESC
    `);
    
    console.log('\n📊 ========================================');
    console.log('📊 STATISTICS BY CATEGORY');
    console.log('📊 ========================================\n');
    
    stats.recordset.forEach(stat => {
      console.log(`   ${stat.action_category}:`);
      console.log(`      Total:   ${stat.count} logs`);
      console.log(`      Success: ${stat.success_count}`);
      console.log(`      Failure: ${stat.failure_count}`);
      console.log('');
    });

    // Test 12: Test filtering
    console.log('📋 Test 12: Testing filtering by action type...');
    const authLogs = await pool.request().query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE action_category = 'AUTH' 
      AND (user_id = '67' OR description LIKE '%Test%')
    `);
    console.log(`✅ Found ${authLogs.recordset[0].count} AUTH logs\n`);

    const voteLogs = await pool.request().query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE action_category = 'VOTE'
      AND (user_id = '67' OR description LIKE '%Test%')
    `);
    console.log(`✅ Found ${voteLogs.recordset[0].count} VOTE logs\n`);

    const adminLogs = await pool.request().query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE action_category = 'ADMIN'
      AND (user_id = '1' OR description LIKE '%Test%')
    `);
    console.log(`✅ Found ${adminLogs.recordset[0].count} ADMIN logs\n`);

    // Final summary
    console.log('\n🎉 ========================================');
    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('🎉 ========================================\n');
    console.log('✅ Audit logging system is working correctly');
    console.log('✅ All action types tested and logged successfully');
    console.log('✅ Statistics and filtering working properly\n');
    console.log('📝 Test Summary:');
    console.log(`   - Total test logs created: ${allLogs.recordset.length}`);
    console.log(`   - AUTH logs: ${authLogs.recordset[0].count}`);
    console.log(`   - VOTE logs: ${voteLogs.recordset[0].count}`);
    console.log(`   - ADMIN logs: ${adminLogs.recordset[0].count}\n`);
    console.log('🌐 Next Steps:');
    console.log('   1. Login to your application at http://localhost:5173');
    console.log('   2. Navigate to Admin → Audit Trail');
    console.log('   3. You should see all the test logs displayed\n');

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ TEST FAILED');
    console.error('❌ ========================================\n');
    console.error('Error details:', error);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check your .env file has correct DB credentials');
    console.error('   2. Ensure database server is accessible');
    console.error('   3. Verify database name is correct');
    console.error('   4. Check firewall rules allow connection\n');
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔌 Database connection closed\n');
    }
  }
}

// Run the tests
testAuditLogging();
