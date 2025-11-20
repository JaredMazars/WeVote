import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME || process.env.DB_DATABASE, // Try both
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function checkProxyData() {
  let pool;
  try {
    console.log('🔍 Connecting to database...\n');
    console.log('Database:', process.env.DB_DATABASE);
    console.log('Server:', process.env.DB_SERVER);
    console.log('User:', process.env.DB_USER);
    console.log('');
    
    pool = await sql.connect(config);
    
    // Check what database we're actually connected to
    const dbCheckResult = await pool.request().query('SELECT DB_NAME() AS current_database');
    console.log('✅ Connected to database:', dbCheckResult.recordset[0].current_database);
    console.log('');
    
    // List all tables in current database
    console.log('📊 Tables in current database:');
    const tablesResult = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    tablesResult.recordset.forEach(t => {
      console.log(`  - [${t.TABLE_SCHEMA}].[${t.TABLE_NAME}]`);
    });
    console.log('');
    
    // Try with schema prefix
    console.log('📊 Checking [dbo].[proxy_groups]...');
    const groupsResult = await pool.request().query('SELECT * FROM [dbo].[proxy_groups]');
    console.log(`Found ${groupsResult.recordset.length} proxy groups\n`);
    
    if (groupsResult.recordset.length > 0) {
      console.log('Proxy Groups:');
      groupsResult.recordset.forEach(g => {
        console.log(`  - ID: ${g.id}, Group: ${g.group_name}, Principal ID: ${g.principal_id}, Active: ${g.is_active}, Type: ${g.appointment_type || 'N/A'}`);
      });
      console.log('');
    }
    
    // Check proxy_group_members
    console.log('📊 Checking proxy_group_members...');
    const membersResult = await pool.request().query('SELECT * FROM proxy_group_members');
    console.log(`Found ${membersResult.recordset.length} proxy group members\n`);
    
    if (membersResult.recordset.length > 0) {
      console.log('Proxy Members:');
      membersResult.recordset.forEach(m => {
        console.log(`  - ID: ${m.id}, Group ID: ${m.group_id}, Member ID: ${m.member_id}, Name: ${m.full_name || 'N/A'}, Type: ${m.appointment_type || 'N/A'}`);
      });
      console.log('');
    }
    
    // Check proxy_member_allowed_candidates
    console.log('📊 Checking proxy_member_allowed_candidates...');
    const candidatesResult = await pool.request().query('SELECT * FROM proxy_member_allowed_candidates');
    console.log(`Found ${candidatesResult.recordset.length} allowed candidates\n`);
    
    if (candidatesResult.recordset.length > 0) {
      console.log('Allowed Candidates:');
      candidatesResult.recordset.forEach(c => {
        console.log(`  - Proxy Member ID: ${c.proxy_member_id}, Employee ID: ${c.employee_id}`);
      });
      console.log('');
    }
    
    // Check if user 167 has any proxy groups or is a proxy member
    console.log('🔍 Checking user 167 (jaredmoodley1212@gmail.com)...\n');
    
    const user167AsDelegate = await pool.request().query(`
      SELECT pg.*, u.name as principal_name
      FROM proxy_groups pg
      INNER JOIN users u ON pg.principal_id = u.id
      INNER JOIN proxy_group_members pgm ON pgm.group_id = pg.id
      WHERE pgm.member_id = 167
    `);
    console.log(`User 167 is a PROXY MEMBER (can vote on behalf of) in ${user167AsDelegate.recordset.length} groups`);
    if (user167AsDelegate.recordset.length > 0) {
      user167AsDelegate.recordset.forEach(g => {
        console.log(`  - Voting for: ${g.principal_name} (Principal ID: ${g.principal_id}), Group: ${g.group_name}`);
      });
    }
    console.log('');
    
    const user167AsPrincipal = await pool.request().query(`
      SELECT pg.*, COUNT(pgm.id) as member_count
      FROM proxy_groups pg
      LEFT JOIN proxy_group_members pgm ON pgm.group_id = pg.id
      WHERE pg.principal_id = 167
      GROUP BY pg.id, pg.group_name, pg.principal_id, pg.created_at, pg.is_active, pg.appointment_type, 
               pg.trustee_remuneration, pg.remuneration_policy, pg.auditors_appointment, pg.agm_motions,
               pg.vote_splitting_enabled, pg.min_votes_per_user, pg.max_votes_per_user
    `);
    console.log(`User 167 is a PRINCIPAL (others vote for them) with ${user167AsPrincipal.recordset.length} proxy groups`);
    if (user167AsPrincipal.recordset.length > 0) {
      user167AsPrincipal.recordset.forEach(g => {
        console.log(`  - Group: ${g.group_name}, Members: ${g.member_count}, Active: ${g.is_active}`);
      });
    }
    console.log('');
    
    // Recommendations
    console.log('💡 Recommendations:');
    if (groupsResult.recordset.length === 0) {
      console.log('  ❌ No proxy groups exist - create some proxy groups first');
    } else if (membersResult.recordset.length === 0) {
      console.log('  ❌ Proxy groups exist but have no members - add proxy members');
    } else if (user167AsDelegate.recordset.length === 0) {
      console.log('  ❌ User 167 is not a proxy member in any group');
      console.log('     To see proxy delegations in VotingStatusBar:');
      console.log('     1. Add user 167 as a member to an existing proxy group, OR');
      console.log('     2. Login as a different user who IS a proxy member');
    } else {
      console.log('  ✅ User 167 can see proxy delegations!');
      console.log('     - Login as user 167');
      console.log('     - Open VotingStatusBar');
      console.log('     - Click "View Details" → "Proxy Delegations" tab');
    }
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (pool) await pool.close();
    process.exit(1);
  }
}

checkProxyData();
