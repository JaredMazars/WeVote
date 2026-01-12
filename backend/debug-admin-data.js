const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

async function debugAdminData() {
  try {
    console.log('🔍 DEBUGGING ADMIN DASHBOARD DATA\n');
    console.log('='.repeat(80));
    
    await sql.connect(config);
    
    // 1. Check Resolutions
    console.log('\n📋 1. RESOLUTIONS CHECK');
    console.log('-'.repeat(80));
    const resolutions = await sql.query`
      SELECT TOP 5
        r.ResolutionID,
        r.Title,
        r.Description,
        r.Category,
        r.Status,
        r.TotalYesVotes,
        r.TotalNoVotes,
        r.TotalAbstainVotes,
        r.CreatedAt
      FROM Resolutions r
      ORDER BY r.CreatedAt DESC
    `;
    console.log(`Found ${resolutions.recordset.length} resolutions`);
    resolutions.recordset.forEach(r => {
      console.log(`  - ID: ${r.ResolutionID}, Title: ${r.Title || 'NO TITLE'}`);
      console.log(`    Status: ${r.Status}, Yes: ${r.TotalYesVotes}, No: ${r.TotalNoVotes}, Abstain: ${r.TotalAbstainVotes}`);
    });
    
    // 2. Check Proxy Assignments
    console.log('\n🤝 2. PROXY ASSIGNMENTS CHECK');
    console.log('-'.repeat(80));
    const proxies = await sql.query`
      SELECT 
        pa.ProxyID,
        pa.PrincipalUserID,
        principal.FirstName + ' ' + principal.LastName as PrincipalName,
        pa.ProxyUserID,
        proxy.FirstName + ' ' + proxy.LastName as ProxyName,
        pa.ProxyType,
        pa.IsActive,
        pa.StartDate,
        pa.EndDate
      FROM ProxyAssignments pa
      LEFT JOIN Users principal ON pa.PrincipalUserID = principal.UserID
      LEFT JOIN Users proxy ON pa.ProxyUserID = proxy.UserID
      ORDER BY pa.CreatedAt DESC
    `;
    console.log(`Found ${proxies.recordset.length} proxy assignments`);
    proxies.recordset.forEach(p => {
      console.log(`  - ID: ${p.ProxyID}: ${p.PrincipalName} → ${p.ProxyName} (${p.ProxyType})`);
      console.log(`    Active: ${p.IsActive}, Start: ${p.StartDate}, End: ${p.EndDate || 'No end date'}`);
    });
    
    // 3. Check Proxy Instructions
    console.log('\n📝 3. PROXY INSTRUCTIONS CHECK');
    console.log('-'.repeat(80));
    const instructions = await sql.query`
      SELECT 
        pi.InstructionID,
        pi.ProxyID,
        pi.InstructionType,
        pi.CandidateID,
        pi.ResolutionID,
        pi.VotesToAllocate,
        c.FirstName + ' ' + c.LastName as CandidateName,
        r.Title as ResolutionTitle
      FROM ProxyInstructions pi
      LEFT JOIN Candidates cand ON pi.CandidateID = cand.CandidateID
      LEFT JOIN Employees e ON cand.EmployeeID = e.EmployeeID
      LEFT JOIN Users c ON e.UserID = c.UserID
      LEFT JOIN Resolutions r ON pi.ResolutionID = r.ResolutionID
      ORDER BY pi.CreatedAt DESC
    `;
    console.log(`Found ${instructions.recordset.length} proxy instructions`);
    instructions.recordset.forEach(i => {
      console.log(`  - ID: ${i.InstructionID}, Proxy: ${i.ProxyID}, Type: ${i.InstructionType}`);
      if (i.CandidateID) {
        console.log(`    For Candidate: ${i.CandidateName} (ID: ${i.CandidateID}), Votes: ${i.VotesToAllocate}`);
      }
      if (i.ResolutionID) {
        console.log(`    For Resolution: ${i.ResolutionTitle} (ID: ${i.ResolutionID})`);
      }
    });
    
    // 4. Check Audit Logs
    console.log('\n📊 4. AUDIT LOGS CHECK');
    console.log('-'.repeat(80));
    const auditLogs = await sql.query`
      SELECT TOP 20
        al.LogID,
        al.UserID,
        u.FirstName + ' ' + u.LastName as UserName,
        al.Action,
        al.EntityType,
        al.EntityID,
        al.Details,
        al.CreatedAt
      FROM AuditLog al
      LEFT JOIN Users u ON al.UserID = u.UserID
      ORDER BY al.CreatedAt DESC
    `;
    console.log(`Found ${auditLogs.recordset.length} audit log entries`);
    auditLogs.recordset.forEach(log => {
      console.log(`  - [${log.CreatedAt.toISOString()}] ${log.UserName || 'System'}: ${log.Action}`);
      console.log(`    Entity: ${log.EntityType} (ID: ${log.EntityID}), Details: ${log.Details}`);
    });
    
    // 5. Check Available Candidates
    console.log('\n👥 5. CANDIDATES CHECK');
    console.log('-'.repeat(80));
    const candidates = await sql.query`
      SELECT TOP 10
        c.CandidateID,
        u.FirstName + ' ' + u.LastName as Name,
        c.Category,
        c.Status
      FROM Candidates c
      LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
      LEFT JOIN Users u ON e.UserID = u.UserID
    `;
    console.log(`Found ${candidates.recordset.length} candidates`);
    candidates.recordset.forEach(c => {
      console.log(`  - ID: ${c.CandidateID}, Name: ${c.Name}, Category: ${c.Category}, Status: ${c.Status}`);
    });
    
    // 6. Check Available Users
    console.log('\n👤 6. USERS CHECK');
    console.log('-'.repeat(80));
    const users = await sql.query`
      SELECT TOP 10
        UserID,
        FirstName + ' ' + LastName as Name,
        Email,
        IsActive
      FROM Users
      WHERE IsActive = 1
    `;
    console.log(`Found ${users.recordset.length} active users`);
    users.recordset.forEach(u => {
      console.log(`  - ID: ${u.UserID}, Name: ${u.Name}, Email: ${u.Email}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ DEBUG COMPLETE\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.close();
  }
}

debugAdminData();
