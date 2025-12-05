# Manual Proxy Form Upload Feature

## Overview
This feature allows users who selected "Manual Proxy Form" during registration to upload their completed proxy forms directly through the application. The uploaded files are then visible to administrators in the approval section.

## User Flow

### For Regular Users

1. **Registration Step 4 - Proxy Choice**
   - User selects one of three options:
     - **Manual Proxy Form**: User will fill out a physical form and upload it
     - **Digital Proxy Form**: User will complete the proxy form digitally in the app
     - **Abstain**: User chooses not to participate in proxy voting
   - The choice is saved to the database in the `users.proxy_vote_form` field

2. **Home Page Navigation**
   - Based on the user's proxy_vote_form value from the database, different buttons appear in the navbar:
   
   **Manual Choice:**
   - Button: "Upload Proxy Form" (with Upload icon)
   - Clicking opens a modal dialog for file upload
   
   **Digital Choice:**
   - Button: "Complete Proxy" (with FolderPlus icon)
   - Clicking navigates to the digital proxy form page
   
   **Has Existing Proxy:**
   - Button: "View My Proxy" (with Eye icon)
   - Clicking navigates to view assigned proxy details

3. **Upload Modal (Manual Choice Only)**
   - **File Selection**: Users can select PDF, DOC, DOCX, or image files
   - **Preview**: Selected filename is displayed
   - **Actions**:
     - Cancel: Closes modal without uploading
     - Upload: Submits the file to the server
   - **Loading State**: Shows spinner and "Uploading..." text during upload
   - **Success**: Displays success message and refreshes the page

### For Administrators

1. **Admin Approvals Page**
   - New column: "Proxy File"
   - For users with uploaded files:
     - Shows "Download" link with FileText icon
     - Clicking opens the file in a new tab
   - For users without files:
     - Shows "No file" in gray text

## Technical Implementation

### Frontend Components

#### Header.tsx Changes
```typescript
// New state variables
const [proxyChoice, setProxyChoice] = useState<string | null>(null);
const [showUploadModal, setShowUploadModal] = useState(false);
const [uploadFile, setUploadFile] = useState<File | null>(null);
const [uploadLoading, setUploadLoading] = useState(false);

// Check proxy choice on mount - from user object (database)
useEffect(() => {
  const choice = user.proxy_vote_form;
  setProxyChoice(choice || null);
}, [user?.id, user?.proxy_vote_form]);

// File upload handler
const handleFileUpload = async () => {
  const formData = new FormData();
  formData.append('proxyForm', uploadFile);
  formData.append('userId', user.id);
  
  await fetch('http://localhost:3001/api/proxy/upload-manual-form', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
};

// Conditional button rendering
const renderProxyButton = () => {
  if (hasProxyGroups) return <ViewMyProxyButton />;
  if (proxyChoice === 'manual') return <UploadProxyFormButton />;
  if (proxyChoice === 'digital') return <CompleteProxyButton />;
  return <CompleteProxyButton />; // Default
};
```

#### AdminApprovals.tsx Changes
```typescript
// New table column header
<th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
  Proxy File
</th>

// New table cell
<td className="px-4 py-3">
  {(reg as any).proxy_file_name ? (
    <a href={`http://localhost:3001/uploads/proxy-files/${reg.proxy_file_name}`}
       target="_blank"
       rel="noopener noreferrer"
       className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1">
      <FileText className="h-4 w-4" />
      <span>Download</span>
    </a>
  ) : (
    <span className="text-gray-400 text-sm">No file</span>
  )}
