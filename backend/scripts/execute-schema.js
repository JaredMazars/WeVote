require('dotenv').config();
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

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

console.log('🚀 Starting schema execution...');
console.log('📊 Database:', config.database);
console.log('🔌 Server:', config.server);
console.log('');

async function executeSchema() {
  let pool;
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    console.log('📄 Reading schema file:', schemaPath);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found: ' + schemaPath);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded successfully');
    console.log('');

    // Connect to database
    console.log('🔌 Connecting to Azure SQL...');
    pool = await sql.connect(config);
    console.log('✅ Connected to database');
    console.log('');

    // Split schema by GO statements
    const batches = schema
      .split(/\nGO\n|\nGO\r\n|\r\nGO\r\n|\nGO$/gim)
      .map(batch => batch.trim())
      .filter(batch => batch.length > 0);

    console.log(`📦 Found ${batches.length} SQL batches to execute`);
    console.log('');

    // Execute each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // Skip comments-only batches
      if (batch.match(/^[\s\-\/*]*$/)) continue;
      
      try {
        // Show progress for tables/views/procedures
        if (batch.includes('CREATE TABLE')) {
          const tableName = batch.match(/CREATE TABLE (\[?\w+\]?\.)?(\[?\w+\]?)/i)?.[2]?.replace(/[\[\]]/g, '');
          console.log(`📋 Creating table: ${tableName || 'Unknown'}`);
        } else if (batch.includes('CREATE VIEW')) {
          const viewName = batch.match(/CREATE VIEW (\[?\w+\]?\.)?(\[?\w+\]?)/i)?.[2]?.replace(/[\[\]]/g, '');
          console.log(`👁️  Creating view: ${viewName || 'Unknown'}`);
        } else if (batch.includes('CREATE PROCEDURE')) {
          const procName = batch.match(/CREATE PROCEDURE (\[?\w+\]?\.)?(\[?\w+\]?)/i)?.[2]?.replace(/[\[\]]/g, '');
          console.log(`⚙️  Creating procedure: ${procName || 'Unknown'}`);
        } else if (batch.includes('CREATE TRIGGER')) {
          const triggerName = batch.match(/CREATE TRIGGER (\[?\w+\]?\.)?(\[?\w+\]?)/i)?.[2]?.replace(/[\[\]]/g, '');
          console.log(`🎯 Creating trigger: ${triggerName || 'Unknown'}`);
        } else if (batch.includes('INSERT INTO')) {
          const tableName = batch.match(/INSERT INTO (\[?\w+\]?\.)?(\[?\w+\]?)/i)?.[2]?.replace(/[\[\]]/g, '');
          console.log(`📥 Inserting data into: ${tableName || 'Unknown'}`);
        }
        
        await pool.request().query(batch);
      } catch (err) {
        console.error(`❌ Error in batch ${i + 1}:`, err.message);
        // Continue with other batches unless it's a critical error
        if (err.message.includes('There is already an object')) {
          console.log('   ⚠️  Object already exists, continuing...');
        } else {
          throw err;
        }
      }
    }

    console.log('');
    console.log('✅ Schema execution completed successfully!');
    console.log('');

    // Verify tables were created
    console.log('🔍 Verifying database objects...');
    const result = await pool.request().query(`
      SELECT 
        'Tables' as Type,
        COUNT(*) as Count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      UNION ALL
      SELECT 
        'Views' as Type,
        COUNT(*) as Count
      FROM INFORMATION_SCHEMA.VIEWS
      UNION ALL
      SELECT 
        'Procedures' as Type,
        COUNT(*) as Count
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_TYPE = 'PROCEDURE'
    `);

    console.log('');
    console.log('📊 Database Objects Summary:');
    result.recordset.forEach(row => {
      console.log(`   ${row.Type}: ${row.Count}`);
    });

    console.log('');
    console.log('🎉 DATABASE SCHEMA SETUP COMPLETE!');
    
  } catch (err) {
    console.error('');
    console.error('❌ Schema execution failed:');
    console.error('Error:', err.message);
    if (err.precedingErrors) {
      err.precedingErrors.forEach(e => console.error('   -', e.message));
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

executeSchema()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
