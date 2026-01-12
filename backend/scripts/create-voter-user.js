const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  }
};

async function createVoterUser() {
  try {
    console.log('🔗 Connecting to database...');
    const pool = await sql.connect(config);
    
    const email = 'voter@forvismazars.com';
    const password = 'Voter@2026';
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Check if user exists
    const checkUser = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT UserID FROM Users WHERE Email = @email');
    
    let userId;
    
    if (checkUser.recordset.length > 0) {
      // Update existing user
      userId = checkUser.recordset[0].UserID;
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('password', sql.NVarChar, hashedPassword)
        .input('salt', sql.NVarChar, salt)
        .query(`
          UPDATE Users 
          SET PasswordHash = @password, 
              Salt = @salt,
              Role = 'Employee',
              OrganizationID = 1,
              IsActive = 1
          WHERE UserID = @userId
        `);
      console.log('✅ Updated existing user');
    } else {
      // Insert new user
      const result = await pool.request()
        .input('firstName', sql.NVarChar, 'John')
        .input('lastName', sql.NVarChar, 'Voter')
        .input('email', sql.NVarChar, email)
        .input('password', sql.NVarChar, hashedPassword)
        .input('salt', sql.NVarChar, salt)
        .query(`
          INSERT INTO Users (FirstName, LastName, Email, PasswordHash, Salt, Role, OrganizationID, IsActive)
          OUTPUT INSERTED.UserID
          VALUES (@firstName, @lastName, @email, @password, @salt, 'Employee', 1, 1)
        `);
      userId = result.recordset[0].UserID;
      console.log('✅ Created new user');
    }
    
    // Check if employee record exists
    const checkEmployee = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT EmployeeID FROM Employees WHERE UserID = @userId');
    
    if (checkEmployee.recordset.length === 0) {
      // Create employee record
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('employeeNumber', sql.NVarChar, 'EMP' + userId)
        .query(`
          INSERT INTO Employees (
            UserID, OrganizationID, EmployeeNumber, DepartmentID, Position
          )
          VALUES (
            @userId, 1, @employeeNumber, 1, 'Employee'
          )
        `);
      console.log('✅ Created employee record');
    } else {
      console.log('✅ Employee record already exists');
    }
    
    console.log('\n========================================');
    console.log('🎯 VOTER LOGIN CREDENTIALS');
    console.log('========================================');
    console.log('Email:    voter@forvismazars.com');
    console.log('Password: Voter@2026');
    console.log('UserID:   ' + userId);
    console.log('Role:     Employee (Regular Voter)');
    console.log('========================================');
    console.log('\nLogin at: http://localhost:5173/login');
    console.log('After login, click "Start Voting" to see proxy votes\n');
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createVoterUser();
