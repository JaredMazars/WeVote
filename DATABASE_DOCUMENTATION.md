# WeVote Database Documentation

## Version: 1.0 | Date: December 7, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Database Technology](#database-technology)
3. [Schema Architecture](#schema-architecture)
4. [Table Relationships](#table-relationships)
5. [Key Features](#key-features)
6. [Migration Guide](#migration-guide)
7. [API Integration](#api-integration)
8. [Security Considerations](#security-considerations)
9. [Performance Optimization](#performance-optimization)
10. [Backup and Recovery](#backup-and-recovery)

---

## Overview

The WeVote database schema is designed to support a comprehensive enterprise-grade AGM voting platform with advanced features including:

- Multi-tenant organization support
- Advanced proxy voting (discretionary, instructional, split)
- Real-time voting and results tracking
- Comprehensive audit logging
- Email/SMS/WhatsApp notifications
- Q&A engagement system
- Meeting management
- Analytics and reporting

### Database Statistics

- **Total Tables**: 37
- **Total Views**: 5
- **Total Functions**: 3
- **Total Indexes**: 24+
- **Estimated Rows (Production)**: 100,000 - 1,000,000+

---

## Database Technology

### Recommended: PostgreSQL 14+

**Why PostgreSQL?**
- ✅ Advanced JSONB support for flexible metadata
- ✅ UUID native support
- ✅ Row-Level Security (RLS) for multi-tenancy
- ✅ Excellent full-text search
- ✅ Strong ACID compliance
- ✅ Mature ecosystem (pgAdmin, Prisma, TypeORM)
- ✅ Free and open-source

**Alternative Options:**
- **MySQL 8.0+**: Good alternative, lacks some advanced features
- **Microsoft SQL Server**: Enterprise option, higher cost
- **Supabase**: PostgreSQL with built-in authentication and real-time features

---

## Schema Architecture

### Core Modules

#### 1. **Organization & User Management** (7 tables)
```
organizations
├── users
│   ├── oauth_accounts
│   ├── two_factor_auth
│   ├── user_sessions
│   └── employee_profiles
└── system_settings
```

**Purpose**: Multi-tenant user management with authentication

#### 2. **Voting System** (9 tables)
```
agm_sessions
├── meeting_documents
├── candidates
├── resolutions
├── vote_allocations
├── proxy_assignments
│   └── proxy_instructions
├── candidate_votes
└── resolution_votes
```

**Purpose**: Complete voting lifecycle management

#### 3. **Engagement & Communication** (8 tables)
```
qa_questions
├── qa_answers
└── qa_upvotes

email_notifications
sms_notifications
whatsapp_notifications
email_templates
```

**Purpose**: User engagement and multi-channel communication

#### 4. **Audit & Compliance** (4 tables)
```
audit_logs
meeting_attendance
vote_verification_tokens
voting_patterns
```

**Purpose**: Compliance, security, and analytics

#### 5. **System Configuration** (3 tables)
```
feature_flags
system_settings
report_history
```

**Purpose**: Platform configuration and feature management

---

## Table Relationships

### Entity Relationship Diagram (ERD) - Key Relationships

```
┌─────────────────┐
│  organizations  │
└────────┬────────┘
         │
         │ 1:N
         ▼
    ┌────────┐      1:N      ┌────────────────┐
    │ users  ├───────────────►│ candidate_votes│
    └───┬────┘                └────────────────┘
        │                               │
        │ 1:1                           │ N:1
        ▼                               ▼
┌──────────────────┐           ┌──────────────┐
│employee_profiles │           │  candidates  │
└──────────────────┘           └──────┬───────┘
                                      │
                                      │ N:1
                                      ▼
                              ┌────────────────┐
                              │ agm_sessions   │
                              └────────┬───────┘
                                      │
                                      │ 1:N
                                      ▼
                              ┌────────────────┐
                              │  resolutions   │
                              └────────────────┘
```

### Critical Relationships

1. **Organizations → Users**: One-to-Many (Multi-tenancy)
2. **Users → Employee Profiles**: One-to-One (Extended info)
3. **AGM Sessions → Candidates/Resolutions**: One-to-Many (Meeting content)
4. **Users → Votes**: One-to-Many (Voting records)
5. **Proxy Assignments**: Many-to-Many (Complex proxy relationships)

---

## Key Features

### 1. Multi-Tenancy Support

Every major table includes `organization_id` for data isolation:

```sql
SELECT * FROM users WHERE organization_id = '...' AND email = '...';
```

### 2. Soft Deletes

Most tables use `is_active` or status fields instead of hard deletes:

```sql
UPDATE users SET is_active = false WHERE id = '...';
```

### 3. Audit Trail

All critical actions automatically logged via triggers:

```sql
-- Automatically triggered on vote cast
INSERT INTO audit_logs (action, user_id, entity_type, entity_id, ...)
```

### 4. Flexible Metadata with JSONB

Many tables include JSONB columns for extensibility:

```sql
-- User sessions can store any device info
device_info: {
  "browser": "Chrome 120",
  "os": "Windows 11",
  "screen": "1920x1080"
}
```

### 5. Advanced Proxy Voting

Three proxy types supported:

- **Discretionary**: Proxy votes at their discretion
- **Instructional**: Specific instructions per candidate/resolution
- **Split**: Allocate percentage of votes to multiple proxies

```sql
-- Example: 60% to Proxy A (discretionary), 40% to Proxy B (instructional)
INSERT INTO proxy_assignments 
  (principal_id, proxy_holder_id, proxy_type, vote_weight)
VALUES
  ('user1', 'proxyA', 'discretionary', 60.00),
  ('user1', 'proxyB', 'instructional', 40.00);
```

### 6. Vote Weight Calculation

Supports fractional votes for complex scenarios:

```sql
-- User has 10 allocated votes
-- Uses 60% proxy with weight 0.6
-- Effective vote: 10 * 0.6 = 6 votes
INSERT INTO candidate_votes (vote_weight) VALUES (6.00);
```

### 7. Notification Queue System

Centralized notification management:

```sql
-- Schedule reminder 24 hours before meeting
INSERT INTO email_notifications (user_id, template_name, scheduled_for)
VALUES ('...', 'meeting_reminder', NOW() + INTERVAL '24 hours');
```

### 8. Real-Time Views

Pre-built views for common queries:

```sql
-- Get candidate results instantly
SELECT * FROM v_candidate_vote_results WHERE agm_session_id = '...';
```

---

## Migration Guide

### Phase 1: Database Setup (1-2 hours)

#### Step 1: Install PostgreSQL

**Windows:**
```powershell
# Using Chocolatey
choco install postgresql14

# Or download from https://www.postgresql.org/download/windows/
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install postgresql-14 postgresql-contrib
```

**Docker:**
```bash
docker run --name wevote-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=wevote \
  -p 5432:5432 \
  -d postgres:14
```

#### Step 2: Create Database

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE wevote;

-- Connect to database
\c wevote
```

#### Step 3: Run Schema Script

```bash
# From project root
psql -U postgres -d wevote -f DATABASE_SCHEMA.sql
```

**Expected Output:**
```
CREATE EXTENSION
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
...
CREATE INDEX
CREATE VIEW
...
INSERT 0 1
```

#### Step 4: Verify Installation

```sql
-- Check tables created
\dt

-- Check views
\dv

-- Verify seed data
SELECT * FROM organizations;
SELECT * FROM system_settings;
```

### Phase 2: Backend Integration (3-5 days)

#### Technology Options

##### Option A: Node.js + Prisma (Recommended)

**Why Prisma?**
- Type-safe database queries
- Auto-generated TypeScript types
- Migration management
- Great DX (Developer Experience)

**Installation:**
```bash
npm install prisma @prisma/client
npm install -D prisma
```

**Initialize Prisma:**
```bash
npx prisma init
```

**Configure `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  firstName       String   @map("first_name")
  lastName        String   @map("last_name")
  role            String   @default("voter")
  organizationId  String   @map("organization_id")
  organization    Organization @relation(fields: [organizationId], references: [id])
  
  @@map("users")
}

// ... more models
```

**Generate Prisma Client:**
```bash
npx prisma generate
```

**Usage in API:**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Example: Get user
const user = await prisma.user.findUnique({
  where: { email: 'demo@wevote.com' },
  include: {
    organization: true,
    employeeProfile: true
  }
});
```

##### Option B: Node.js + TypeORM

**Installation:**
```bash
npm install typeorm pg reflect-metadata
```

**Entity Example:**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @ManyToOne(() => Organization, org => org.users)
  organization: Organization;
}
```

##### Option C: Node.js + Knex.js (Raw SQL)

**Installation:**
```bash
npm install knex pg
```

**Query Example:**
```typescript
import knex from 'knex';

const db = knex({
  client: 'postgresql',
  connection: process.env.DATABASE_URL
});

const users = await db('users')
  .where({ organization_id: orgId })
  .select('*');
```

### Phase 3: Data Migration (2-3 days)

#### Migrate from LocalStorage to Database

**Current State:** All data in browser `localStorage`

**Migration Strategy:**

1. **Export Current Data**
   - Use existing JSON export functionality
   - Save all users, candidates, resolutions, votes

2. **Create Migration Script**

```typescript
// scripts/migrate-to-db.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function migrate() {
  // Read exported JSON
  const data = JSON.parse(fs.readFileSync('export.json', 'utf-8'));
  
  // Insert organization
  const org = await prisma.organization.create({
    data: {
      name: 'Forvis Mazars',
      domain: 'forvismzansi.com'
    }
  });
  
  // Insert users
  for (const user of data.users) {
    await prisma.user.create({
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: org.id,
        // ... other fields
      }
    });
  }
  
  // Insert candidates, resolutions, votes, etc.
}

migrate().catch(console.error);
```

3. **Run Migration**

```bash
npx ts-node scripts/migrate-to-db.ts
```

### Phase 4: API Development (5-7 days)

#### Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Candidate.ts
│   │   └── ...
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── candidates.routes.ts
│   │   ├── resolutions.routes.ts
│   │   ├── votes.routes.ts
│   │   └── ...
│   ├── controllers/
│   │   ├── AuthController.ts
│   │   ├── VotesController.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── ...
│   ├── services/
│   │   ├── VotingService.ts
│   │   ├── ProxyService.ts
│   │   ├── EmailService.ts
│   │   └── ...
│   └── index.ts
└── package.json
```

#### Key API Endpoints

**Authentication:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/reset-password
POST   /api/auth/verify-email
```

**Users:**
```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/users/:id/voting-history
```

**AGM Sessions:**
```
GET    /api/agm-sessions
GET    /api/agm-sessions/:id
POST   /api/agm-sessions
PUT    /api/agm-sessions/:id
POST   /api/agm-sessions/:id/start
POST   /api/agm-sessions/:id/end
GET    /api/agm-sessions/:id/results
```

**Candidates:**
```
GET    /api/agm-sessions/:sessionId/candidates
POST   /api/agm-sessions/:sessionId/candidates
PUT    /api/candidates/:id
DELETE /api/candidates/:id
GET    /api/candidates/:id/votes
```

**Voting:**
```
POST   /api/votes/candidate
POST   /api/votes/resolution
GET    /api/votes/my-votes
GET    /api/votes/verify/:verificationCode
```

**Proxies:**
```
GET    /api/proxies
POST   /api/proxies
PUT    /api/proxies/:id
DELETE /api/proxies/:id
GET    /api/proxies/my-proxies
```

#### Example: Vote Controller

```typescript
// controllers/VotesController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class VotesController {
  // Cast candidate vote
  async castCandidateVote(req: Request, res: Response) {
    const { candidateId, voteType, proxyAssignmentId } = req.body;
    const userId = req.user.id; // From auth middleware
    
    try {
      // Validate AGM is active
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { agmSession: true }
      });
      
      if (candidate?.agmSession.status !== 'active') {
        return res.status(400).json({ 
          error: 'Voting session is not active' 
        });
      }
      
      // Check if already voted
      const existingVote = await prisma.candidateVote.findFirst({
        where: {
          candidateId,
          voterId: userId,
          proxyAssignmentId: proxyAssignmentId || null
        }
      });
      
      if (existingVote) {
        return res.status(400).json({ 
          error: 'Already voted for this candidate' 
        });
      }
      
      // Calculate vote weight
      let voteWeight = 1.0;
      if (voteType === 'proxy' && proxyAssignmentId) {
        const proxy = await prisma.proxyAssignment.findUnique({
          where: { id: proxyAssignmentId }
        });
        voteWeight = proxy?.voteWeight || 100.0;
      }
      
      // Cast vote
      const vote = await prisma.candidateVote.create({
        data: {
          candidateId,
          voterId: userId,
          voteType,
          proxyAssignmentId,
          voteWeight: voteWeight / 100,
          agmSessionId: candidate.agmSessionId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
      
      // Generate verification token
      const verificationToken = await generateVerificationToken(vote.id);
      
      // Send confirmation email
      await sendVoteConfirmationEmail(userId, candidate, verificationToken);
      
      return res.status(201).json({
        success: true,
        vote,
        verificationCode: verificationToken
      });
      
    } catch (error) {
      console.error('Vote casting error:', error);
      return res.status(500).json({ error: 'Failed to cast vote' });
    }
  }
  
  // Get vote results
  async getCandidateResults(req: Request, res: Response) {
    const { sessionId } = req.params;
    
    const results = await prisma.candidateVote.groupBy({
      by: ['candidateId'],
      where: { agmSessionId: sessionId },
      _count: { id: true },
      _sum: { voteWeight: true }
    });
    
    return res.json(results);
  }
}
```

---

## Security Considerations

### 1. Row-Level Security (RLS)

Enable for multi-tenant data isolation:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_org_isolation ON users
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id')::UUID);
```

### 2. Password Hashing

**Never store plain text passwords!**

```typescript
import bcrypt from 'bcrypt';

// On registration
const hashedPassword = await bcrypt.hash(password, 10);

// On login
const isValid = await bcrypt.compare(password, user.passwordHash);
```

### 3. SQL Injection Prevention

Always use parameterized queries:

```typescript
// ✅ SAFE
await prisma.user.findUnique({ where: { email: userInput } });

// ❌ DANGEROUS
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`;
```

### 4. JWT Token Management

```typescript
import jwt from 'jsonwebtoken';

// Generate token
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### 5. Rate Limiting

Prevent brute force attacks:

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts'
});

app.post('/api/auth/login', loginLimiter, loginHandler);
```

---

## Performance Optimization

### 1. Database Indexes

Already included in schema for common queries:

```sql
-- Fast user lookup by email
CREATE INDEX idx_users_email ON users(email);

-- Fast vote counting
CREATE INDEX idx_candidate_votes_candidate_id ON candidate_votes(candidate_id);
```

### 2. Connection Pooling

```typescript
// Prisma connection pool (automatic)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Or with pg (manual)
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### 3. Query Optimization

Use pre-built views:

```typescript
// ❌ SLOW - Multiple joins
const results = await prisma.candidateVote.findMany({
  where: { agmSessionId: sessionId },
  include: {
    candidate: { include: { user: true } }
  }
});

// ✅ FAST - Single view query
const results = await prisma.$queryRaw`
  SELECT * FROM v_candidate_vote_results 
  WHERE agm_session_id = ${sessionId}
`;
```

### 4. Caching Strategy

**Redis for hot data:**

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache active session data
async function getActiveSession(sessionId: string) {
  // Try cache first
  const cached = await redis.get(`session:${sessionId}`);
  if (cached) return JSON.parse(cached);
  
  // Query database
  const session = await prisma.agmSession.findUnique({
    where: { id: sessionId }
  });
  
  // Cache for 5 minutes
  await redis.setex(`session:${sessionId}`, 300, JSON.stringify(session));
  
  return session;
}
```

---

## Backup and Recovery

### 1. Automated Backups

**Daily backups:**

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="wevote_backup_$DATE.sql"

pg_dump -U postgres wevote > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE.gz s3://wevote-backups/
```

**Cron schedule:**
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

### 2. Point-in-Time Recovery

Enable WAL archiving:

```sql
-- postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /path/to/archive/%f'
```

### 3. Restore Process

```bash
# Stop application
systemctl stop wevote-api

# Drop existing database
dropdb wevote

# Create fresh database
createdb wevote

# Restore from backup
psql wevote < wevote_backup_20251207.sql

# Start application
systemctl start wevote-api
```

---

## Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wevote"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# Authentication
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRATION="24h"
BCRYPT_ROUNDS=10

# Email (SendGrid)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
SMTP_FROM_EMAIL="noreply@wevote.com"
SMTP_FROM_NAME="WeVote Platform"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# WhatsApp
WHATSAPP_API_URL="your-whatsapp-api-url"
WHATSAPP_API_KEY="your-api-key"

# Application
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"

# Redis (for caching)
REDIS_URL="redis://localhost:6379"

# File Storage
AWS_S3_BUCKET="wevote-files"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
```

---

## Next Steps

1. ✅ **Database Schema Created** (Complete)
2. 🔄 **Choose Backend Framework** (Recommend: Node.js + Prisma)
3. 🔄 **Generate Prisma Schema** (Convert SQL to Prisma models)
4. 🔄 **Build API Endpoints** (See API Integration section)
5. 🔄 **Update React Frontend** (Replace localStorage with API calls)
6. 🔄 **Implement Authentication** (JWT + bcrypt)
7. 🔄 **Add Email Service** (SendGrid integration)
8. 🔄 **Testing** (Unit + Integration tests)
9. 🔄 **Deployment** (Docker + AWS/Azure)
10. 🔄 **Monitoring** (New Relic, Datadog, or Sentry)

---

## Support & Resources

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Prisma Docs**: https://www.prisma.io/docs
- **TypeORM Docs**: https://typeorm.io/
- **WeVote GitHub**: (Add your repository URL)

---

**Document Status**: ✅ Complete  
**Last Updated**: December 7, 2025  
**Next Review**: After backend implementation
