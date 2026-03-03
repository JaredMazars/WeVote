require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'yes',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'yes',
    enableArithAbort: true,
    connectionTimeout: 30000
  }
};

console.log('Testing database connection with config:', {
  server: config.server,
  database: config.database,
  user: config.user,
  password: config.password ? '***' + config.password.slice(-4) : 'NOT SET',
  port: config.port,
  encrypt: config.options.encrypt,
  trustServerCertificate: config.options.trustServerCertificate
});

sql.connect(config)
  .then(pool => {
    console.log('✅ Database connection successful!');
    return pool.query('SELECT TOP 1 * FROM Users');
  })
  .then(result => {
    console.log('✅ Query successful! User count:', result.recordset.length);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  });
