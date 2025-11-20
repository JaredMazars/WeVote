import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function setupProxyTables() {
  let pool;
  try {
    console.log('📊 Connecting to database...\n');
    pool = await sql.connect(config);
    
    // Read and execute the CREATE tables SQL
    console.log('📝 Reading SQL script...\n');
    const sqlScript = fs.readFileSync(join(__dirname, 'setup', 'create_proxy_tables.sql'), 'utf8');
    
    console.log('🔨 Creating proxy tables...\n');
    await pool.request().batch(sqlScript);
    console.log('✅ Proxy tables created successfully!\n');
    
    // Insert test data
    console.log('📝 Inserting test proxy data...\n');
    
    // Create a test proxy group (User 167 delegates to User 139)
    const groupResult = await pool.request().query(`
      INSERT INTO proxy_groups (principal_id, appointment_type, is_active)
      OUTPUT INSERTED.id
      VALUES (167, 'both', 1)
    `);
    const groupId = groupResult.recordset[0].id;
    console.log(`✅ Created proxy group ${groupId} for user 167 (principal)\n`);
    
    // Add user 139 as a DISCRETIONARY proxy member
    const discretionaryMemberResult = await pool.request().query(`
      INSERT INTO proxy_group_members (group_id, member_id, appointment_type, full_name, membership_number)
      OUTPUT INSERTED.id
      VALUES (${groupId}, 139, 'DISCRETIONARY', 'Bilal', 'BIL001')
    `);
    const discretionaryMemberId = discretionaryMemberResult.recordset[0].id;
    console.log(`✅ Added user 139 (Bilal) as DISCRETIONARY proxy member ${discretionaryMemberId}\n`);
    
    // Check if user 112 exists and add as INSTRUCTIONAL proxy
    const user112Result = await pool.request().query(`SELECT id FROM users WHERE id = 112`);
    if (user112Result.recordset.length > 0) {
      const instructionalMemberResult = await pool.request().query(`
        INSERT INTO proxy_group_members (group_id, member_id, appointment_type, full_name, membership_number)
        OUTPUT INSERTED.id
        VALUES (${groupId}, 112, 'INSTRUCTIONAL', 'User 102', 'USR102')
      `);
      const instructionalMemberId = instructionalMemberResult.recordset[0].id;
      console.log(`✅ Added user 112 (User 102) as INSTRUCTIONAL proxy member ${instructionalMemberId}\n`);
      
      // Add some allowed candidates for the INSTRUCTIONAL proxy
      // Check if there are any employees
      const employeesResult = await pool.request().query(`
        SELECT TOP 3 id, name FROM employees ORDER BY id
      `);
      
      if (employeesResult.recordset.length > 0) {
        console.log(`📋 Adding allowed candidates for INSTRUCTIONAL proxy...\n`);
        for (const emp of employeesResult.recordset) {
          await pool.request().query(`
            INSERT INTO proxy_member_allowed_candidates (proxy_member_id, employee_id)
            VALUES (${instructionalMemberId}, ${emp.id})
          `);
          console.log(`   ✅ Added employee ${emp.id} (${emp.name || 'Unknown'}) as allowed candidate`);
        }
        console.log('');
      }
    }
    
    // Verify the setup
    console.log('🔍 Verifying proxy setup...\n');
    const verifyResult = await pool.request().query(`
      SELECT 
        pg.id as group_id,
        pg.appointment_type,
        u_principal.name as principal_name,
        pgm.id as member_id,
        u_member.name as proxy_member_name,
        pgm.appointment_type as member_appointment_type
      FROM proxy_groups pg
      INNER JOIN users u_principal ON pg.principal_id = u_principal.id
      INNER JOIN proxy_group_members pgm ON pgm.group_id = pg.id
      INNER JOIN users u_member ON pgm.member_id = u_member.id
      WHERE pg.id = ${groupId}
    `);
    
    console.log('Proxy Group Setup:');
    console.log(JSON.stringify(verifyResult.recordset, null, 2));
    console.log('');
    
    console.log('✅ Setup complete!\n');
    console.log('🎉 You can now test the VotingStatusBar:\n');
    console.log('   1. Login as user 139 (bilalc8@gmail.com)');
    console.log('   2. The VotingStatusBar should show proxy delegations from user 167');
    console.log('   3. Click "View Details" and go to "Proxy Delegations" tab');
    console.log('   4. You should see 2 proxy members: Bilal (DISCRETIONARY) and User 102 (INSTRUCTIONAL)\n');
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (pool) await pool.close();
    process.exit(1);
  }
}

setupProxyTables();
