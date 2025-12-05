# WeVote Platform - Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Authentication & Authorization](#authentication--authorization)
7. [Proxy Voting System](#proxy-voting-system)
8. [Audit Logging](#audit-logging)
9. [Security Features](#security-features)
10. [Development Setup](#development-setup)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## System Overview

**WeVote** is a comprehensive digital voting platform designed for Annual General Meetings (AGMs) that supports:
- Electronic voting for trustee elections and resolutions
- Complex proxy delegation system (Discretional, Instructional, and Mixed)
- Real-time vote tracking and audit trails
- Multi-role user management (Members, Admins, Super Admins)
- Secure authentication with password recovery
- WhatsApp integration for notifications
- Comprehensive audit logging for compliance

### Key Features
- **Secure Voting**: JWT-based authentication with role-based access control
- **Proxy Management**: Three types of proxy delegation with vote allocation
- **Real-time Status**: Live voting status bar showing available votes
- **Audit Trail**: Complete logging of all system actions
- **Admin Controls**: Comprehensive dashboard for user and vote management
- **Responsive Design**: Mobile-first UI using TailwindCSS and Framer Motion

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React +      │
│   TypeScript)   │
└────────┬────────┘
         │ HTTPS/REST
         │
┌────────▼────────┐
│   Backend       │
│   (Node.js +    │
│   Express)      │
└────────┬────────┘
         │
         ├──────────┬──────────┬──────────┐
         │          │          │          │
┌────────▼────┐ ┌──▼──────┐ ┌─▼────────┐ ┌▼──────────┐
│  MSSQL DB   │ │ Email   │ │WhatsApp  │ │  File     │
│  (Azure)    │ │Service  │ │API       │ │  Storage  │
└─────────────┘ └─────────┘ └──────────┘ └───────────┘
```

### Frontend Architecture

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx
│   ├── VotingStatusBar.tsx
│   ├── VotingCard.tsx
│   ├── ChatWindow.tsx
│   └── ...
├── pages/              # Page-level components
│   ├── Login.tsx
│   ├── Home.tsx
│   ├── EmployeeVoting.tsx
│   ├── ProxyAppointmentForm.tsx
│   ├── AdminDashboard.tsx
│   └── ...
├── contexts/           # React Context providers
│   └── AuthContext.tsx
├── App.tsx            # Main application component
└── main.tsx          # Application entry point
```

### Backend Architecture

```
server/
├── routes/            # API route handlers
│   ├── auth.js
│   ├── employees.js
│   ├── resolutions.js
│   ├── admin.js
│   ├── proxy.js
│   ├── voting-status.js
│   └── audit-logs.js
├── models/           # Database models
│   ├── User.js
│   ├── Employee.js
│   ├── Vote.js
│   ├── Proxy.js
│   └── AuditLog.js
├── middleware/       # Custom middleware
│   └── auth.js
├── services/         # Business logic services
│   └── emailService.js
├── config/          # Configuration files
│   └── database.js
├── utils/           # Utility functions
│   ├── logger.js
│   └── roleMapper.js
└── app.js          # Express application setup
```

---

## Technology Stack

### Frontend
- **React 18.3.1**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **React Router DOM 7.7.1**: Client-side routing
- **Framer Motion 12.23**: Animations
- **Lucide React**: Icon library
- **TailwindCSS**: Utility-first CSS framework
- **Axios**: HTTP client

### Backend
- **Node.js**: Runtime environment
- **Express 5.1.0**: Web framework
- **MSSQL 11.0.1**: Database driver
- **JWT (jsonwebtoken 9.0.2)**: Authentication tokens
- **bcryptjs 3.0.2**: Password hashing
- **Helmet 8.1.0**: Security headers
- **Morgan 1.10.1**: HTTP request logger
- **Express Rate Limit 8.0.1**: DDoS protection
- **Nodemailer 7.0.6**: Email service
- **Multer 2.0.2**: File upload handling

### Database
- **Microsoft SQL Server**: Primary database
- **Azure SQL Database**: Cloud hosting (production)

### DevOps & Tools
- **ESLint**: Code linting
- **Nodemon**: Development auto-reload
- **dotenv**: Environment variable management

---

## Database Schema

### Core Tables

#### 1. **users** Table
Stores all user accounts with authentication and profile information.

```sql
CREATE TABLE users (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    surname NVARCHAR(255),
    email NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    member_number NVARCHAR(50) UNIQUE,
    id_number NVARCHAR(50),
    role_id INT DEFAULT 1,
    is_approved BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    must_change_password BIT DEFAULT 1,
    reset_token NVARCHAR(255),
    reset_token_expiry DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
```

**Key Columns:**
- `role_id`: 1=Member, 2=Admin, 3=Super Admin
- `is_approved`: Account approval status
- `must_change_password`: Force password change on first login
- `reset_token`: Password recovery token

#### 2. **employees** Table
Trustee candidates for election.

```sql
CREATE TABLE employees (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    position NVARCHAR(255),
    department NVARCHAR(255),
    bio TEXT,
    image_url NVARCHAR(500),
    vote_count INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);
```

#### 3. **votes** Table
Records of all cast votes.

```sql
CREATE TABLE votes (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    employee_id INT,
    resolution_id INT,
    vote_value NVARCHAR(10) NOT NULL, -- 'VOTE' or 'ABSTAIN'
    is_proxy BIT DEFAULT 0,
    proxy_for_user_id INT,
    proxy_group_id INT,
    voted_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (resolution_id) REFERENCES resolutions(id)
);
```

**Voting Rules:**
- `vote_value`: 'VOTE' = positive vote, 'ABSTAIN' = abstention
- `is_proxy`: Indicates if vote cast by proxy
- `proxy_for_user_id`: Original voter when using proxy

#### 4. **proxy_groups** Table
Groups of proxy delegations from one principal member.

```sql
CREATE TABLE proxy_groups (
    id INT PRIMARY KEY IDENTITY(1,1),
    group_name NVARCHAR(255),
    principal_member_id INT NOT NULL,
    principal_member_name NVARCHAR(255),
    principal_id_number NVARCHAR(50),
    total_votes_delegated INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (principal_member_id) REFERENCES users(id)
);
```

#### 5. **proxy_group_members** Table
Individual proxy holders within a group.

```sql
CREATE TABLE proxy_group_members (
    id INT PRIMARY KEY IDENTITY(1,1),
    proxy_group_id INT NOT NULL,
    user_id INT,
    full_name NVARCHAR(255) NOT NULL,
    membership_number NVARCHAR(50),
    appointment_type NVARCHAR(20) NOT NULL, -- 'DISCRETIONAL', 'INSTRUCTIONAL', 'MIXED'
    votes_allocated INT DEFAULT 0,
    discretional_votes INT DEFAULT 0,
    instructional_votes INT DEFAULT 0,
    allowed_candidates NVARCHAR(MAX), -- JSON array of employee IDs
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (proxy_group_id) REFERENCES proxy_groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Appointment Types:**
- **DISCRETIONAL**: Proxy can vote for anyone
- **INSTRUCTIONAL**: Proxy must vote for specified candidates only
- **MIXED**: Split between discretional and instructional votes

#### 6. **audit_logs** Table
Comprehensive audit trail for compliance.

```sql
CREATE TABLE audit_logs (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT,
    action NVARCHAR(100) NOT NULL,
    entity_type NVARCHAR(50),
    entity_id INT,
    details NVARCHAR(MAX),
    ip_address NVARCHAR(50),
    user_agent NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Logged Actions:**
- User login/logout
- Vote casting
- Proxy delegation creation
- Admin actions (approval, deletion)
- Password changes
- Configuration updates

#### 7. **resolutions** Table
AGM resolutions and motions.

```sql
CREATE TABLE resolutions (
    id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL,
    description TEXT,
    category NVARCHAR(50), -- 'trustee_remuneration', 'auditors', 'motions'
    yes_votes INT DEFAULT 0,
    no_votes INT DEFAULT 0,
    abstain_votes INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);
```

---

## API Documentation

### Base URL
- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-domain.com/api`

### Authentication Endpoints

#### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "surname": "Doe",
  "email": "john.doe@example.com",
  "password": "SecureP@ss123",
  "memberNumber": "MEM001",
  "idNumber": "1234567890123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Awaiting admin approval.",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "isApproved": false
  }
}
```

#### POST `/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecureP@ss123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "member",
    "mustChangePassword": true
  }
}
```

#### POST `/auth/verify`
Verify JWT token validity.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "member"
  }
}
```

#### POST `/auth/change-password`
Change user password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldP@ss123",
  "newPassword": "NewP@ss456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### POST `/auth/forgot-password`
Request password reset token.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset instructions sent to your email"
}
```

#### POST `/auth/reset-password`
Reset password using token.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewP@ss789"
}
```

### Voting Endpoints

#### GET `/employees`
Get list of all active trustee candidates.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Jane Smith",
      "position": "Trustee Candidate",
      "department": "Finance",
      "bio": "Experienced finance professional...",
      "vote_count": 45,
      "image_url": "/uploads/jane-smith.jpg"
    }
  ]
}
```

#### POST `/employees/vote`
Cast a vote for a trustee candidate.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "employeeId": 1,
  "voteValue": "VOTE",
  "isProxy": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "voteId": 123
}
```

