# WeVote Backend Migration Roadmap

## From LocalStorage to Production Database

**Status**: Database schema complete ✅  
**Next Step**: Backend API implementation  
**Estimated Timeline**: 2-3 weeks  

---

## Overview

This document outlines the step-by-step process to migrate WeVote from a localStorage-based application to a production-ready database-backed system.

### Current State
- ✅ React 19 frontend with TypeScript
- ✅ All data stored in browser localStorage
- ✅ API service layer structure in place (`src/services/api.ts`)
- ✅ Complete database schema designed (PostgreSQL)
- ✅ Prisma schema ready
- ✅ Report generation working (PDF/Excel)

### Target State
- 🎯 PostgreSQL database with full schema
- 🎯 Node.js + Express backend API
- 🎯 Prisma ORM for type-safe database access
- 🎯 JWT authentication
- 🎯 Real-time updates via WebSockets
- 🎯 Email/SMS notifications
- 🎯 Production deployment ready

---

## Migration Phases

### Phase 1: Database Setup (Day 1-2)

#### 1.1 Install PostgreSQL
```powershell
# Windows - Using Chocolatey
choco install postgresql14

# Or download installer from postgresql.org
```

#### 1.2 Create Database
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database and user
CREATE DATABASE wevote;
CREATE USER wevote_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE wevote TO wevote_user;
```

#### 1.3 Run Schema Script
```powershell
# From project root
psql -U postgres -d wevote -f DATABASE_SCHEMA.sql
```

#### 1.4 Verify Installation
```sql
-- Check tables
\c wevote
\dt

-- Should see 37 tables
```

**Deliverable**: Working PostgreSQL database with schema ✅

---

### Phase 2: Backend Setup (Day 3-5)

#### 2.1 Initialize Backend Project

```powershell
# Create backend directory
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors dotenv
npm install prisma @prisma/client
npm install bcrypt jsonwebtoken
npm install express-validator express-rate-limit
npm install -D typescript @types/node @types/express
npm install -D ts-node nodemon
npm install -D @types/bcrypt @types/jsonwebtoken
```

#### 2.2 Configure Prisma

```powershell
# Initialize Prisma
npx prisma init

# Copy schema from root
copy ..\prisma\schema.prisma .\prisma\schema.prisma

# Generate Prisma Client
npx prisma generate
```

#### 2.3 Create Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts       # Prisma client initialization
│   │   └── config.ts          # Environment variables
│   ├── middleware/
│   │   ├── auth.middleware.ts # JWT verification
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts     # POST /api/auth/login, /register
│   │   ├── users.routes.ts    # CRUD /api/users
│   │   ├── agm.routes.ts      # CRUD /api/agm-sessions
│   │   ├── candidates.routes.ts
│   │   ├── resolutions.routes.ts
│   │   ├── votes.routes.ts
│   │   ├── proxies.routes.ts
│   │   └── reports.routes.ts
│   ├── controllers/
│   │   ├── AuthController.ts
│   │   ├── UserController.ts
│   │   ├── VoteController.ts
│   │   └── ...
│   ├── services/
│   │   ├── AuthService.ts     # Business logic
│   │   ├── VotingService.ts
│   │   ├── ProxyService.ts
│   │   ├── EmailService.ts
│   │   └── ...
│   ├── utils/
│   │   ├── jwt.util.ts
│   │   ├── password.util.ts
│   │   └── validation.util.ts
│   └── index.ts               # Express app entry point
├── prisma/
│   └── schema.prisma
├── .env
├── tsconfig.json
└── package.json
```

#### 2.4 Create `.env` File

```env
# Database
DATABASE_URL="postgresql://wevote_user:your_secure_password@localhost:5432/wevote"

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=24h

# Encryption
BCRYPT_ROUNDS=10
```

#### 2.5 Create Basic Server

**`src/index.ts`:**
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes (to be added)
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// ...

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WeVote API running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

#### 2.6 Test Backend

```powershell
# Start dev server
npm run dev

# Test health endpoint
curl http://localhost:3001/api/health
```

