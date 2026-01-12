require('dotenv').config();
const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME || process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'yes' || process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    connectTimeout: 30000
  }
};

const DEMO_PASSWORD = 'Demo@123';

async function fixUserPasswords() {
  let pool;
  
  try {
    console.log('🔍 Checking user passwords...\n');
    
    pool = await sql.connect(config);
    console.log('✅ Connected to database\n');

    // Get all users
    const users = await pool.request().query(`
      SELECT UserID, Email, FirstName, LastName, PasswordHash, Salt
      FROM Users
      ORDER BY UserID
    `);

    console.log(`📊 Found ${users.recordset.length} users in database\n`);

    // Check each user
    const usersToFix = [];
    for (const user of users.recordset) {
      // Check if password hash looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
      const isBcryptHash = user.PasswordHash && /^\$2[aby]\$/.test(user.PasswordHash);
      
      if (!isBcryptHash) {
        usersToFix.push(user);
        console.log(`❌ User needs password fix: ${user.Email}`);
        console.log(`   Current hash: ${user.PasswordHash ? user.PasswordHash.substring(0, 20) + '...' : 'NULL'}`);
      } else {
        console.log(`✅ User OK: ${user.Email}`);
      }
    }

    if (usersToFix.length === 0) {
      console.log('\n✅ All users have proper bcrypt password hashes!');
      console.log('\n📋 All users use password: Demo@123');
      return;
    }

    console.log(`\n⚠️  Found ${usersToFix.length} users that need password fixes\n`);
    console.log('🔐 Generating bcrypt hash for password: Demo@123\n');

    // Hash the password
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    console.log('✅ Password hashed successfully\n');

    // Fix each user
    console.log('🔧 Fixing user passwords...\n');
    
    for (const user of usersToFix) {
      await pool.request()
        .input('userId', sql.Int, user.UserID)
        .input('passwordHash', sql.NVarChar, passwordHash)
        .input('salt', sql.NVarChar, '') // bcrypt handles salt internally
        .query(`
          UPDATE Users 
          SET PasswordHash = @passwordHash,
              Salt = @salt,
              UpdatedAt = GETDATE()
          WHERE UserID = @userId
        `);
      
      console.log(`✅ Fixed: ${user.Email} (${user.FirstName} ${user.LastName})`);
    }

    console.log('\n========================================');
    console.log('✅ PASSWORD FIX COMPLETE!');
    console.log('========================================\n');

    console.log('📋 UPDATED USER CREDENTIALS:\n');
    console.log('Password for ALL users: Demo@123\n');
    
    console.log('Users that were updated:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    usersToFix.forEach(user => {
      console.log(`📧 ${user.Email}`);
      console.log(`   Name: ${user.FirstName} ${user.LastName}`);
      console.log(`   Password: Demo@123\n`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show all users with their new status
    const allUsers = await pool.request().query(`
      SELECT UserID, Email, FirstName, LastName, Role, IsActive, IsEmailVerified
      FROM Users
      ORDER BY UserID
    `);

    console.log('📊 ALL USERS IN DATABASE:\n');
    allUsers.recordset.forEach(user => {
      console.log(`${user.IsActive ? '✅' : '❌'} ${user.Email}`);
      console.log(`   ID: ${user.UserID} | Role: ${user.Role.toUpperCase()} | Verified: ${user.IsEmailVerified ? 'Yes' : 'No'}`);
      console.log(`   Name: ${user.FirstName} ${user.LastName}`);
      console.log(`   Password: Demo@123\n`);
    });

  } catch (error) {
    console.error('\n❌ Error fixing passwords:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
    process.exit(0);
  }
}

// Run the fix
fixUserPasswords();
