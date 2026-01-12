const sql = require('mssql');

const dbConfig = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'wevoteadmin',
  password: 'WeVote2024!Secure',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function checkInstructions() {
  try {
    console.log('🔍 Connecting to database...\n');
    await sql.connect(dbConfig);

    // Check proxy assignments
    console.log('📋 Checking Proxy Assignments:');
    const proxies = await sql.query`
      SELECT 
        pa.ProxyID,
        pa.PrincipalUserID,
        u1.FirstName + ' ' + u1.LastName AS PrincipalName,
        pa.ProxyUserID,
        u2.FirstName + ' ' + u2.LastName AS ProxyHolderName,
        pa.ProxyType
      FROM ProxyAssignments pa
      LEFT JOIN Users u1 ON pa.PrincipalUserID = u1.UserID
      LEFT JOIN Users u2 ON pa.ProxyUserID = u2.UserID
      WHERE pa.IsActive = 1 AND pa.ProxyType = 'instructional'
    `;
    console.log(`Found ${proxies.recordset.length} instructional proxy assignments:\n`);
    proxies.recordset.forEach(p => {
      console.log(`  ProxyID ${p.ProxyID}: ${p.PrincipalName} → ${p.ProxyHolderName}`);
    });

    // Check instructions
    console.log('\n📝 Checking Proxy Instructions:');
    const instructions = await sql.query`
      SELECT 
        pi.InstructionID,
        pi.ProxyID,
        pi.CandidateID,
        pi.ResolutionID,
        pi.InstructionType,
        pi.VotesToAllocate,
        c.FirstName + ' ' + c.LastName AS CandidateName,
        r.ResolutionTitle
      FROM ProxyInstructions pi
      LEFT JOIN Candidates c ON pi.CandidateID = c.CandidateID
      LEFT JOIN Resolutions r ON pi.ResolutionID = r.ResolutionID
    `;
    console.log(`Found ${instructions.recordset.length} instructions:\n`);
    
    const instructionsByProxy = {};
    instructions.recordset.forEach(i => {
      if (!instructionsByProxy[i.ProxyID]) {
        instructionsByProxy[i.ProxyID] = [];
      }
      instructionsByProxy[i.ProxyID].push(i);
    });

    Object.keys(instructionsByProxy).forEach(proxyId => {
      console.log(`  ProxyID ${proxyId}:`);
      instructionsByProxy[proxyId].forEach(i => {
        if (i.CandidateID) {
          console.log(`    - Allocate ${i.VotesToAllocate} votes to ${i.CandidateName || 'Candidate ' + i.CandidateID}`);
        } else if (i.ResolutionID) {
          console.log(`    - Vote ${i.InstructionType.replace('vote_', '').toUpperCase()} on ${i.ResolutionTitle || 'Resolution ' + i.ResolutionID}`);
        }
      });
    });

    // Check which proxies have no instructions
    console.log('\n⚠️  Instructional proxies WITHOUT instructions:');
    const proxiesWithoutInstructions = proxies.recordset.filter(p => !instructionsByProxy[p.ProxyID]);
    if (proxiesWithoutInstructions.length > 0) {
      proxiesWithoutInstructions.forEach(p => {
        console.log(`  ProxyID ${p.ProxyID}: ${p.PrincipalName} → ${p.ProxyHolderName}`);
      });
    } else {
      console.log('  None - all instructional proxies have instructions ✅');
    }

    await sql.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkInstructions();
