import database from './config/database.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function addProxyFileColumns() {
  try {
    console.log('🔄 Reading SQL script...');
    const sqlScript = fs.readFileSync(
      join(__dirname, 'setup', 'add_proxy_file_columns.sql'),
      'utf8'
    );

    console.log('🔄 Connecting to database...');
    const pool = await database.getPool();
    
    console.log('🔄 Executing SQL script...');
    // Split by GO statements and execute each batch
    const batches = sqlScript.split(/\nGO\n/gi);
    
    for (const batch of batches) {
      if (batch.trim()) {
        await pool.request().query(batch);
      }
    }

    console.log('✅ Proxy file columns added successfully!');
    console.log('📋 Added columns:');
    console.log('   - proxy_method (NVARCHAR(20))');
    console.log('   - proxy_file_path (NVARCHAR(500))');
    console.log('   - proxy_file_name (NVARCHAR(255))');
    console.log('   - proxy_uploaded_at (DATETIME)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding proxy file columns:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addProxyFileColumns();
