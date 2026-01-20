const sql = require('mssql');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  port: 1433,
  options: { encrypt: true, trustServerCertificate: true }
};

(async () => {
  try {
    await sql.connect(config);
    
    const userId = 18; // test@forvismazars.com
    const sessionId = 10;
    const allocatedVotes = 20;
    
    // Check if allocation exists
    const existing = await sql.query`
      SELECT * FROM VoteAllocations 
      WHERE UserID = ${userId} AND SessionID = ${sessionId}
    `;
    
    if (existing.recordset.length > 0) {
      // Update
      await sql.query`
        UPDATE VoteAllocations 
        SET AllocatedVotes = ${allocatedVotes}, UpdatedAt = GETDATE()
        WHERE UserID = ${userId} AND SessionID = ${sessionId}
      `;
      console.log(`✓ Updated allocation: User ${userId} now has ${allocatedVotes} votes in session ${sessionId}`);
    } else {
      // Insert
      await sql.query`
        INSERT INTO VoteAllocations (SessionID, UserID, AllocatedVotes, Reason, BasedOn, SetBy, CreatedAt, UpdatedAt)
        VALUES (${sessionId}, ${userId}, ${allocatedVotes}, 'Testing', 'Manual', 1, GETDATE(), GETDATE())
      `;
      console.log(`✓ Created allocation: User ${userId} has ${allocatedVotes} votes in session ${sessionId}`);
    }
    
    await sql.close();
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