**Expected Output:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-07T..."
}
```

**Deliverable**: Working Express server with Prisma ✅

---

### Phase 3: Authentication API (Day 6-8)

#### 3.1 Implement Auth Routes

**Priority Endpoints:**
1. `POST /api/auth/register` - Create new user
2. `POST /api/auth/login` - Login and get JWT token
3. `POST /api/auth/refresh` - Refresh token
4. `POST /api/auth/logout` - Invalidate session
5. `GET /api/auth/me` - Get current user

#### 3.2 Password Hashing Utility

**`src/utils/password.util.ts`:**
```typescript
import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

#### 3.3 JWT Utility

**`src/utils/jwt.util.ts`:**
```typescript
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRATION }
  );
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}
```

#### 3.4 Auth Controller

**`src/controllers/AuthController.ts`:**
```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';

const prisma = new PrismaClient();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, organizationId } = req.body;
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          organizationId,
          role: 'voter'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });
      
      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });
      
      return res.status(201).json({ user, token });
      
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Registration failed' });
    }
  }
  
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          organization: true,
          employeeProfile: true
        }
      });
      
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }
      
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: req.ip
        }
      });
      
      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });
      
      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;
      
      return res.json({ user: userWithoutPassword, token });
      
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }
}
```

#### 3.5 Auth Middleware

**`src/middleware/auth.middleware.ts`:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}
```

**Deliverable**: Working authentication API ✅

---

### Phase 4: Core API Endpoints (Day 9-12)

#### 4.1 Users API

**Endpoints:**
- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

#### 4.2 AGM Sessions API

**Endpoints:**
- `GET /api/agm-sessions` - List sessions
- `POST /api/agm-sessions` - Create session (admin)
- `PUT /api/agm-sessions/:id` - Update session
- `POST /api/agm-sessions/:id/start` - Start voting
- `POST /api/agm-sessions/:id/end` - End voting

#### 4.3 Candidates API

**Endpoints:**
- `GET /api/agm-sessions/:sessionId/candidates` - List candidates
- `POST /api/agm-sessions/:sessionId/candidates` - Create candidate
- `PUT /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/:id` - Remove candidate

#### 4.4 Resolutions API

Similar structure to Candidates API

#### 4.5 Voting API

**Endpoints:**
- `POST /api/votes/candidate` - Cast candidate vote
- `POST /api/votes/resolution` - Cast resolution vote
- `GET /api/votes/my-votes` - Get user's votes
- `GET /api/agm-sessions/:sessionId/results` - Get results

**Example Vote Controller:**
```typescript
export class VoteController {
  async castCandidateVote(req: Request, res: Response) {
    const { candidateId, voteType, proxyAssignmentId } = req.body;
    const userId = req.user!.userId;
    
    try {
      // Validate AGM is active
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { agmSession: true }
      });
      
      if (candidate?.agmSession.status !== 'active') {
        return res.status(400).json({ error: 'Voting is not active' });
      }
      
      // Check duplicate vote
      const existing = await prisma.candidateVote.findFirst({
        where: {
          candidateId,
          voterId: userId,
          proxyAssignmentId: proxyAssignmentId || null
        }
      });
      
      if (existing) {
        return res.status(400).json({ error: 'Already voted' });
      }
      
      // Cast vote
      const vote = await prisma.candidateVote.create({
        data: {
          candidateId,
          voterId: userId,
          voteType,
          proxyAssignmentId,
          agmSessionId: candidate.agmSessionId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
      
      return res.status(201).json({ success: true, vote });
      
    } catch (error) {
      console.error('Vote error:', error);
      return res.status(500).json({ error: 'Failed to cast vote' });
    }
  }
}
```

**Deliverable**: All core APIs functional ✅

---

### Phase 5: Frontend Integration (Day 13-16)

#### 5.1 Update API Service

**`src/services/api.ts`:**
```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: any) =>
    api.post('/auth/register', data),
  
  getCurrentUser: () =>
    api.get('/auth/me')
};

// Users endpoints
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`)
};

// Candidates endpoints
export const candidatesAPI = {
  getBySession: (sessionId: string) =>
    api.get(`/agm-sessions/${sessionId}/candidates`),
  
  create: (sessionId: string, data: any) =>
    api.post(`/agm-sessions/${sessionId}/candidates`, data),
  
  update: (id: string, data: any) =>
    api.put(`/candidates/${id}`, data)
};

// Votes endpoints
export const votesAPI = {
  castCandidateVote: (data: any) =>
    api.post('/votes/candidate', data),
  
  castResolutionVote: (data: any) =>
    api.post('/votes/resolution', data),
  
  getMyVotes: () =>
    api.get('/votes/my-votes'),
  
  getResults: (sessionId: string) =>
    api.get(`/agm-sessions/${sessionId}/results`)
};

export default api;
```

