const { executeQuery } = require('./src/config/database');

async function checkRegularUsers() {
  try {
    console.log('\n🔍 CHECKING ALL USERS IN DATABASE...\n');
    
    const query = `
      SELECT 
        UserID, 
        Email, 
        FirstName, 
        LastName, 
        Role,
        IsEmailVerified,
        RequiresPasswordChange,
        CASE WHEN PasswordHash IS NOT NULL THEN 'YES' ELSE 'NO' END as HasPassword
      FROM Users 
      ORDER BY UserID
    `;
    
    const result = await executeQuery(query);
    
    if (result.recordset && result.recordset.length > 0) {
      console.log(`Total Users: ${result.recordset.length}\n`);
      console.log('='.repeat(100));
      
      result.recordset.forEach((user, index) => {
        console.log(`\nID: ${user.UserID}`);
        console.log(`Email: ${user.Email}`);
        console.log(`Name: ${user.FirstName} ${user.LastName}`);
        console.log(`Role: ${user.Role || 'NO ROLE SET'}`);
        console.log(`Email Verified: ${user.IsEmailVerified ? 'YES' : 'NO'}`);
        console.log(`Requires Password Change: ${user.RequiresPasswordChange ? 'YES' : 'NO'}`);
        console.log(`Has Password: ${user.HasPassword}`);
        console.log('-'.repeat(100));
      });
      
      // Filter regular users
      const regularUsers = result.recordset.filter(u => 
        !u.Role || u.Role === 'employee' || u.Role === 'user'
      );
      
      console.log(`\n\n📊 REGULAR USERS (non-admin): ${regularUsers.length}`);
      if (regularUsers.length > 0) {
        console.log('='.repeat(100));
        regularUsers.forEach(user => {
          console.log(`\nEmail: ${user.Email}`);
          console.log(`Name: ${user.FirstName} ${user.LastName}`);
          console.log(`Role: ${user.Role || 'NO ROLE'}`);
          console.log(`Password Set: ${user.HasPassword}`);
        });
      }
      
    } else {
      console.log('❌ No users found in database!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRegularUsers();
