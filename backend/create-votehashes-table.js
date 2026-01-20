// =====================================================
// Create VoteHashes Table for Blockchain Integration
// Run this script once to create the table
// =====================================================

const { executeQuery } = require('./src/config/database');
require('dotenv').config();

async function createVoteHashesTable() {
  try {
    console.log('Creating VoteHashes table...');

    // Create VoteHashes table
    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VoteHashes' AND xtype='U')
      BEGIN
        CREATE TABLE VoteHashes (
          HashID INT IDENTITY(1,1) PRIMARY KEY,
          VoteID INT NOT NULL,
          Hash NVARCHAR(256) NOT NULL UNIQUE,
          PreviousHash NVARCHAR(256) NULL,
          Timestamp DATETIME2 DEFAULT GETDATE(),
          UserID INT NOT NULL,
          SessionID INT NOT NULL,
          VoteType NVARCHAR(50) NOT NULL, -- 'candidate' or 'resolution'
          BlockchainMetadata NVARCHAR(MAX) NULL,
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          UpdatedAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (UserID) REFERENCES Users(UserID),
          FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID),
          CHECK (VoteType IN ('candidate', 'resolution'))
        );
        
        PRINT 'VoteHashes table created successfully!';
      END
      ELSE
      BEGIN
        PRINT 'VoteHashes table already exists.';
      END
    `);

    console.log('✅ VoteHashes table created successfully!');

    // Create indexes for performance
    console.log('Creating indexes...');
    
    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VoteHashes_VoteID' AND object_id = OBJECT_ID('VoteHashes'))
      BEGIN
        CREATE INDEX IX_VoteHashes_VoteID ON VoteHashes(VoteID);
        PRINT 'Index IX_VoteHashes_VoteID created.';
      END
    `);

    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VoteHashes_SessionID' AND object_id = OBJECT_ID('VoteHashes'))
      BEGIN
        CREATE INDEX IX_VoteHashes_SessionID ON VoteHashes(SessionID);
        PRINT 'Index IX_VoteHashes_SessionID created.';
      END
    `);

    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VoteHashes_UserID' AND object_id = OBJECT_ID('VoteHashes'))
      BEGIN
        CREATE INDEX IX_VoteHashes_UserID ON VoteHashes(UserID);
        PRINT 'Index IX_VoteHashes_UserID created.';
      END
    `);

    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VoteHashes_Hash' AND object_id = OBJECT_ID('VoteHashes'))
      BEGIN
        CREATE INDEX IX_VoteHashes_Hash ON VoteHashes(Hash);
        PRINT 'Index IX_VoteHashes_Hash created.';
      END
    `);

    console.log('✅ Indexes created successfully!');
    console.log('\n✅ VoteHashes table setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating VoteHashes table:', error);
    throw error;
  }
}

createVoteHashesTable()
  .then(() => {
    console.log('\nSetup completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nSetup failed:', err);
    process.exit(1);
  });