#### 5.2 Update AuthContext

**`src/contexts/AuthContext.tsx`:**
```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

// ... (replace localStorage logic with API calls)

const login = async (email: string, password: string) => {
  try {
    const response = await authAPI.login(email, password);
    const { user, token } = response.data;
    
    localStorage.setItem('authToken', token);
    setUser(user);
    setIsAuthenticated(true);
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Login failed'
    };
  }
};
```

#### 5.3 Update Components

Replace all localStorage calls with API calls:

**Before (LocalStorage):**
```typescript
const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
```

**After (API):**
```typescript
const { data } = await candidatesAPI.getBySession(sessionId);
const candidates = data;
```

**Deliverable**: Frontend connected to backend ✅

---

### Phase 6: Data Migration (Day 17-18)

#### 6.1 Export Current Data

Use existing JSON export functionality to save all data.

#### 6.2 Create Migration Script

**`backend/scripts/migrate-data.ts`:**
```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { hashPassword } from '../src/utils/password.util';

const prisma = new PrismaClient();

async function migrate() {
  const data = JSON.parse(fs.readFileSync('export.json', 'utf-8'));
  
  console.log('Starting migration...');
  
  // 1. Create organization
  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Forvis Mazars',
      domain: 'forvismzansi.com',
      subscriptionTier: 'enterprise'
    }
  });
  
  // 2. Migrate users
  for (const user of data.users) {
    const hashedPassword = await hashPassword(user.password || 'demo123');
    
    await prisma.user.create({
      data: {
        email: user.email,
        passwordHash: hashedPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: org.id,
        role: user.role,
        avatarUrl: user.avatar
      }
    });
  }
  
  console.log(`✅ Migrated ${data.users.length} users`);
  
  // 3. Migrate candidates, resolutions, votes...
  // (Similar pattern)
  
  console.log('Migration complete!');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### 6.3 Run Migration

```powershell
npx ts-node backend/scripts/migrate-data.ts
```

**Deliverable**: All data migrated to database ✅

---

### Phase 7: Testing & Deployment (Day 19-21)

#### 7.1 Testing

```powershell
# Install test dependencies
npm install -D jest @types/jest ts-jest supertest @types/supertest

# Run tests
npm test
```

#### 7.2 Environment Setup

Create production `.env`:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@production-host:5432/wevote
JWT_SECRET=super-secure-random-string
```

#### 7.3 Docker Setup

**`Dockerfile`:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
```

#### 7.4 Deploy

Options:
- **Heroku**: Easy PostgreSQL + Node.js hosting
- **AWS**: EC2 + RDS
- **Azure**: App Service + PostgreSQL
- **DigitalOcean**: Droplet + Managed Database

**Deliverable**: Production deployment ✅

---

## Success Criteria

### Technical Checklist
- [ ] PostgreSQL database running
- [ ] All 37 tables created
- [ ] Prisma client generated
- [ ] Express server running on port 3001
- [ ] All API endpoints responding
- [ ] JWT authentication working
- [ ] Frontend making API calls
- [ ] Data migrated from localStorage
- [ ] Tests passing
- [ ] Production deployment

### Functional Checklist
- [ ] Users can register/login
- [ ] Admin can create AGM sessions
- [ ] Candidates can be nominated
- [ ] Users can cast votes
- [ ] Proxy assignments work
- [ ] Results display correctly
- [ ] Reports generate (PDF/Excel)
- [ ] Audit logs recording
- [ ] Email notifications sending

---

## Rollback Plan

If issues occur:

1. **Keep old localStorage version** as backup
2. **Feature flag** for database mode:
   ```typescript
   const USE_DATABASE = import.meta.env.VITE_USE_DATABASE === 'true';
   ```
3. **Gradual migration**: Test with subset of users first

---

## Support & Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Express Docs**: https://expressjs.com/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **JWT.io**: https://jwt.io/

---

**Status**: Ready to start Phase 1 ✅  
**Next Action**: Install PostgreSQL and run schema script  
**Estimated Completion**: 3 weeks from start
