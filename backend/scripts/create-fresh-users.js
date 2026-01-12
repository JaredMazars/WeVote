// =====================================================
// Create Fresh Admin Users Script
// =====================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || process.env.DB_ENCRYPT === 'yes',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || process.env.DB_TRUST_SERVER_CERTIFICATE === 'yes',
    enableArithAbort: true,
    connectionTimeout: 30000,
    requestTimeout: 30000
  }
};

async function createFreshUsers() {
  let pool;
  
  try {
    console.log('🔌 Connecting to database...');
    pool = await sql.connect(config);
    console.log('✅ Connected to database');

    // Hash passwords
    const superAdminPassword = await bcrypt.hash('SuperAdmin@2026', 12);
    const adminPassword = await bcrypt.hash('Admin@2026', 12);
    const auditorPassword = await bcrypt.hash('Auditor@2026', 12);
    
    const salt = await bcrypt.genSalt(12);

    console.log('\n📝 Creating/Updating users...\n');

    // 1. Super Admin
    const superAdminEmail = 'super.admin@forvismazars.com';
    
    // Check if user exists
    const superAdminCheck = await pool.request()
      .input('email', sql.NVarChar, superAdminEmail)
      .query('SELECT UserID FROM Users WHERE Email = @email');
    
    if (superAdminCheck.recordset.length > 0) {
      // Update existing user
      await pool.request()
        .input('email', sql.NVarChar, superAdminEmail)
        .input('password', sql.NVarChar, superAdminPassword)
        .input('salt', sql.NVarChar, salt)
        .input('role', sql.NVarChar, 'superadmin')
        .query(`
          UPDATE Users 
          SET PasswordHash = @password, 
              Salt = @salt, 
              Role = @role, 
              IsEmailVerified = 1,
              UpdatedAt = GETDATE()
          WHERE Email = @email
        `);
    } else {
      // Insert new user
      await pool.request()
        .input('email', sql.NVarChar, superAdminEmail)
        .input('password', sql.NVarChar, superAdminPassword)
        .input('salt', sql.NVarChar, salt)
        .input('firstName', sql.NVarChar, 'Super')
        .input('lastName', sql.NVarChar, 'Admin')
        .input('role', sql.NVarChar, 'superadmin')
        .input('orgId', sql.Int, 1)
        .query(`
          INSERT INTO Users (Email, PasswordHash, Salt, FirstName, LastName, Role, OrganizationID, IsEmailVerified, CreatedAt, UpdatedAt)
          VALUES (@email, @password, @salt, @firstName, @lastName, @role, @orgId, 1, GETDATE(), GETDATE())
        `);
    }
    
    console.log('✅ Super Admin created');
    console.log('   Email: super.admin@forvismazars.com');
    console.log('   Password: SuperAdmin@2026');
    console.log('   Role: superadmin\n');

    // 2. Admin
    const adminEmail = 'admin@forvismazars.com';
    
    const adminCheck = await pool.request()
      .input('email', sql.NVarChar, adminEmail)
      .query('SELECT UserID FROM Users WHERE Email = @email');
    
    if (adminCheck.recordset.length > 0) {
      await pool.request()
        .input('email', sql.NVarChar, adminEmail)
        .input('password', sql.NVarChar, adminPassword)
        .input('salt', sql.NVarChar, salt)
        .input('role', sql.NVarChar, 'admin')
        .query(`
          UPDATE Users 
          SET PasswordHash = @password, 
              Salt = @salt, 
              Role = @role, 
              IsEmailVerified = 1,
              UpdatedAt = GETDATE()
          WHERE Email = @email
        `);
    } else {
      await pool.request()
        .input('email', sql.NVarChar, adminEmail)
        .input('password', sql.NVarChar, adminPassword)
        .input('salt', sql.NVarChar, salt)
        .input('firstName', sql.NVarChar, 'Admin')
        .input('lastName', sql.NVarChar, 'User')
        .input('role', sql.NVarChar, 'admin')
        .input('orgId', sql.Int, 1)
        .query(`
          INSERT INTO Users (Email, PasswordHash, Salt, FirstName, LastName, Role, OrganizationID, IsEmailVerified, CreatedAt, UpdatedAt)
          VALUES (@email, @password, @salt, @firstName, @lastName, @role, @orgId, 1, GETDATE(), GETDATE())
        `);
    }
    
    console.log('✅ Admin created');
    console.log('   Email: admin@forvismazars.com');
    console.log('   Password: Admin@2026');
    console.log('   Role: admin\n');

    // 3. Auditor
    const auditorEmail = 'auditor@forvismazars.com';
    
    const auditorCheck = await pool.request()
      .input('email', sql.NVarChar, auditorEmail)
      .query('SELECT UserID FROM Users WHERE Email = @email');
    
    if (auditorCheck.recordset.length > 0) {
      await pool.request()
        .input('email', sql.NVarChar, auditorEmail)
        .input('password', sql.NVarChar, auditorPassword)
        .input('salt', sql.NVarChar, salt)
        .input('role', sql.NVarChar, 'auditor')
        .query(`
          UPDATE Users 
          SET PasswordHash = @password, 
              Salt = @salt, 
              Role = @role, 
              IsEmailVerified = 1,
              UpdatedAt = GETDATE()
          WHERE Email = @email
        `);
    } else {
      await pool.request()
        .input('email', sql.NVarChar, auditorEmail)
        .input('password', sql.NVarChar, auditorPassword)
        .input('salt', sql.NVarChar, salt)
        .input('firstName', sql.NVarChar, 'Auditor')
        .input('lastName', sql.NVarChar, 'User')
        .input('role', sql.NVarChar, 'auditor')
        .input('orgId', sql.Int, 1)
        .query(`
          INSERT INTO Users (Email, PasswordHash, Salt, FirstName, LastName, Role, OrganizationID, IsEmailVerified, CreatedAt, UpdatedAt)
          VALUES (@email, @password, @salt, @firstName, @lastName, @role, @orgId, 1, GETDATE(), GETDATE())
        `);
    }
    
    console.log('✅ Auditor created');
    console.log('   Email: auditor@forvismazars.com');
    console.log('   Password: Auditor@2026');
    console.log('   Role: auditor\n');

    console.log('🎉 All users created successfully!\n');
    console.log('='.repeat(60));
    console.log('CREDENTIALS SUMMARY');
    console.log('='.repeat(60));
    console.log('\n1. SUPER ADMIN');
    console.log('   Email: super.admin@forvismazars.com');
    console.log('   Password: SuperAdmin@2026');
    console.log('\n2. ADMIN');
    console.log('   Email: admin@forvismazars.com');
    console.log('   Password: Admin@2026');
    console.log('\n3. AUDITOR');
    console.log('   Email: auditor@forvismazars.com');
    console.log('   Password: Auditor@2026');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
createFreshUsers()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
