# 🔄 MANUAL PROXY UPLOAD IMPLEMENTATION PLAN

## Overview
Implement manual proxy PDF upload option in user registration with admin approval interface and conditional proxy form button display.

## Requirements

### 1. User Registration Enhancement
- Add proxy method selection: "Digital Form" vs "Manual Upload"
- If "Manual Upload" selected → Show PDF file upload field
- If "Digital Form" selected → Show proxy form button in navigation later

### 2. Database Changes
Required fields in `users` table or `pending_users` table:
```sql
ALTER TABLE users ADD COLUMN proxy_method VARCHAR(20) DEFAULT 'digital'; -- 'digital' or 'manual'
ALTER TABLE users ADD COLUMN proxy_file_path NVARCHAR(500) NULL;
ALTER TABLE users ADD COLUMN proxy_file_name NVARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN proxy_uploaded_at DATETIME NULL;
```

### 3. Backend API Endpoints

#### Upload Proxy File
```
POST /api/admin/upload-proxy-file
Content-Type: multipart/form-data
Body: {
  file: PDF file
  user_id: string
}
Response: {
  success: boolean
  filePath: string
  fileName: string
}
```

#### Download Proxy File
```
GET /api/admin/download-proxy-file/:userId
Response: PDF file download
```

### 4. Admin Approvals Interface
Add new column "Proxy File" with:
- Icon indicator if file uploaded
- Download button
- View button (optional)

### 5. Navigation Header Logic
Conditionally show "Complete Proxy" button:
```typescript
if (user.proxy_method === 'digital' && !hasProxyGroups) {
  // Show "Complete Proxy" button
} else if (user.proxy_method === 'manual') {
  // Hide button - they uploaded manually
} else if (hasProxyGroups) {
  // Show "View My Proxy" button
}
```

## File Storage Strategy

### Option A: Local File System (Recommended for MVP)
```
/uploads/
  /proxy-files/
    /user-{userId}/
      proxy-{timestamp}.pdf
```

### Option B: Cloud Storage (Future Enhancement)
- AWS S3
- Azure Blob Storage
- Google Cloud Storage

## Implementation Steps

### Step 1: Update Registration Form (AdminDashboard_2.tsx)
1. Add proxy_method field to registrationData state
2. Add proxy_file field to state
3. Add radio buttons for method selection
4. Add file upload input (conditional)
5. Handle file upload in handleRegistration

### Step 2: Create Backend API
1. Install multer for file uploads: `npm install multer`
2. Create upload middleware
3. Add upload endpoint
4. Add download endpoint
5. Update user creation to store proxy_method and file_path

### Step 3: Update Admin Approvals
1. Fetch proxy_file_path with user data
2. Add "Proxy File" column to table
3. Add download button
4. Style with file icon

### Step 4: Update Navigation Header
1. Fetch user's proxy_method
2. Conditionally render proxy button
3. Update logic for button text/action

## Security Considerations

1. **File Validation**
   - Only allow PDF files
   - Max file size: 5MB
   - Validate MIME type
   - Sanitize file names

2. **Access Control**
   - Only admins can download files
   - Users can only upload their own files
   - Authenticated routes

3. **File Storage**
   - Store outside public directory
   - Use secure file paths
   - No directory traversal

## UI/UX Design

### Registration Form
```
┌─────────────────────────────────────────┐
│ User Registration                       │
│                                         │
│ Name: [____________]                    │
│ Email: [___________]                    │
│                                         │
│ Proxy Method:                           │
│ ○ Digital Form (Complete online)       │
│ ● Manual Upload (PDF document)         │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ 📎 Upload Proxy PDF            │   │
│ │ [Choose File] proxy-form.pdf   │   │
│ └─────────────────────────────────┘   │
│                                         │
│ [Create Account]                        │
└─────────────────────────────────────────┘
```

### Admin Approvals Table
```
| Name    | Email         | Role  | Proxy File      | Actions  |
|---------|---------------|-------|-----------------|----------|
| John D. | john@mail.com | Voter | 📄 Download     | Approve  |
| Jane S. | jane@mail.com | Voter | ✓ Digital Form  | Approve  |
| Bob M.  | bob@mail.com  | Voter | ⚠️ Not Uploaded | Reject   |
```

### Navigation Header
```
Before completing proxy:
[Complete Proxy] button (if digital)
No button (if manual - already uploaded)

After completing proxy:
[View My Proxy] button (for both methods)
```

## Testing Checklist

- [ ] User can select "Manual Upload" option
- [ ] PDF file upload works
- [ ] File is saved to server
- [ ] File path stored in database
- [ ] Admin can see uploaded file
- [ ] Admin can download file
- [ ] Digital form button shows correctly
- [ ] Manual upload hides button
- [ ] File validation works
- [ ] Error handling for upload failures
- [ ] Large files rejected
- [ ] Non-PDF files rejected

## API Response Formats

### Registration with Manual Upload
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "proxy_method": "manual",
    "proxy_file_name": "proxy-form-123.pdf",
    "proxy_file_path": "/uploads/proxy-files/user-123/proxy-1234567890.pdf"
  }
}
```

### Get Users with Proxy Files
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "name": "John Doe",
      "proxy_method": "manual",
      "proxy_file_name": "proxy-form.pdf",
      "proxy_uploaded_at": "2025-12-03T10:30:00Z",
      "hasProxyFile": true
    }
  ]
}
```

## File Structure

```
project/
├── server/
│   ├── routes/
│   │   └── admin.js (add upload/download endpoints)
│   ├── middleware/
│   │   └── upload.js (multer configuration)
│   └── uploads/
│       └── proxy-files/
│           └── user-{id}/
│               └── proxy-{timestamp}.pdf
├── src/
│   ├── pages/
│   │   ├── AdminDashboard_2.tsx (add upload to registration)
│   │   └── AdminApprovals.tsx (add file column)
│   └── components/
│       └── Header.tsx (conditional button logic)
```

## Implementation Priority

1. **High Priority** (MVP)
   - File upload in registration
   - File storage on server
   - Download in admin approvals
   - Conditional button in header

2. **Medium Priority**
   - File preview/view
   - Better file management UI
   - Upload progress indicator

3. **Low Priority** (Future)
   - Cloud storage integration
   - Multiple file support
   - File compression
   - Thumbnail generation

## Notes

- Start with local file system storage
- Use multer for Express file uploads
- Store file metadata in database
- Implement proper error handling
- Add loading states for uploads
- Consider file size limits
- Implement file cleanup for rejected users

Ready to implement! 🚀