#### GET `/resolutions`
Get all active resolutions.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "2025 Trustee Remuneration",
      "description": "Approve trustee remuneration for 2025",
      "category": "trustee_remuneration",
      "yes_votes": 120,
      "no_votes": 30,
      "abstain_votes": 10
    }
  ]
}
```

#### POST `/resolutions/vote`
Vote on a resolution.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "resolutionId": 1,
  "voteValue": "VOTE"
}
```

### Proxy Management Endpoints

#### POST `/proxy/proxy-form`
Submit a new proxy appointment form.

**Request Body:**
```json
{
  "member_title": "Mr",
  "member_initials": "J.D.",
  "member_surname": "Doe",
  "member_full_name": "John Doe",
  "member_membership_number": "MEM001",
  "member_id_number": "1234567890123",
  "location_signed": "Cape Town",
  "signed_date": "2025-06-15",
  "trustee_remuneration": "yes",
  "remuneration_policy": "yes",
  "auditors_appointment": "yes",
  "agm_motions": "yes",
  "proxy_groups": {
    "group_name": "Mr J.D. Doe",
    "principal_member_name": "Mr J.D. Doe",
    "principal_member_id": "MEM001"
  },
  "proxy_group_members": [
    {
      "full_name": "Alice Proxy",
      "membership_number": "MEM002",
      "appointment_type": "INSTRUCTIONAL",
      "votes_allocated": 10,
      "discretional_votes": 0,
      "instructional_votes": 10,
      "allowed_candidates": ["1", "3", "5"]
    }
  ],
  "total_available_votes": 10,
  "total_allocated_votes": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Proxy form submitted successfully",
  "proxyGroupId": 5
}
```

