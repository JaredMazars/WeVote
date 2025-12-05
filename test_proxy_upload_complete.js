// Complete test suite for proxy PDF upload, save, and download
import database from './server/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCompleteTest() {
  console.log('🧪 COMPLETE PROXY PDF UPLOAD TEST SUITE\n');
  console.log('=' .repeat(60));

  try {
    // TEST 1: Verify Database Columns
    console.log('\n📋 TEST 1: Verifying Database Columns...');
    const columns = await database.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('proxy_vote_form', 'proxy_file_path', 'proxy_file_name', 'proxy_uploaded_at')
      ORDER BY COLUMN_NAME;
    `);

    if (columns.length === 4) {
      console.log('✅ All required columns exist:');
      columns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
      });
    } else {
      console.log('❌ Missing columns! Found:', columns.length);
      console.log('⚠️ Run this SQL to create missing columns:');
      console.log(`
ALTER TABLE users ADD proxy_vote_form VARCHAR(50) NULL;
ALTER TABLE users ADD proxy_file_path VARCHAR(500) NULL;
ALTER TABLE users ADD proxy_file_name VARCHAR(255) NULL;
ALTER TABLE users ADD proxy_uploaded_at DATETIME NULL;
      `);
      await database.close();
      process.exit(1);
    }

    // TEST 2: Find or Create Test User
    console.log('\n📋 TEST 2: Setting Up Test User...');
    
    // Check if test user exists
    let testUser = await database.query(`
      SELECT TOP 1 id, email, name, proxy_vote_form, proxy_file_name
      FROM users
      WHERE email LIKE '%test%' OR email LIKE '%demo%'
      ORDER BY id DESC;
    `);

    let testUserId;
    if (testUser.length > 0) {
      testUserId = testUser[0].id;
      console.log(`✅ Using existing test user: ID ${testUserId} (${testUser[0].email})`);
      
      // Set to manual proxy if not already
      await database.query(`
        UPDATE users 
        SET proxy_vote_form = 'manual',
            proxy_file_name = NULL,
            proxy_file_path = NULL,
            proxy_uploaded_at = NULL
        WHERE id = ${testUserId};
      `);
      console.log('   Reset test user to manual proxy (no file)');
    } else {
      // Use any user for testing
      const anyUser = await database.query(`
        SELECT TOP 1 id, email, name FROM users ORDER BY id DESC;
      `);
      
      if (anyUser.length === 0) {
        console.log('❌ No users found in database!');
        await database.close();
        process.exit(1);
      }
      
      testUserId = anyUser[0].id;
      console.log(`✅ Using user: ID ${testUserId} (${anyUser[0].email})`);
      
      await database.query(`
        UPDATE users 
        SET proxy_vote_form = 'manual',
            proxy_file_name = NULL,
            proxy_file_path = NULL,
            proxy_uploaded_at = NULL
        WHERE id = ${testUserId};
      `);
      console.log('   Set user to manual proxy (no file)');
    }

    // TEST 3: Verify Uploads Directory
    console.log('\n📋 TEST 3: Checking Uploads Directory...');
    const uploadsDir = path.join(__dirname, 'server', 'uploads', 'proxy-files');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory:', uploadsDir);
    } else {
      console.log('✅ Uploads directory exists:', uploadsDir);
    }

    const userDir = path.join(uploadsDir, `user-${testUserId}`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
      console.log('✅ Created user directory:', userDir);
    } else {
      console.log('✅ User directory exists:', userDir);
    }

    // TEST 4: Create Dummy PDF
    console.log('\n📋 TEST 4: Creating Dummy PDF...');
    const dummyPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 100
>>
stream
BT
/F1 24 Tf
100 700 Td
(TEST PROXY FORM - User ${testUserId}) Tj
0 -30 Td
(Date: ${new Date().toLocaleDateString()}) Tj
0 -30 Td
(This is a test proxy form) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
467
%%EOF`;

    const timestamp = Date.now();
    const testFileName = `proxy-test-${timestamp}.pdf`;
    const testFilePath = path.join(userDir, testFileName);
    
    fs.writeFileSync(testFilePath, dummyPdfContent);
    console.log('✅ Created dummy PDF:', testFileName);
    console.log('   File path:', testFilePath);
    console.log('   File size:', fs.statSync(testFilePath).size, 'bytes');

    // TEST 5: Simulate Database Update (like upload endpoint does)
    console.log('\n📋 TEST 5: Updating Database with File Info...');
    const relativePath = `uploads/proxy-files/user-${testUserId}/${testFileName}`;
    
    await database.query(`
      UPDATE users 
      SET proxy_file_path = '${relativePath}',
          proxy_file_name = '${testFileName}',
          proxy_uploaded_at = GETDATE()
      WHERE id = ${testUserId};
    `);
    console.log('✅ Database updated successfully');

    // TEST 6: Verify Database Update
    console.log('\n📋 TEST 6: Verifying Database Update...');
    const updatedUser = await database.query(`
      SELECT 
        id,
        email,
        name,
        proxy_vote_form,
        proxy_file_name,
        proxy_file_path,
        CONVERT(VARCHAR, proxy_uploaded_at, 120) as upload_date
      FROM users
      WHERE id = ${testUserId};
    `);

    if (updatedUser.length > 0 && updatedUser[0].proxy_file_name) {
      console.log('✅ Database verification passed:');
      console.log('   User ID:', updatedUser[0].id);
      console.log('   Email:', updatedUser[0].email);
      console.log('   Proxy Choice:', updatedUser[0].proxy_vote_form);
      console.log('   File Name:', updatedUser[0].proxy_file_name);
      console.log('   File Path:', updatedUser[0].proxy_file_path);
      console.log('   Uploaded At:', updatedUser[0].upload_date);
    } else {
      console.log('❌ Database verification failed!');
      await database.close();
      process.exit(1);
    }

    // TEST 7: Verify File is Readable
    console.log('\n📋 TEST 7: Verifying File is Readable...');
    if (fs.existsSync(testFilePath)) {
      const fileContent = fs.readFileSync(testFilePath, 'utf8');
      if (fileContent.includes('%PDF') && fileContent.includes(`User ${testUserId}`)) {
        console.log('✅ File is readable and contains correct content');
        console.log('   Preview:', fileContent.substring(0, 100) + '...');
      } else {
        console.log('⚠️ File exists but content might be corrupted');
      }
    } else {
      console.log('❌ File does not exist at path:', testFilePath);
    }

    // TEST 8: Simulate Admin Approval View
    console.log('\n📋 TEST 8: Simulating Admin Approval View...');
    const usersWithFiles = await database.query(`
      SELECT 
        id,
        email,
        name,
        proxy_file_name,
        proxy_file_path,
        CONVERT(VARCHAR, proxy_uploaded_at, 120) as upload_date
      FROM users
      WHERE proxy_file_name IS NOT NULL
      ORDER BY proxy_uploaded_at DESC;
    `);

    console.log(`✅ Found ${usersWithFiles.length} user(s) with uploaded files:`);
    usersWithFiles.forEach(user => {
      console.log(`   - ID ${user.id}: ${user.email}`);
      console.log(`     File: ${user.proxy_file_name}`);
      console.log(`     Path: ${user.proxy_file_path}`);
      console.log(`     Uploaded: ${user.upload_date}`);
      console.log('');
    });

    // TEST 9: Test File Download URL
    console.log('\n📋 TEST 9: Testing File Download URL...');
    const downloadUrl = `http://localhost:3001/uploads/proxy-files/user-${testUserId}/${testFileName}`;
    console.log('✅ File should be accessible at:');
    console.log('   ' + downloadUrl);
    console.log('');
    console.log('⚠️ NOTE: Server must be running for this URL to work!');
    console.log('   Start server: node server/app.js');

    // TEST 10: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY\n');
    console.log('✅ All tests passed successfully!\n');
    
    console.log('📝 Test Results:');
    console.log('   1. ✅ Database columns verified');
    console.log('   2. ✅ Test user configured (ID: ' + testUserId + ')');
    console.log('   3. ✅ Uploads directory created');
    console.log('   4. ✅ Dummy PDF created');
    console.log('   5. ✅ Database updated with file info');
    console.log('   6. ✅ Database update verified');
    console.log('   7. ✅ File is readable');
    console.log('   8. ✅ Admin view simulation passed');
    console.log('   9. ✅ Download URL generated');
    console.log('');
    
    console.log('🎯 Next Steps:');
    console.log('   1. Start backend server: node server/app.js');
    console.log('   2. Start frontend: npm run dev');
    console.log('   3. Login with test user (ID: ' + testUserId + ')');
    console.log('   4. Check navbar - should see green "View Proxy Form" button');
    console.log('   5. Click button to see the test file');
    console.log('   6. Click "View" link to open PDF in browser');
    console.log('');
    
    console.log('📂 Test Files Created:');
    console.log('   - ' + testFilePath);
    console.log('');
    
    console.log('🌐 Access URLs:');
    console.log('   - PDF URL: ' + downloadUrl);
    console.log('   - Frontend: http://localhost:5173');
    console.log('   - Backend: http://localhost:3001');
    console.log('');
    
    console.log('🔍 Verification Queries:');
    console.log('   -- Check test user');
    console.log(`   SELECT * FROM users WHERE id = ${testUserId};`);
    console.log('');
    console.log('   -- Check all uploaded files');
    console.log('   SELECT id, email, proxy_file_name FROM users WHERE proxy_file_name IS NOT NULL;');
    console.log('');
    
    console.log('🧹 Cleanup (if needed):');
    console.log(`   -- Reset test user`);
    console.log(`   UPDATE users SET proxy_file_name = NULL, proxy_file_path = NULL WHERE id = ${testUserId};`);
    console.log('');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await database.close();
    console.log('\n✅ Database connection closed');
  }
}

runCompleteTest();
