// Quick script to check proxy_vote_form value in database
import database from './server/config/database.js';

async function checkProxyVoteForm() {
  try {
    console.log('🔍 Checking proxy_vote_form values in database...\n');
    
    const sql = `
      SELECT id, email, name, proxy_vote_form, is_active
      FROM users
      WHERE is_active = 1
      ORDER BY created_at DESC
    `;
    
    const results = await database.query(sql);
    
    console.log('Found', results.length, 'active users:\n');
    
    results.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   proxy_vote_form: "${user.proxy_vote_form}" (type: ${typeof user.proxy_vote_form})`);
      console.log(`   is_active: ${user.is_active}\n`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProxyVoteForm();
