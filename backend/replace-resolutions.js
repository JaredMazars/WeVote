const sql = require('mssql');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000
  }
};

const newResolutions = [
  {
    title: 'Trustee Remuneration',
    description: 'Vote on the proposed remuneration for trustees for the fiscal year 2026',
    category: 'Financial'
  },
  {
    title: 'Non-binding Advisory Vote on the Trustee Remuneration Policy',
    description: 'Advisory vote on the overall trustee remuneration policy framework',
    category: 'Policy'
  },
  {
    title: 'Appointment of the Auditors for 2026',
    description: 'Vote to appoint the external auditors for the fiscal year 2026',
    category: 'Governance'
  },
  {
    title: 'Voting on Motions Received',
    description: 'Vote on various motions submitted by members',
    category: 'General'
  },
  {
    title: 'Trustee Election (Top three candidates in alphabetical order of surname)',
    description: 'Elect three trustees from the candidate pool. Results will be ranked by vote count in alphabetical order of surname.',
    category: 'Election'
  }
];

async function replaceResolutions() {
  try {
    console.log('Connecting to database...');
    await sql.connect(config);
    console.log('Connected successfully\n');

    // Get current resolutions
    const current = await sql.query`SELECT ResolutionID, Title FROM Resolutions ORDER BY ResolutionID`;
    console.log('Current resolutions:');
    current.recordset.forEach(r => console.log(`  ${r.ResolutionID}: ${r.Title}`));
    console.log('');

    // Delete all existing votes first to maintain referential integrity
    console.log('Deleting existing resolution votes...');
    const deleteVotes = await sql.query`DELETE FROM ResolutionVotes WHERE ResolutionID IN (SELECT ResolutionID FROM Resolutions WHERE SessionID = 1)`;
    console.log(`Deleted ${deleteVotes.rowsAffected[0]} resolution votes\n`);

    // Delete proxy instructions referencing resolutions
    console.log('Deleting proxy instructions for resolutions...');
    const deleteProxyInstructions = await sql.query`DELETE FROM ProxyInstructions WHERE ResolutionID IN (SELECT ResolutionID FROM Resolutions WHERE SessionID = 1)`;
    console.log(`Deleted ${deleteProxyInstructions.rowsAffected[0]} proxy instructions\n`);

    // Delete existing resolutions for session 1
    console.log('Deleting existing resolutions...');
    const deleteResult = await sql.query`DELETE FROM Resolutions WHERE SessionID = 1`;
    console.log(`Deleted ${deleteResult.rowsAffected[0]} resolutions\n`);

    // Insert new resolutions
    console.log('Inserting new resolutions...');
    for (let i = 0; i < newResolutions.length; i++) {
      const resolution = newResolutions[i];
      await sql.query`
        INSERT INTO Resolutions (
          SessionID, Title, Description, Category, 
          RequiredMajority, Status, TotalYesVotes, 
          TotalNoVotes, TotalAbstainVotes, CreatedAt, UpdatedAt
        ) VALUES (
          1, 
          ${resolution.title}, 
          ${resolution.description}, 
          ${resolution.category},
          51,
          'active',
          0,
          0,
          0,
          GETDATE(),
          GETDATE()
        )
      `;
      console.log(`  ✓ Created: ${resolution.title}`);
    }

    console.log('\n=== NEW RESOLUTIONS ===\n');
    const newResult = await sql.query`
      SELECT ResolutionID, Title, Description, Category 
      FROM Resolutions 
      WHERE SessionID = 1
      ORDER BY ResolutionID
    `;
    
    newResult.recordset.forEach((r, i) => {
      console.log(`${i + 1}. ${r.Title}`);
      console.log(`   Category: ${r.Category}`);
      console.log(`   Description: ${r.Description}`);
      console.log('');
    });

    console.log('✅ Successfully replaced all resolutions!');

    await sql.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

replaceResolutions();