#### GET `/voting-status/status/:userId`
Get comprehensive voting status for a user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "personalVotesRemaining": 5,
    "personalVotesTotal": 10,
    "proxyVotesRemaining": 15,
    "proxyVotesTotal": 20,
    "totalVotesRemaining": 20,
    "totalVotesUsed": 10,
    "voteHistory": [
      {
        "id": "1",
        "type": "employee",
        "targetId": "5",
        "targetName": "Jane Smith",
        "voteValue": "VOTE",
        "votedAt": "2025-06-20T10:30:00Z",
        "isProxy": false,
        "weight": 1
      }
    ],
    "proxyDelegations": [
      {
        "id": "1",
        "delegatorName": "Bob Member",
        "voteType": "employee",
        "remainingVotes": 5,
        "totalVotes": 10
      }
    ]
  }
}
```

### Admin Endpoints

#### GET `/admin/users`
Get all users (Admin/Super Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "member",
      "isApproved": true,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### PUT `/admin/approve-user/:userId`
Approve pending user registration.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User approved successfully"
}
```

#### DELETE `/admin/users/:userId`
Delete a user account.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### POST `/admin/employees`
Create a new trustee candidate.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
name: Jane Smith
position: Trustee Candidate
department: Finance
bio: Experienced professional...
image: [File]
```

### Audit Log Endpoints

#### GET `/audit-logs`
Retrieve audit logs with filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate`: Filter from date (ISO 8601)
- `endDate`: Filter to date (ISO 8601)
- `action`: Filter by action type
- `userId`: Filter by user ID
- `limit`: Number of records (default: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "userId": 5,
        "userName": "John Doe",
        "action": "USER_LOGIN",
        "entityType": "user",
        "entityId": 5,
        "details": "Login from IP 192.168.1.1",
        "ipAddress": "192.168.1.1",
        "createdAt": "2025-06-20T10:00:00Z"
      }
    ],
    "total": 150,
    "limit": 100,
    "offset": 0
  }
}
```

---

## Authentication & Authorization

### JWT Token Structure

```javascript
{
  "userId": 1,
  "email": "john.doe@example.com",
  "role": "member",
  "iat": 1703001234,
  "exp": 1703087634
}
```

**Token Expiry**: 24 hours

### Role-Based Access Control (RBAC)

#### Roles
1. **Member (role_id = 1)**
   - View and vote for employees
   - Vote on resolutions
   - Create proxy delegations
   - View own voting history

2. **Admin (role_id = 2)**
   - All Member permissions
   - Approve/reject user registrations
   - Manage employees (create, edit, delete)
   - View all users
   - Access admin dashboard
   - View audit logs

3. **Super Admin (role_id = 3)**
   - All Admin permissions
   - Manage admin accounts
   - System configuration
   - Full audit log access
   - User role management

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Security Headers (Helmet.js)
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- X-XSS-Protection

---

## Proxy Voting System

### Proxy Types

#### 1. Discretional Proxy
- Proxy holder can vote for ANY candidate
- All available votes automatically allocated
- No restrictions on candidate selection
- Best for: Full trust delegation

**Use Case:**
```
Member has 10 votes → Appoints Alice as Discretional proxy
→ Alice receives all 10 votes
→ Alice can vote for any trustee candidates
```

#### 2. Instructional Proxy
- Proxy holder MUST vote for specified candidates only
- All available votes automatically allocated
- Restricted to pre-selected candidates
- Best for: Controlled voting with specific preferences

**Use Case:**
```
Member has 10 votes → Appoints Bob as Instructional proxy
→ Bob receives all 10 votes
→ Member specifies candidates: Jane, Mike, Sarah
→ Bob can ONLY vote for these 3 candidates
```

#### 3. Mixed Proxy
- Combination of Discretional and Instructional
- Member manually splits votes
- Flexible vote allocation
- Best for: Partial control with flexibility

**Use Case:**
```
Member has 10 votes → Appoints Carol as Mixed proxy
→ Member allocates: 6 discretional + 4 instructional
→ Carol can vote for anyone with 6 votes
→ Carol must vote for specified candidates with 4 votes
```

### Proxy Workflow

```
1. Member logs in
2. Navigates to Proxy Appointment Form
3. System auto-loads available votes from VotingStatusBar
4. Member enters Principal details (proxy giver)
5. Member adds Proxy Member(s) (proxy holder)
6. For each proxy member:
   a. Select appointment type
   b. If Mixed: Allocate vote split
   c. If Instructional/Mixed: Select allowed candidates
