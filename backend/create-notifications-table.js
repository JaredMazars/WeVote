// =====================================================
// Create Notifications Table
// Run this script once to create the table
// =====================================================

const { executeQuery } = require('./src/config/database');
require('dotenv').config();

async function createNotificationsTable() {
  try {
    console.log('Creating Notifications table...');

    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Notifications' AND xtype='U')
      BEGIN
        CREATE TABLE Notifications (
          NotificationID INT IDENTITY(1,1) PRIMARY KEY,
          UserID INT NOT NULL,
          Title NVARCHAR(255) NOT NULL,
          Message NVARCHAR(MAX) NOT NULL,
          Type NVARCHAR(50) NOT NULL, -- 'info', 'warning', 'success', 'error'
          Category NVARCHAR(50) NULL, -- 'vote', 'session', 'proxy', 'system'
          RelatedEntityType NVARCHAR(50) NULL, -- 'session', 'candidate', 'resolution', 'proxy'
          RelatedEntityID INT NULL,
          IsRead BIT DEFAULT 0,
          ReadAt DATETIME2 NULL,
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          ExpiresAt DATETIME2 NULL,
          FOREIGN KEY (UserID) REFERENCES Users(UserID),
          CHECK (Type IN ('info', 'warning', 'success', 'error'))
        );
        
        PRINT 'Notifications table created successfully!';
      END
      ELSE
      BEGIN
        PRINT 'Notifications table already exists.';
      END
    `);

    console.log('✅ Notifications table created successfully!');

    console.log('Creating indexes...');
    
    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_UserID' AND object_id = OBJECT_ID('Notifications'))
      BEGIN
        CREATE INDEX IX_Notifications_UserID ON Notifications(UserID);
        PRINT 'Index IX_Notifications_UserID created.';
      END
    `);

    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_IsRead' AND object_id = OBJECT_ID('Notifications'))
      BEGIN
        CREATE INDEX IX_Notifications_IsRead ON Notifications(IsRead);
        PRINT 'Index IX_Notifications_IsRead created.';
      END
    `);

    await executeQuery(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_CreatedAt' AND object_id = OBJECT_ID('Notifications'))
      BEGIN
        CREATE INDEX IX_Notifications_CreatedAt ON Notifications(CreatedAt DESC);
        PRINT 'Index IX_Notifications_CreatedAt created.';
      END
    `);

    console.log('✅ Indexes created successfully!');
    console.log('\n✅ Notifications table setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating Notifications table:', error);
    throw error;
  }
}

createNotificationsTable()
  .then(() => {
    console.log('\nSetup completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nSetup failed:', err);
    process.exit(1);
  });
