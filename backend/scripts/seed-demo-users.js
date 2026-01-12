// =====================================================
// Demo Users Seeder Script
// Run this to create demo users with all roles
// =====================================================

require('dotenv').config();
const sql = require('mssql');
const bcrypt = require('bcryptjs');

const DEMO_PASSWORD = 'Demo@123';

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

const demoUsers = [
  {
    email: 'superadmin@forvismazars.com',
    firstName: 'Super',
    lastName: 'Administrator',
    role: 'super_admin',
    description: 'Full system access - can manage everything'
  },
  {
    email: 'admin@forvismazars.com',
    firstName: 'John',
    lastName: 'Administrator',
    role: 'admin',
    description: 'Organization admin - can manage users, sessions, and votes'
  },
  {
    email: 'auditor@forvismazars.com',
    firstName: 'Sarah',
    lastName: 'Auditor',
    role: 'auditor',
    description: 'Read-only access - can view all data but cannot modify'
  },
  {
    email: 'employee@forvismazars.com',
    firstName: 'Michael',
    lastName: 'Employee',
    role: 'employee',
    description: 'Employee user - can vote and manage own profile'
  },
  {
    email: 'user@forvismazars.com',
    firstName: 'Jane',
    lastName: 'User',
    role: 'user',
    description: 'Regular voter - basic voting privileges'
  },
  {
    email: 'proxy.holder@forvismazars.com',
    firstName: 'Robert',
    lastName: 'Proxy',
    role: 'employee',
    description: 'Test user for proxy voting scenarios'
  },
  {
    email: 'voter1@forvismazars.com',
    firstName: 'Emily',
    lastName: 'Voter',
    role: 'user',
    description: 'Additional test voter'
  },
  {
    email: 'voter2@forvismazars.com',
    firstName: 'David',
    lastName: 'Smith',
    role: 'user',
    description: 'Additional test voter'
  }
];

async function seedDemoUsers() {
  let pool;
  try {
    console.log('🌱 Starting demo users seeding...\n');

    console.log('🔌 Connecting to database...');
    pool = await sql.connect(config);
    console.log('✅ Connected to database\n');

    // Hash the password once (same for all users)
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    console.log('✅ Password hashed successfully\n');

    // Check for organization (create if doesn't exist)
    console.log('🏢 Checking for organization...');
    const orgCheck = await pool.request().query(`
      SELECT OrganizationID FROM Organizations WHERE OrganizationID = 1
    `);

    if (orgCheck.recordset.length === 0) {
      console.log('⚠️  Organization not found, creating default organization...');
      await pool.request()
        .input('name', sql.NVarChar, 'Forvis Mazars')
        .input('domain', sql.NVarChar, 'forvismazars.com')
        .query(`
          INSERT INTO Organizations (Name, Domain, IsActive, CreatedAt)
          VALUES (@name, @domain, 1, GETDATE())
        `);
      console.log('✅ Default organization created\n');
    } else {
      console.log('✅ Organization exists\n');
    }

    // Insert demo users
    console.log('👥 Creating demo users...\n');
    
    for (const user of demoUsers) {
      try {
        // Check if user already exists
        const existingUser = await pool.request()
          .input('email', sql.NVarChar, user.email)
          .query('SELECT UserID FROM Users WHERE Email = @email');

        if (existingUser.recordset.length > 0) {
          console.log(`⚠️  User ${user.email} already exists - skipping`);
          continue;
        }

        // Insert new user
        await pool.request()
          .input('email', sql.NVarChar, user.email)
          .input('passwordHash', sql.NVarChar, passwordHash)
          .input('salt', sql.NVarChar, '') // bcrypt handles salt internally
          .input('firstName', sql.NVarChar, user.firstName)
          .input('lastName', sql.NVarChar, user.lastName)
          .input('role', sql.NVarChar, user.role)
          .input('organizationId', sql.Int, 1)
          .query(`
            INSERT INTO Users (
              Email, PasswordHash, Salt, FirstName, LastName, Role,
              OrganizationID, IsActive, IsEmailVerified,
              CreatedAt, LastLoginAt
            )
            VALUES (
              @email, @passwordHash, @salt, @firstName, @lastName, @role,
              @organizationId, 1, 1,
              GETDATE(), GETDATE()
            )
          `);

        console.log(`✅ Created: ${user.email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role.toUpperCase()}`);
        console.log(`   ${user.description}\n`);

      } catch (error) {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
      }
    }

    console.log('\n========================================');
    console.log('✅ DEMO USERS SEEDING COMPLETE!');
    console.log('========================================\n');

    console.log('📋 LOGIN CREDENTIALS:\n');
    console.log('Password for ALL users: Demo@123\n');
    
    console.log('Available Demo Users:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    demoUsers.forEach(user => {
      console.log(`\n📧 ${user.email}`);
      console.log(`   Role: ${user.role.toUpperCase()}`);
      console.log(`   User: ${user.firstName} ${user.lastName}`);
      console.log(`   Access: ${user.description}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔐 LOGIN EXAMPLES:\n');
    console.log('Super Admin:');
    console.log('  Email: superadmin@forvismazars.com');
    console.log('  Password: Demo@123\n');

    console.log('Admin:');
    console.log('  Email: admin@forvismazars.com');
    console.log('  Password: Demo@123\n');

    console.log('Regular User:');
    console.log('  Email: user@forvismazars.com');
    console.log('  Password: Demo@123\n');

  } catch (error) {
    console.error('❌ Error seeding demo users:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
    process.exit(0);
  }
}

// Run the seeder
seedDemoUsers();
