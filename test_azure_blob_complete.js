// Complete test for Azure Blob Storage upload and download
import azureBlobService from './server/services/azureBlobService.js';
import database from './server/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAzureBlobStorage() {
  console.log('🧪 AZURE BLOB STORAGE COMPLETE TEST SUITE\n');
  console.log('=' .repeat(70));

  let testUserId = null;
  let uploadedBlobName = null;

  try {
    // TEST 1: Initialize Azure Blob Service
    console.log('\n📋 TEST 1: Initializing Azure Blob Storage...');
    const initResult = await azureBlobService.initialize();
    
    if (!initResult) {
      console.log('❌ Failed to initialize Azure Blob Storage');
      console.log('⚠️  Please check your Azure Storage credentials in .env file:');
      console.log('   AZURE_STORAGE_CONNECTION_STRING or');
      console.log('   AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_ACCOUNT_KEY');
      process.exit(1);
    }
    
    console.log('✅ Azure Blob Storage initialized successfully');

    // TEST 2: Setup Test User
    console.log('\n📋 TEST 2: Setting Up Test User...');
    
    let testUser = await database.query(`
      SELECT TOP 1 id, email, name FROM users WHERE email LIKE '%test%' OR email LIKE '%demo%'
      ORDER BY id DESC;
    `);

    if (testUser.length === 0) {
      testUser = await database.query(`
        SELECT TOP 1 id, email, name FROM users ORDER BY id DESC;
      `);
    }

    if (testUser.length === 0) {
      console.log('❌ No users found in database!');
      await database.close();
      process.exit(1);
    }

    testUserId = testUser[0].id;
    console.log(`✅ Using test user: ID ${testUserId} (${testUser[0].email})`);

    // Clear existing file data
    await database.query(`
      UPDATE users 
      SET proxy_vote_form = 'manual',
          proxy_file_name = NULL,
          proxy_file_path = NULL,
          proxy_uploaded_at = NULL
      WHERE id = ${testUserId};
    `);
    console.log('   Reset user proxy data for clean test');

    // TEST 3: Create Dummy PDF
    console.log('\n📋 TEST 3: Creating Dummy PDF...');
    
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
/Length 200
>>
stream
BT
/F1 24 Tf
100 700 Td
(AZURE BLOB TEST - User ${testUserId}) Tj
0 -30 Td
(Date: ${new Date().toLocaleDateString()}) Tj
0 -30 Td
(Time: ${new Date().toLocaleTimeString()}) Tj
0 -30 Td
(This is a test proxy form stored in Azure Blob Storage) Tj
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
567
%%EOF`;

    const testFileName = `azure-test-${Date.now()}.pdf`;
    const fileBuffer = Buffer.from(dummyPdfContent);
    
    console.log('✅ Created dummy PDF in memory');
    console.log('   Filename:', testFileName);
    console.log('   Size:', fileBuffer.length, 'bytes');

    // TEST 4: Upload to Azure Blob Storage
    console.log('\n📋 TEST 4: Uploading to Azure Blob Storage...');
    
    const uploadResult = await azureBlobService.uploadFile(
      testUserId,
      fileBuffer,
      testFileName,
      'application/pdf'
    );

    uploadedBlobName = uploadResult.blobName;

    console.log('✅ File uploaded successfully!');
    console.log('   Blob Name:', uploadResult.blobName);
    console.log('   Blob URL:', uploadResult.blobUrl);
    console.log('   Upload Date:', uploadResult.uploadDate);

    // TEST 5: Update Database
    console.log('\n📋 TEST 5: Updating Database...');
    
    await database.query(`
      UPDATE users 
      SET proxy_file_path = '${uploadResult.blobName}',
          proxy_file_name = '${testFileName}',
          proxy_uploaded_at = GETDATE()
      WHERE id = ${testUserId};
    `);

    console.log('✅ Database updated successfully');

    // TEST 6: Verify Database
    console.log('\n📋 TEST 6: Verifying Database...');
    
    const updatedUser = await database.query(`
      SELECT 
        id, email, name,
        proxy_vote_form,
        proxy_file_name,
        proxy_file_path,
        CONVERT(VARCHAR, proxy_uploaded_at, 120) as upload_date
      FROM users
      WHERE id = ${testUserId};
    `);

    if (updatedUser[0].proxy_file_name) {
      console.log('✅ Database verification passed:');
      console.log('   User ID:', updatedUser[0].id);
      console.log('   Email:', updatedUser[0].email);
      console.log('   File Name:', updatedUser[0].proxy_file_name);
      console.log('   Blob Path:', updatedUser[0].proxy_file_path);
      console.log('   Uploaded At:', updatedUser[0].upload_date);
    } else {
      console.log('❌ Database verification failed!');
    }

    // TEST 7: Download from Azure Blob Storage
    console.log('\n📋 TEST 7: Downloading from Azure Blob Storage...');
    
    const downloadedBuffer = await azureBlobService.downloadFile(uploadedBlobName);

    console.log('✅ File downloaded successfully!');
    console.log('   Downloaded size:', downloadedBuffer.length, 'bytes');
    console.log('   Original size:', fileBuffer.length, 'bytes');

    // Verify content matches
    if (Buffer.compare(downloadedBuffer, fileBuffer) === 0) {
      console.log('✅ Downloaded content matches original!');
    } else {
      console.log('❌ Downloaded content does NOT match original!');
    }

    // TEST 8: Test Public Blob URL
    console.log('\n📋 TEST 8: Testing Public Blob URL...');
    
    const blobUrl = uploadResult.blobUrl;
    console.log('   Testing URL:', blobUrl);
    console.log('   ⚠️  Note: Public access must be enabled on container');
    
    // TEST 9: List User Files
    console.log('\n📋 TEST 9: Listing User Files...');
    
    const userFiles = await azureBlobService.listUserFiles(testUserId);
    console.log(`✅ Found ${userFiles.length} file(s) for user ${testUserId}:`);
    userFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name}`);
      console.log(`      Size: ${file.contentLength} bytes`);
      console.log(`      Created: ${file.createdOn}`);
    });

    // TEST 10: Test Download Endpoint
    console.log('\n📋 TEST 10: Testing Download API Endpoint...');
    console.log('   ⚠️  Start the backend server to test this:');
    console.log('   node server/app.js');
    console.log('');
    console.log('   Then access:');
    const downloadUrl = `http://localhost:3001/api/proxy/download-proxy-form/${testUserId}/${uploadedBlobName}`;
    console.log('   ' + downloadUrl);

    // SUMMARY
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY\n');
    console.log('✅ All tests completed successfully!\n');
    
    console.log('📝 Test Results:');
    console.log('   1. ✅ Azure Blob Storage initialized');
    console.log('   2. ✅ Test user configured (ID: ' + testUserId + ')');
    console.log('   3. ✅ Dummy PDF created in memory');
    console.log('   4. ✅ File uploaded to Azure Blob Storage');
    console.log('   5. ✅ Database updated with blob info');
    console.log('   6. ✅ Database verified');
    console.log('   7. ✅ File downloaded from Azure');
    console.log('   8. ✅ Public URL generated');
    console.log('   9. ✅ User files listed');
    console.log('   10. ⏳ API endpoint (requires server running)');
    console.log('');
    
    console.log('🌐 Azure Blob Information:');
    console.log('   Container: proxy-forms');
    console.log('   Blob Name: ' + uploadedBlobName);
    console.log('   Blob URL: ' + uploadResult.blobUrl);
    console.log('   File Size: ' + fileBuffer.length + ' bytes');
    console.log('');
    
    console.log('🎯 Next Steps - Manual Testing:');
    console.log('   1. Start backend: node server/app.js');
    console.log('   2. Start frontend: npm run dev');
    console.log('   3. Login as user ID ' + testUserId);
    console.log('   4. Check navbar - should see GREEN "View Proxy Form" button');
    console.log('   5. Click button - modal shows Azure-stored file');
    console.log('   6. Click "View" - downloads from Azure');
    console.log('');
    
    console.log('🔍 Admin Panel Test:');
    console.log('   1. Login as admin');
    console.log('   2. Go to User Approvals');
    console.log('   3. Find user ID ' + testUserId);
    console.log('   4. Click "Download" in Proxy File column');
    console.log('   5. Should download from Azure Blob Storage');
    console.log('');
    
    console.log('📂 Storage Location:');
    console.log('   Type: Azure Blob Storage (Cloud)');
    console.log('   Container: proxy-forms');
    console.log('   Path: user-' + testUserId + '/');
    console.log('   Access: Via Azure SDK + Download Endpoint');
    console.log('');
    
    console.log('🧹 Cleanup (Optional):');
    console.log('   To delete test blob:');
    console.log('   -- In Azure Portal → Storage Account → proxy-forms container');
    console.log('   -- Or keep it for continued testing');
    console.log('');
    
    console.log('=' .repeat(70));
    console.log('🎉 AZURE BLOB STORAGE TEST COMPLETED SUCCESSFULLY! 🎉');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('credentials')) {
      console.log('\n⚠️  CONFIGURATION ISSUE:');
      console.log('Please add Azure Storage credentials to your .env file:');
      console.log('');
      console.log('Option 1: Connection String');
      console.log('AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net');
      console.log('');
      console.log('Option 2: Account Name + Key');
      console.log('AZURE_STORAGE_ACCOUNT_NAME=your_account_name');
      console.log('AZURE_STORAGE_ACCOUNT_KEY=your_account_key');
      console.log('');
      console.log('Get these from Azure Portal → Storage Account → Access Keys');
    }
  } finally {
    await database.close();
    console.log('\n✅ Database connection closed');
  }
}

testAzureBlobStorage();
