const { executeQuery } = require('./src/config/database');

async function setupEmployeeVoting() {
  try {
    console.log('\n🎯 Setting up voting for employee@forvismazars.com...\n');
    
    const userId = 7; // Michael Employee
    const sessionId = 1; // Default session
    const allocatedVotes = 15;
    const setBy = 4; // Super Admin
    
    // Check if allocation exists
    const checkQuery = `
      SELECT * FROM VoteAllocations 
      WHERE UserID = @userId AND SessionID = @sessionId
    `;
    
    const existing = await executeQuery(checkQuery, { userId, sessionId });
    
    if (existing.recordset && existing.recordset.length > 0) {
      console.log('✅ Vote allocation already exists:');
      console.log(JSON.stringify(existing.recordset[0], null, 2));
    } else {
      // Create vote allocation
      const insertQuery = `
        INSERT INTO VoteAllocations (
          SessionID, UserID, AllocatedVotes, Reason, BasedOn, SetBy, CreatedAt, UpdatedAt
        )
        VALUES (
          @sessionId, @userId, @allocatedVotes, @reason, @basedOn, @setBy, GETDATE(), GETDATE()
        )
      `;
      
      await executeQuery(insertQuery, {
        sessionId,
        userId,
        allocatedVotes,
        reason: 'Standard employee allocation',
        basedOn: 'role',
        setBy
      });
      
      console.log('✅ Vote allocation created successfully!');
    }
    
    // Check if user tracking exists
    const trackingCheck = `
      SELECT * FROM UserVoteTracking
      WHERE UserID = @userId AND SessionID = @sessionId
    `;
    
    const existingTracking = await executeQuery(trackingCheck, { userId, sessionId });
    
    if (existingTracking.recordset && existingTracking.recordset.length === 0) {
      // Create tracking record
      const trackingInsert = `
        INSERT INTO UserVoteTracking (
          SessionID, UserID, TotalVotesUsed, TotalVotesAvailable, LastVotedAt
        )
        VALUES (
          @sessionId, @userId, 0, @allocatedVotes, NULL
        )
      `;
      
      await executeQuery(trackingInsert, {
        sessionId,
        userId,
        allocatedVotes
      });
      
      console.log('✅ Vote tracking created successfully!');
    } else {
      console.log('✅ Vote tracking already exists');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('EMPLOYEE VOTING SETUP COMPLETE');
    console.log('='.repeat(60));
    console.log(`User ID: ${userId}`);
    console.log(`Email: employee@forvismazars.com`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Allocated Votes: ${allocatedVotes}`);
    console.log(`Votes Used: 0`);
    console.log(`Votes Remaining: ${allocatedVotes}`);
    console.log('='.repeat(60));
    console.log('\n✨ Employee can now vote!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupEmployeeVoting();