</td>
```

### Backend Implementation

#### API Endpoint
**POST** `/api/proxy/upload-manual-form`

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `proxyForm`: File (PDF, DOC, DOCX, images)
  - `userId`: String (user ID)

**Response:**
```json
{
  "success": true,
  "message": "Proxy form uploaded successfully",
  "data": {
    "fileName": "proxy-1234567890.pdf",
    "filePath": "/path/to/file",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "No file uploaded"
}
```

#### File Storage
- **Location**: `server/uploads/proxy-files/user-{userId}/`
- **Naming**: `proxy-{timestamp}.{extension}`
- **Size Limit**: 5MB
- **Allowed Types**: PDF files only (configured in middleware)

#### Middleware Configuration
File: `server/middleware/upload.js`
```javascript
export const uploadProxyFile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const userId = req.body.userId || req.body.user_id || 'temp';
      const userDir = path.join(uploadsDir, `user-${userId}`);
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      cb(null, userDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now();
      const filename = `proxy-${uniqueSuffix}${path.extname(file.originalname)}`;
      cb(null, filename);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf'];
    const allowedExts = ['.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = allowedMimes.includes(file.mimetype);
    const extOk = allowedExts.includes(ext);
    cb(mimeOk && extOk ? null : new Error('Only PDF files are allowed!'), mimeOk && extOk);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('proxyForm');
```

### Database Schema

#### Users Table Updates
```sql
-- The proxy_vote_form field should already exist in the users table
-- Values: 'manual', 'digital', or 'abstain'
-- This field is set during user registration (Step 4)
```

**Fields:**
- `proxy_vote_form`: VARCHAR - Stores user's proxy choice ('manual', 'digital', or 'abstain')
- `proxy_file_path`: VARCHAR(500) - Full path to the uploaded file
- `proxy_file_name`: VARCHAR(255) - Original filename for display
- `proxy_uploaded_at`: DATETIME - Timestamp of upload

#### User.js Model Updates
```javascript
static async getAll() {
  const sql = `
    SELECT u.id, u.email, u.name, u.avatar_url, u.is_active,
           u.email_verified, u.last_login, u.created_at,
           u.proxy_file_path, u.proxy_file_name, u.proxy_uploaded_at,
           u.proxy_vote_form,
           r.name as role_name, is_active, good_standing
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at DESC
  `;
  const results = await database.query(sql);
  return results;
}
```

## Security Considerations

1. **File Validation**
   - Only PDF files are accepted (configurable)
   - Maximum file size: 5MB
   - Files stored in user-specific directories

2. **Access Control**
   - Upload requires JWT authentication
   - Users can only upload for their own account
   - Only admins can view uploaded files

3. **File Storage**
   - Files stored outside web root
   - Served through Express with authentication
   - User-specific directories prevent file conflicts

## Testing Checklist

### User Testing
- [ ] Register new user and select "Manual Proxy Form"
- [ ] Verify "Upload Proxy Form" button appears in navbar
- [ ] Click button and verify modal opens
- [ ] Select a PDF file and upload
- [ ] Verify success message appears
- [ ] Verify page refreshes after upload

### Admin Testing
- [ ] Navigate to Admin Approvals page
- [ ] Verify "Proxy File" column is visible
- [ ] For users with uploaded files, verify "Download" link appears
- [ ] Click download link and verify file opens in new tab
- [ ] For users without files, verify "No file" text appears

### Edge Cases
- [ ] Upload non-PDF file (should be rejected)
- [ ] Upload file larger than 5MB (should be rejected)
- [ ] Upload without selecting file (should show alert)
- [ ] Upload same file twice (should replace previous)
- [ ] View file after user deletion (should handle gracefully)

## Future Enhancements

1. **Multiple File Support**
   - Allow users to upload multiple proxy forms
   - Show list of uploaded files with dates

2. **File Preview**
   - PDF preview in modal before upload
   - Thumbnail preview in admin table

3. **File Validation**
   - OCR to verify proxy form content
   - Automatic extraction of form fields

4. **Status Tracking**
   - "Pending Review" status after upload
   - "Approved" or "Rejected" status from admin
   - Email notification on status change

5. **Version Control**
   - Keep history of uploaded files
   - Allow users to see previous versions
   - Admin can compare versions

## Troubleshooting

### Upload Button Not Appearing
- Check if proxy_vote_form is set in the database for the user
- Verify user completed registration Step 4
- Check browser console for errors
- Run this SQL to check: `SELECT id, email, proxy_vote_form FROM users WHERE email = 'user@example.com'`

### File Upload Fails
- Verify backend server is running on port 3001
- Check if `uploads/proxy-files` directory exists and has write permissions
- Verify file meets size and type requirements
- Check network tab for API response errors

### Download Link Not Working
- Verify file exists on server: `server/uploads/proxy-files/user-{userId}/`
- Check if user has `proxy_file_name` in database
- Verify Express is configured to serve static files from uploads directory

### Modal Not Closing After Upload
- Check browser console for JavaScript errors
- Verify `setShowUploadModal(false)` is being called
- Try refreshing the page manually

## API Reference

### Upload Manual Proxy Form
```bash
curl -X POST http://localhost:3001/api/proxy/upload-manual-form \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "proxyForm=@/path/to/form.pdf" \
  -F "userId=123"
```

### Get User with Proxy File
```bash
curl -X GET http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response includes:
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "proxy_file_path": "server/uploads/proxy-files/user-123/proxy-1234567890.pdf",
      "proxy_file_name": "proxy-1234567890.pdf",
      "proxy_uploaded_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## File Structure
```
project-root/
├── src/
│   ├── components/
│   │   └── Header.tsx           # Upload button and modal
│   └── pages/
│       └── AdminApprovals.tsx   # File column display
├── server/
│   ├── routes/
│   │   ├── proxy.js            # Upload endpoint
│   │   └── admin.js            # User listing with files
│   ├── models/
│   │   └── User.js             # Database queries
│   ├── middleware/
│   │   └── upload.js           # Multer configuration
│   └── uploads/
│       └── proxy-files/        # File storage
│           └── user-{userId}/
└── MANUAL_PROXY_UPLOAD_FEATURE.md  # This file
```

## Related Files
- `src/components/Header.tsx` - UI for upload button and modal
- `src/pages/AdminApprovals.tsx` - Admin view of uploaded files
- `src/pages/EmployeeLoginRegister.tsx` - Proxy choice selection
- `server/routes/proxy.js` - Upload API endpoint
- `server/routes/admin.js` - User listing API
- `server/middleware/upload.js` - File upload middleware
- `server/models/User.js` - Database operations

## Support
For issues or questions, please refer to:
- Technical Documentation: `docs/TECHNICAL_DOCUMENTATION.md`
- User Guide: `docs/USER_GUIDE.md`
- API Reference: `docs/API_REFERENCE.md`
