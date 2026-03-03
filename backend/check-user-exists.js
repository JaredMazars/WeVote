require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true
  }
};

sql.connect(config)
  .then(pool => pool.query("SELECT Email, PasswordHash FROM Users WHERE Email = 'employee@forvismazars.com'"))
  .then(result => {
    console.log('User exists in database:', result.recordset.length > 0);
    if (result.recordset.length > 0) {
      console.log('Email:', result.recordset[0].Email);
      console.log('Has password hash:', !!result.recordset[0].PasswordHash);
    } else {
      console.log('❌ User NOT FOUND in database!');
      console.log('You need to create this user in the new Azure SQL database.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Database error:', err.message);
    process.exit(1);
  });