7. System validates:
   - All votes allocated
   - Vote splits match totals
   - Candidate selections within limits
8. Member signs and submits
9. Proxy delegation created in database
10. Proxy holder can now vote on behalf of member
```

### Vote Allocation Logic

```javascript
// Discretional - Auto-allocate all votes
if (appointmentType === 'discretional') {
  votesAllocated = totalAvailableVotes;
  discretionalVotes = totalAvailableVotes;
  instructionalVotes = 0;
}

// Instructional - Auto-allocate all votes
if (appointmentType === 'instructional') {
  votesAllocated = totalAvailableVotes;
  discretionalVotes = 0;
  instructionalVotes = totalAvailableVotes;
}

// Mixed - Manual allocation
if (appointmentType === 'mixed') {
  votesAllocated = userInput; // Manual entry
  discretionalVotes = userInput1;
  instructionalVotes = userInput2;
  
  // Validation
  if (discretionalVotes + instructionalVotes !== votesAllocated) {
    throw new Error("Vote split must equal total");
  }
}
```

---

## Audit Logging

### Logged Events

#### Authentication Events
- `USER_LOGIN`: User successful login
- `USER_LOGOUT`: User logout
- `USER_REGISTER`: New user registration
- `PASSWORD_CHANGE`: Password update
- `PASSWORD_RESET_REQUEST`: Password reset initiated
- `PASSWORD_RESET_COMPLETE`: Password reset completed

#### Voting Events
- `VOTE_CAST`: Vote recorded for employee or resolution
- `VOTE_UPDATED`: Vote changed
- `PROXY_VOTE_CAST`: Vote cast using proxy

#### Proxy Events
- `PROXY_CREATED`: New proxy delegation
- `PROXY_UPDATED`: Proxy delegation modified
- `PROXY_DELETED`: Proxy delegation removed

#### Admin Events
- `USER_APPROVED`: User registration approved
- `USER_REJECTED`: User registration rejected
- `USER_DELETED`: User account deleted
- `EMPLOYEE_CREATED`: New trustee candidate added
- `EMPLOYEE_UPDATED`: Trustee info updated
- `EMPLOYEE_DELETED`: Trustee removed

### Audit Log Data Structure

```javascript
{
  userId: 5,
  action: 'VOTE_CAST',
  entityType: 'employee',
  entityId: 3,
  details: JSON.stringify({
    employeeName: 'Jane Smith',
    voteValue: 'VOTE',
    isProxy: false,
    timestamp: new Date().toISOString()
  }),
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
}
```

### Querying Audit Logs

```sql
-- Get all votes by a user
SELECT * FROM audit_logs
WHERE user_id = 5 AND action = 'VOTE_CAST'
ORDER BY created_at DESC;

