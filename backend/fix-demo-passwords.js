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
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === 'yes' ||
      process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

const DEMO_PASSWORD = 'Demo@123';

const accounts = [
  { email: 'superadmin@forvismazars.com', role: 'super_admin' },
  { email: 'admin@forvismazars.com',      role: 'admin' },
  { email: 'auditor@forvismazars.com',    role: 'auditor' },
  { email: 'employee@forvismazars.com',   role: 'employee' },
  { email: 'user@forvismazars.com',       role: 'user' },
];

(async () => {
  let pool;
  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    console.log('Connected.\n');

    const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
    console.log('Password hash generated.\n');

    for (const account of accounts) {
      const result = await pool.request()
        .input('hash', sql.NVarChar, hash)
        .input('email', sql.NVarChar, account.email)
        .query(`
          UPDATE Users
          SET PasswordHash = @hash,
              Salt = '',
              IsActive = 1,
              IsEmailVerified = 1
          WHERE Email = @email
        `);

      if (result.rowsAffected[0] > 0) {
        // Verify it actually works
        const row = await pool.request()
          .input('email', sql.NVarChar, account.email)
          .query('SELECT PasswordHash FROM Users WHERE Email = @email');
        const valid = await bcrypt.compare(DEMO_PASSWORD, row.recordset[0].PasswordHash);
        console.log(`${account.email} [${account.role}]: ${valid ? 'OK' : 'HASH MISMATCH'}`);
      } else {
        // User doesn't exist — insert it
        console.log(`${account.email}: NOT FOUND — creating...`);
        await pool.request()
          .input('email', sql.NVarChar, account.email)
          .input('hash', sql.NVarChar, hash)
          .input('role', sql.NVarChar, account.role)
          .query(`
            INSERT INTO Users (Email, PasswordHash, Salt, FirstName, LastName, Role,
              OrganizationID, IsActive, IsEmailVerified, CreatedAt, LastLoginAt)
            VALUES (@email, @hash, '', @role, @role, @role,
              1, 1, 1, GETDATE(), GETDATE())
          `);
        console.log(`${account.email}: CREATED`);
      }
    }

    console.log('\n--- All done ---');
    console.log('Password for all accounts: Demo@123');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
})();
