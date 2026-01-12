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

async function addInstructions() {
  try {
    console.log('🔍 Connecting to database...\n');
    await sql.connect(dbConfig);

    // Get all instructional proxies
    const proxies = await sql.query`
      SELECT ProxyID, PrincipalUserID, ProxyUserID, 
             u1.FirstName + ' ' + u1.LastName AS PrincipalName,
             u2.FirstName + ' ' + u2.LastName AS ProxyHolderName
      FROM ProxyAssignments pa
      LEFT JOIN Users u1 ON pa.PrincipalUserID = u1.UserID
      LEFT JOIN Users u2 ON pa.ProxyUserID = u2.UserID
      WHERE pa.IsActive = 1 AND pa.ProxyType = 'instructional'
    `;

    console.log(`Found ${proxies.recordset.length} instructional proxies\n`);

    // Get candidates and resolutions
    const candidates = await sql.query`SELECT TOP 3 CandidateID, FirstName + ' ' + LastName AS Name FROM Candidates WHERE IsActive = 1`;
    const resolutions = await sql.query`SELECT TOP 3 ResolutionID, ResolutionTitle FROM Resolutions WHERE Status = 'active'`;

    console.log(`Candidates: ${candidates.recordset.length}`);
    console.log(`Resolutions: ${resolutions.recordset.length}\n`);

    // Delete existing instructions first
    await sql.query`DELETE FROM ProxyInstructions`;
    console.log('🗑️  Cleared existing instructions\n');

    // Add instructions for each proxy
    for (const proxy of proxies.recordset) {
      console.log(`Adding instructions for ProxyID ${proxy.ProxyID} (${proxy.PrincipalName} → ${proxy.ProxyHolderName})`);
      
      // Add 2-3 candidate instructions
      const numCandidates = Math.min(2, candidates.recordset.length);
      for (let i = 0; i < numCandidates; i++) {
        const candidate = candidates.recordset[i];
        const votes = (i + 1) * 5; // 5, 10, 15 votes
        
        await sql.query`
          INSERT INTO ProxyInstructions (ProxyID, CandidateID, InstructionType, VotesToAllocate, Notes)
          VALUES (${proxy.ProxyID}, ${candidate.CandidateID}, 'allocate', ${votes}, 'Vote for ${candidate.Name}')
        `;
        console.log(`  ✅ Allocate ${votes} votes to ${candidate.Name}`);
      }

      // Add 1-2 resolution instructions
      const numResolutions = Math.min(2, resolutions.recordset.length);
      for (let i = 0; i < numResolutions; i++) {
        const resolution = resolutions.recordset[i];
        const voteType = i === 0 ? 'vote_yes' : 'vote_no';
        
        await sql.query`
          INSERT INTO ProxyInstructions (ProxyID, ResolutionID, InstructionType, Notes)
          VALUES (${proxy.ProxyID}, ${resolution.ResolutionID}, ${voteType}, 'Instructed to vote ${voteType.replace('vote_', '')}')
        `;
        console.log(`  ✅ Vote ${voteType.replace('vote_', '').toUpperCase()} on "${resolution.ResolutionTitle}"`);
      }
      console.log('');
    }

    // Verify
    const count = await sql.query`SELECT COUNT(*) as total FROM ProxyInstructions`;
    console.log(`\n✅ Total instructions created: ${count.recordset[0].total}`);

    await sql.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addInstructions();