-- Get all admin actions
SELECT * FROM audit_logs
WHERE action IN ('USER_APPROVED', 'USER_DELETED', 'EMPLOYEE_CREATED')
ORDER BY created_at DESC;

-- Get activity for date range
SELECT * FROM audit_logs
WHERE created_at BETWEEN '2025-06-01' AND '2025-06-30'
ORDER BY created_at DESC;
```

---

## Security Features

### 1. Password Security
- **Hashing**: bcrypt with salt rounds (10)
- **Storage**: Never store plain text passwords
- **Validation**: Enforce strong password policy
- **Reset**: Secure token-based reset mechanism

### 2. Rate Limiting
- **Global limit**: 100 requests per 15 minutes per IP
- **Login attempts**: 5 failed attempts before lockout
- **Protection**: DDoS and brute force attacks

### 3. Input Validation
- **Express Validator**: Sanitize all inputs
- **SQL Injection**: Parameterized queries only
- **XSS Protection**: HTML encoding on output
- **CSRF**: Token validation for state-changing operations

### 4. Session Management
- **JWT**: Stateless authentication
- **Token expiry**: 24-hour automatic expiration
- **Refresh**: Require re-authentication
- **Logout**: Client-side token deletion

### 5. HTTPS/TLS
- **Encryption**: All data in transit encrypted
- **Certificates**: Valid SSL/TLS certificates required
- **HSTS**: Strict-Transport-Security header enforced

### 6. Database Security
- **Connection**: Azure SQL with encryption
- **Credentials**: Environment variables only
- **Access**: Least privilege principle
- **Backups**: Automated daily backups

---

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- SQL Server (local) or Azure SQL Database
- Git
- Code editor (VS Code recommended)

### Environment Variables

Create `.env` file in the root directory:

```env
# Database
DB_SERVER=your-server.database.windows.net
DB_DATABASE=WeVoteDB
DB_USER=admin_user
DB_PASSWORD=SecurePassword123!
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@wevote.com

# WhatsApp (optional)
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_PHONE_NUMBER=your-phone-number
```

### Installation Steps

```bash
# 1. Clone repository
git clone <repository-url>
cd project_WeVote_1

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Initialize database
# Run SQL scripts in server/database/ folder

# 5. Start backend server
npm run server:dev

# 6. Start frontend (new terminal)
npm run dev

# 7. Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Database Initialization

```sql
-- Create database
CREATE DATABASE WeVoteDB;
GO

USE WeVoteDB;
GO

-- Run all table creation scripts
-- See Database Schema section for table definitions

-- Create initial Super Admin
INSERT INTO users (name, email, password, role_id, is_approved, is_active, must_change_password)
VALUES ('Super Admin', 'admin@wevote.com', '$2a$10$hashedpassword', 3, 1, 1, 0);
```

---

## Deployment

### Production Checklist

