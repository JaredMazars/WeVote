const sql = require('mssql');

const config = {
  server: 'wevotedb1.database.windows.net',
  database: 'wevotedb',
  user: 'admin1',
  password: 'wevote123$',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function verifyUser() {
  try {
    console.log('🔗 Connecting to database...\n');
    const pool = await sql.connect(config);
    
    const email = 'voter@forvismazars.com';
    
    // Check Users table
    console.log('1️⃣ Checking Users table...');
    const userResult = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT UserID, Email, FirstName, LastName, Role, IsActive, 
               PasswordHash, Salt
        FROM Users 
        WHERE Email = @email
      `);
    
    if (userResult.recordset.length === 0) {
      console.log('   ❌ User NOT found in Users table');
      console.log('\n   Creating user...\n');
      
      const bcrypt = require('bcryptjs');
      const password = 'Voter@2026';
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const insertResult = await pool.request()
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
      
      const userId = insertResult.recordset[0].UserID;
      console.log('   ✅ User created with ID:', userId);
      
      // Create employee record
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('employeeNumber', sql.NVarChar, 'EMP' + userId)
        .query(`
          INSERT INTO Employees (UserID, OrganizationID, EmployeeNumber, DepartmentID, Position)
          VALUES (@userId, 1, @employeeNumber, 1, 'Employee')
        `);
      console.log('   ✅ Employee record created\n');
      
      console.log('========================================');
      console.log('✅ USER CREATED SUCCESSFULLY');
      console.log('========================================');
      console.log('Email:    voter@forvismazars.com');
      console.log('Password: Voter@2026');
      console.log('UserID:   ' + userId);
      console.log('========================================\n');
      
    } else {
      const user = userResult.recordset[0];
      console.log('   ✅ User found in Users table');
      console.log('   UserID:', user.UserID);
      console.log('   Email:', user.Email);
      console.log('   Name:', user.FirstName, user.LastName);
      console.log('   Role:', user.Role);
      console.log('   IsActive:', user.IsActive);
      console.log('   Has Password:', user.PasswordHash ? 'Yes' : 'No');
      console.log('   Has Salt:', user.Salt ? 'Yes' : 'No');
      
      // Check Employees table
      console.log('\n2️⃣ Checking Employees table...');
      const empResult = await pool.request()
        .input('userId', sql.Int, user.UserID)
        .query(`
          SELECT EmployeeID, UserID, EmployeeNumber, Position
          FROM Employees 
          WHERE UserID = @userId
        `);
      
      if (empResult.recordset.length === 0) {
        console.log('   ❌ Employee record NOT found');
        console.log('   Creating employee record...');
        
        await pool.request()
          .input('userId', sql.Int, user.UserID)
          .input('employeeNumber', sql.NVarChar, 'EMP' + user.UserID)
          .query(`
            INSERT INTO Employees (UserID, OrganizationID, EmployeeNumber, DepartmentID, Position)
            VALUES (@userId, 1, @employeeNumber, 1, 'Employee')
          `);
        console.log('   ✅ Employee record created');
      } else {
        const emp = empResult.recordset[0];
        console.log('   ✅ Employee record found');
        console.log('   EmployeeID:', emp.EmployeeID);
        console.log('   EmployeeNumber:', emp.EmployeeNumber);
        console.log('   Position:', emp.Position);
      }
      
      // Test password
      console.log('\n3️⃣ Testing password...');
      const bcrypt = require('bcryptjs');
      const testPassword = 'Voter@2026';
      const isValid = await bcrypt.compare(testPassword, user.PasswordHash);
      
      if (isValid) {
        console.log('   ✅ Password is correct');
      } else {
        console.log('   ❌ Password is INCORRECT - Resetting...');
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(testPassword, salt);
        
        await pool.request()
          .input('userId', sql.Int, user.UserID)
          .input('password', sql.NVarChar, hashedPassword)
          .input('salt', sql.NVarChar, salt)
          .query(`
            UPDATE Users 
            SET PasswordHash = @password, Salt = @salt
            WHERE UserID = @userId
          `);
        console.log('   ✅ Password reset successfully');
      }
      
      console.log('\n========================================');
      console.log('✅ VERIFICATION COMPLETE');
      console.log('========================================');
      console.log('Email:    voter@forvismazars.com');
      console.log('Password: Voter@2026');
      console.log('UserID:   ' + user.UserID);
      console.log('========================================\n');
    }
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyUser();
