require('dotenv').config();
const sql = require('mssql');

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

console.log('🔌 Testing connection to Azure SQL...');
console.log('Server:', config.server);
console.log('Database:', config.database);
console.log('User:', config.user);
console.log('Port:', config.port);
console.log('Encrypt:', config.options.encrypt);
console.log('');

sql.connect(config)
  .then(pool => {
    console.log('✅ Connected to Azure SQL database successfully!');
    return pool.request().query('SELECT @@VERSION as version, DB_NAME() as database');
  })
  .then(result => {
    console.log('✅ Database Info:');
    console.log('   Database Name:', result.recordset[0].database);
    console.log('   SQL Server Version:', result.recordset[0].version.split('\n')[0]);
    return sql.close();
  })
  .then(() => {
    console.log('✅ Connection test complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    if (err.originalError) {
      console.error('Original Error:', err.originalError.message);
    }
    process.exit(1);
  });
