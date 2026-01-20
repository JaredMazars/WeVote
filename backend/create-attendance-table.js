require('dotenv').config();
const sql = require('mssql');

async function createAttendanceTable() {
  const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };
  
  const pool = await sql.connect(config);
  
  try {
    console.log('Creating Attendance table...');
    
    await pool.request().query(`
      CREATE TABLE Attendance (
        AttendanceID INT IDENTITY(1,1) PRIMARY KEY,
        SessionID INT NOT NULL,
        UserID INT NOT NULL,
        CheckInTime DATETIME2 DEFAULT GETDATE(),
        CheckOutTime DATETIME2 NULL,
        CheckInMethod NVARCHAR(50) DEFAULT 'web',
        IPAddress NVARCHAR(45) NULL,
        DeviceInfo NVARCHAR(500) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Attendance_Session FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID),
        CONSTRAINT FK_Attendance_User FOREIGN KEY (UserID) REFERENCES Users(UserID),
        CONSTRAINT UQ_Attendance_Session_User UNIQUE(SessionID, UserID)
      );
    `);
    
    console.log('✅ Attendance table created successfully!');
    
    // Create index for better query performance
    await pool.request().query(`
      CREATE INDEX IX_Attendance_Session ON Attendance(SessionID);
      CREATE INDEX IX_Attendance_User ON Attendance(UserID);
      CREATE INDEX IX_Attendance_CheckInTime ON Attendance(CheckInTime);
    `);
    
    console.log('✅ Indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.close();
  }
}

createAttendanceTable();
