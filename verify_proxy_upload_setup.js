// Quick setup and verification script for proxy file upload testing
import database from './server/config/database.js';

async function setupAndVerify() {
  try {
    console.log('🔍 Starting proxy file upload setup verification...\n');

    // 1. Check if required columns exist
    console.log('📋 Step 1: Checking database columns...');
    const columnsCheck = await database.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('proxy_vote_form', 'proxy_file_name', 'proxy_file_path', 'proxy_uploaded_at')
      ORDER BY COLUMN_NAME;
    `);

    if (columnsCheck.length === 4) {
      console.log('✅ All required columns exist:');
      columnsCheck.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('❌ Missing columns! Found:', columnsCheck.length);
      columnsCheck.forEach(col => console.log(`   - ${col.COLUMN_NAME}`));
      console.log('\n⚠️ Please run the following SQL to add missing columns:');
      console.log(`
ALTER TABLE users ADD proxy_vote_form VARCHAR(50) NULL;
ALTER TABLE users ADD proxy_file_name VARCHAR(255) NULL;
ALTER TABLE users ADD proxy_file_path VARCHAR(500) NULL;
ALTER TABLE users ADD proxy_uploaded_at DATETIME NULL;
      `);
      process.exit(1);
    }

    // 2. Find users with manual proxy choice
    console.log('\n📋 Step 2: Finding users with manual proxy choice...');
    const manualUsers = await database.query(`
      SELECT 
        id,
        email,
        name,
        proxy_vote_form,
        proxy_file_name,
        proxy_file_path,
        CASE 
          WHEN proxy_file_name IS NOT NULL THEN 'Has File'
          ELSE 'No File'
        END as file_status
      FROM users
      WHERE proxy_vote_form = 'manual'
      ORDER BY id;
    `);

    if (manualUsers.length > 0) {
      console.log(`✅ Found ${manualUsers.length} user(s) with manual proxy choice:`);
      manualUsers.forEach(user => {
        console.log(`   - ID ${user.id}: ${user.email} (${user.name}) - ${user.file_status}`);
      });
    } else {
      console.log('⚠️ No users found with proxy_vote_form = "manual"');
      console.log('\nℹ️ You can set a test user to manual with:');
      console.log('UPDATE users SET proxy_vote_form = \'manual\' WHERE id = <YOUR_TEST_USER_ID>;');
    }

    // 3. Find users with uploaded files
    console.log('\n📋 Step 3: Finding users with uploaded files...');
    const usersWithFiles = await database.query(`
      SELECT 
        id,
        email,
        name,
        proxy_vote_form,
        proxy_file_name,
        CONVERT(VARCHAR, proxy_uploaded_at, 120) as upload_date
      FROM users
      WHERE proxy_file_name IS NOT NULL
      ORDER BY proxy_uploaded_at DESC;
    `);

    if (usersWithFiles.length > 0) {
      console.log(`✅ Found ${usersWithFiles.length} user(s) with uploaded files:`);
      usersWithFiles.forEach(user => {
        console.log(`   - ID ${user.id}: ${user.email}`);
        console.log(`     File: ${user.proxy_file_name}`);
        console.log(`     Uploaded: ${user.upload_date}`);
      });
    } else {
      console.log('ℹ️ No users have uploaded files yet');
    }

    // 4. Summary of all proxy choices
    console.log('\n📋 Step 4: Summary of all proxy choices...');
    const proxySummary = await database.query(`
      SELECT 
        COALESCE(proxy_vote_form, 'Not Set') as proxy_choice,
        COUNT(*) as user_count
      FROM users
      GROUP BY proxy_vote_form
      ORDER BY user_count DESC;
    `);

    console.log('✅ Proxy choice distribution:');
    proxySummary.forEach(row => {
      console.log(`   - ${row.proxy_choice}: ${row.user_count} users`);
    });

    // 5. Check uploads folder exists
    console.log('\n📋 Step 5: Checking uploads folder...');
    const fs = await import('fs');
    const path = await import('path');
    const uploadsDir = path.join(process.cwd(), 'uploads', 'proxy-files');
    
    if (fs.existsSync(uploadsDir)) {
      console.log(`✅ Uploads folder exists: ${uploadsDir}`);
      
      // List user folders
      const userFolders = fs.readdirSync(uploadsDir);
      if (userFolders.length > 0) {
        console.log(`   Found ${userFolders.length} user folder(s):`);
        userFolders.forEach(folder => {
          const folderPath = path.join(uploadsDir, folder);
          const files = fs.readdirSync(folderPath);
          console.log(`   - ${folder}: ${files.length} file(s)`);
        });
      } else {
        console.log('   No user folders yet');
      }
    } else {
      console.log('⚠️ Uploads folder does not exist yet');
      console.log('   It will be created automatically on first upload');
    }

    // 6. Test recommendations
    console.log('\n📋 Step 6: Test recommendations...');
    console.log('✅ Setup verification complete!\n');
    
    if (manualUsers.length === 0) {
      console.log('⚠️ RECOMMENDED ACTION:');
      console.log('   Set a test user to manual proxy:');
      console.log('   UPDATE users SET proxy_vote_form = \'manual\', proxy_file_name = NULL WHERE id = 171;\n');
    }

    console.log('📝 Next steps:');
    console.log('   1. Start backend: node server/app.js');
    console.log('   2. Start frontend: npm run dev');
    console.log('   3. Login with a manual proxy user');
    console.log('   4. Look for white "Upload Proxy Form" button');
    console.log('   5. Upload a test PDF file');
    console.log('   6. Verify button changes to green "View Proxy Form"');
    console.log('   7. Click to view and test file replacement\n');

    console.log('📖 For complete testing guide, see: PROXY_FILE_UPLOAD_TEST_GUIDE.md');
    console.log('📖 For implementation details, see: PROXY_FILE_UPLOAD_IMPLEMENTATION_SUMMARY.md\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    console.error('\nPlease ensure:');
    console.error('1. Database connection is configured correctly');
    console.error('2. server/config/database.js exists');
    console.error('3. Database server is running');
  } finally {
    await database.close();
  }
}

setupAndVerify();