#### Backend
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for production domain
- [ ] Set up database connection pooling
- [ ] Enable compression
- [ ] Configure logging (Winston/Bunyan)
- [ ] Set up error tracking (Sentry)
- [ ] Configure automated backups
- [ ] Set up monitoring (New Relic/DataDog)

#### Frontend
- [ ] Build optimized bundle: `npm run build`
- [ ] Enable production API URL
- [ ] Configure CDN for static assets
- [ ] Enable gzip/brotli compression
- [ ] Set up analytics (Google Analytics)
- [ ] Configure error boundaries
- [ ] Optimize images and assets
- [ ] Enable service worker (PWA)

#### Security
- [ ] Update all dependencies
- [ ] Run security audit: `npm audit`
- [ ] Enable rate limiting
- [ ] Configure WAF (Web Application Firewall)
- [ ] Set up DDoS protection
- [ ] Enable security headers
- [ ] Configure CSP (Content Security Policy)
- [ ] Set up SSL/TLS certificates
- [ ] Enable HSTS

### Deployment Platforms

#### Azure (Recommended)
```bash
# Azure App Service deployment
az webapp up --name wevote-app --resource-group wevote-rg --runtime "NODE:18-lts"

# Database: Azure SQL Database
# File Storage: Azure Blob Storage
# Email: SendGrid
```

#### Vercel (Frontend)
```bash
# Build command
npm run build

# Output directory
dist

# Environment variables: Set in Vercel dashboard
```

#### Heroku
```bash
# Install Heroku CLI
heroku login

# Create app
heroku create wevote-app

# Deploy
git push heroku main

# Set environment variables
heroku config:set JWT_SECRET=your-secret
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error:**
```
ConnectionError: Failed to connect to database
```

**Solution:**
```javascript
// Check .env file
DB_SERVER=correct-server.database.windows.net
DB_DATABASE=correct-database-name
DB_USER=correct-username
DB_PASSWORD=correct-password

// Test connection
node server/test-connection.js
```

#### 2. JWT Token Invalid

**Error:**
```
JsonWebTokenError: invalid token
```

**Solution:**
- Clear browser localStorage
- Check JWT_SECRET matches between requests
- Verify token hasn't expired
- Check Authorization header format: `Bearer <token>`

#### 3. Vote Not Recording

**Error:**
```
Error: User has already voted for this candidate
```

**Solution:**
```sql
-- Check existing votes
SELECT * FROM votes WHERE user_id = ? AND employee_id = ?;

-- Clear test votes (development only)
DELETE FROM votes WHERE user_id = ?;
```

#### 4. Proxy Form Validation Error

**Error:**
```
Validation Error: Vote allocation mismatch
```

**Solution:**
- Check that `discretionalVotes + instructionalVotes = votesAllocated`
- Verify `totalAllocatedVotes <= totalAvailableVotes`
- Ensure candidate selection count ≤ instructional votes

#### 5. Email Not Sending

**Error:**
```
Email service error: Authentication failed
```

**Solution:**
```env
# For Gmail, enable 2FA and use App Password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
```

### Debug Mode

Enable detailed logging:

```javascript
// server/app.js
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}
```

### Performance Optimization

```javascript
// Enable compression
import compression from 'compression';
app.use(compression());

// Database query optimization
// Add indexes
CREATE INDEX idx_votes_user ON votes(user_id);
CREATE INDEX idx_votes_employee ON votes(employee_id);
CREATE INDEX idx_audit_user_action ON audit_logs(user_id, action);

// Connection pooling
const pool = {
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000
};
```

---

## API Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 5 requests | 15 minutes |
| `/api/auth/register` | 3 requests | 1 hour |
| `/api/*` (global) | 100 requests | 15 minutes |
| `/api/admin/*` | 50 requests | 15 minutes |

---

## Support & Maintenance

### Logging Locations
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Audit logs: Database `audit_logs` table

### Backup Strategy
- **Database**: Daily automated backups (Azure SQL)
- **Files**: Azure Blob Storage with versioning
- **Retention**: 30 days for production data

### Monitoring Metrics
- Response time (target: <200ms)
- Error rate (target: <1%)
- Uptime (target: 99.9%)
- Database connections
- Memory usage
- CPU utilization

---

**Version**: 1.0.0  
**Last Updated**: December 4, 2025  
**Maintained By**: WeVote Development Team
