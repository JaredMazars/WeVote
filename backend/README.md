# WeVote Backend API

Professional Express.js backend for the WeVote voting platform with Azure SQL Database integration.

## 🚀 Features

- **Secure Authentication** - JWT-based auth with bcrypt password hashing
- **Role-Based Access Control** - Super Admin, Admin, Auditor, Employee, User roles
- **AGM Session Management** - Create, start, end multiple voting sessions
- **Vote Allocations** - Per-session, per-user custom vote allocation
- **Proxy Voting** - Discretionary and instructional proxy support
- **Comprehensive Audit Trail** - All actions logged with user, timestamp, IP
- **Rate Limiting** - Protection against brute force attacks
- **Input Validation** - Express-validator for all endpoints
- **Error Handling** - Centralized error handling with proper HTTP status codes
- **Database Connection Pooling** - Optimized Azure SQL connections
- **Logging** - Winston logger for production-grade logging

## 📋 Prerequisites

- Node.js >= 18.0.0
- Azure SQL Database
- npm or yarn

## 🛠️ Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your Azure SQL credentials:
```env
DB_SERVER=your-server.database.windows.net
DB_DATABASE=WeVoteDB
DB_USER=your-username
DB_PASSWORD=your-password
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

3. **Run database migrations:**
```bash
# Execute the schema.sql file in your Azure SQL Database
# Use Azure Data Studio or SQL Server Management Studio
```

4. **Start the server:**
```bash
# Development
npm run dev

# Production
npm start
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "superadmin@wevote.com",
  "password": "super123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "email": "superadmin@wevote.com",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "super_admin",
    "organizationId": 1
  }
}
```

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### AGM Session Endpoints

#### Get All Sessions
```http
GET /api/sessions?status=active&sessionType=Annual
Authorization: Bearer {token}
```

#### Get Session by ID
```http
GET /api/sessions/:id
Authorization: Bearer {token}
```

#### Create Session (Super Admin only)
```http
POST /api/sessions
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Annual General Meeting 2025",
  "description": "Company-wide AGM for fiscal year 2025",
  "sessionType": "Annual",
  "scheduledStartTime": "2025-03-15T10:00:00Z",
  "scheduledEndTime": "2025-03-15T16:00:00Z",
  "quorumRequired": 50,
  "totalVoters": 150
}
```

#### Start Session
```http
POST /api/sessions/:id/start
Authorization: Bearer {token}
```

#### End Session
```http
POST /api/sessions/:id/end
Authorization: Bearer {token}
```

#### Get Session Statistics
```http
GET /api/sessions/:id/statistics
Authorization: Bearer {token}
```

### Voting Endpoints

#### Cast Vote for Candidate
```http
POST /api/votes/candidate
Authorization: Bearer {token}
Content-Type: application/json

{
  "sessionId": 1,
  "candidateId": 5,
  "votesToAllocate": 3
}
```

#### Cast Vote for Resolution
```http
POST /api/votes/resolution
Authorization: Bearer {token}
Content-Type: application/json

{
  "sessionId": 1,
  "resolutionId": 2,
  "voteChoice": "yes",
  "votesToAllocate": 1
}
```

#### Get User's Vote Allocation
```http
GET /api/votes/allocation/:sessionId
Authorization: Bearer {token}
```

#### Get Candidate Results
```http
GET /api/votes/results/candidates/:sessionId
Authorization: Bearer {token}
```

#### Get Resolution Results
```http
GET /api/votes/results/resolutions/:sessionId
Authorization: Bearer {token}
```

#### Get Voting History
```http
GET /api/votes/history?sessionId=1
Authorization: Bearer {token}
```

### User Endpoints

#### Get All Users (Admin/Super Admin)
```http
GET /api/users?role=admin&isActive=true
Authorization: Bearer {token}
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer {token}
```

#### Update User Profile
```http
PUT /api/users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

## 🗄️ Database Schema

The database schema includes:
- **40 tables** covering all functionality
- **4 views** for reporting
- **2 stored procedures** for vote casting with validation
- **3 triggers** for automatic timestamp updates
- **Comprehensive indexes** for query optimization

Key tables:
- Organizations, Users, Employees
- AGMSessions, SessionAdmins
- Candidates, Resolutions
- SessionVoteLimits, VoteAllocations
- ProxyAssignments, ProxyInstructions
- CandidateVotes, ResolutionVotes
- AuditLog, SecurityEvents
- Notifications, WhatsAppMessages

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt with configurable rounds
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Helmet.js** - Security headers
- **CORS** - Configurable cross-origin resource sharing
- **Input Validation** - Express-validator on all inputs
- **SQL Injection Protection** - Parameterized queries
- **Role-Based Access Control** - 5-tier permission system

## 📊 Logging

Logs are stored in:
- `logs/error.log` - Error level logs only
- `logs/combined.log` - All logs
- Console output (development only)

## 🚦 Health Check

```http
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-07T10:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "environment": "production"
}
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # Azure SQL connection
│   │   └── logger.js         # Winston logger
│   ├── middleware/
│   │   ├── auth.js           # Authentication & RBAC
│   │   ├── errorHandler.js   # Error handling
│   │   └── validator.js      # Input validation
│   ├── models/
│   │   ├── User.js           # User database operations
│   │   ├── AGMSession.js     # Session operations
│   │   └── Vote.js           # Voting operations
│   ├── routes/
│   │   ├── auth.js           # Auth endpoints
│   │   ├── sessions.js       # Session endpoints
│   │   ├── votes.js          # Voting endpoints
│   │   └── users.js          # User endpoints
│   └── server.js             # Main server file
├── tests/
│   └── auth.test.js          # API tests
├── logs/                     # Log files
├── .env.example              # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🔄 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3001 |
| `DB_SERVER` | Azure SQL server | - |
| `DB_DATABASE` | Database name | WeVoteDB |
| `DB_USER` | Database user | - |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | 24h |
| `BCRYPT_ROUNDS` | Password hashing rounds | 12 |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests: `npm test`
4. Commit with descriptive message
5. Create pull request

## 📝 License

MIT

## 👥 Support

For issues or questions, contact: support@wevote.com

---

**Built with ❤️ for secure, scalable voting**
