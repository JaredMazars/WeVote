import database from './server/config/database.js';
import fs from 'fs';

async function clearUserVotes() {
  try {
    console.log('🔄 Reading SQL script...');
    const sqlScript = fs.readFileSync('./clear_user_votes.sql', 'utf8');

    console.log('🔄 Connecting to database...');
    const pool = await database.getPool();
    
    console.log('🔄 Executing SQL script to clear votes...\n');
    
    // Execute the SQL script
    await pool.request().query(sqlScript);
    
    console.log('\n✅ Script executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing votes:', error.message);
    console.error(error);
    process.exit(1);
  }
}

clearUserVotes();
