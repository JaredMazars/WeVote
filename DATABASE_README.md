# WeVote Database Files

## 📁 Files Overview

This directory contains all database-related files for the WeVote voting platform.

### Core Files

#### 1. **DATABASE_SCHEMA.sql** (Production Schema)
- **Type**: PostgreSQL SQL Script
- **Lines**: ~1,200
- **Purpose**: Complete production database schema
- **Contains**:
  - 37 tables with relationships
  - 24+ performance indexes
  - 5 views for common queries
  - 3 triggers for automation
  - Row-level security policies
  - Seed data for initial setup

**Usage:**
```bash
# Run this first to create database
psql -U postgres -d wevote -f DATABASE_SCHEMA.sql
```

#### 2. **DATABASE_DOCUMENTATION.md** (Complete Guide)
- **Type**: Markdown Documentation
- **Pages**: ~50 pages equivalent
- **Purpose**: Comprehensive database guide
- **Contains**:
  - Architecture overview
  - Entity relationships (ERD)
  - Migration instructions
  - API integration examples
  - Security best practices
  - Performance optimization
  - Backup strategies

**Usage:**
```bash
# Reference guide for developers
# Read before implementing backend
```

#### 3. **prisma/schema.prisma** (Prisma ORM Schema)
- **Type**: Prisma Schema Language
- **Lines**: ~600
- **Purpose**: Type-safe database access for Node.js
- **Contains**:
  - All 37 models (tables)
  - Relationships and constraints
  - Field types and defaults
  - Indexes definitions

**Usage:**
```bash
# Install Prisma
npm install prisma @prisma/client

# Generate Prisma Client
npx prisma generate

# Use in code
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

#### 4. **MIGRATION_ROADMAP.md** (Implementation Plan)
- **Type**: Step-by-Step Guide
- **Duration**: 3-week plan
- **Purpose**: Migrate from localStorage to database
- **Contains**:
  - 7 phases with daily tasks
  - Code examples for each step
  - Success criteria checklist
  - Rollback plan
  - Testing strategies

**Usage:**
```bash
# Follow this guide to implement backend
# Start with Phase 1: Database Setup
```

---

## 🚀 Quick Start

### Option 1: Just Database (Testing/Learning)

```bash
# 1. Install PostgreSQL 14+
choco install postgresql14  # Windows
# OR download from postgresql.org

# 2. Create database
psql -U postgres
CREATE DATABASE wevote;
\q

# 3. Run schema
psql -U postgres -d wevote -f DATABASE_SCHEMA.sql

# 4. Verify
psql -U postgres -d wevote
\dt  # List tables (should see 37)
\dv  # List views (should see 5)
```

### Option 2: Full Backend Integration

```bash
# 1. Setup database (above steps)

# 2. Create backend directory
mkdir backend
cd backend

# 3. Initialize Node.js project
npm init -y

# 4. Install dependencies
npm install express prisma @prisma/client
npm install -D typescript ts-node @types/node

# 5. Copy Prisma schema
mkdir prisma
copy ..\prisma\schema.prisma .\prisma\schema.prisma

# 6. Configure .env
echo DATABASE_URL="postgresql://postgres:password@localhost:5432/wevote" > .env

# 7. Generate Prisma Client
npx prisma generate

# 8. Follow MIGRATION_ROADMAP.md for complete implementation
```

---

## 📊 Database Statistics

### Tables by Category

| Category | Tables | Description |
|----------|--------|-------------|
| **Organizations & Users** | 7 | Multi-tenant user management |
| **Voting System** | 9 | Candidates, resolutions, votes |
| **Engagement** | 8 | Q&A, notifications |
| **Audit & Compliance** | 4 | Audit logs, attendance |
| **System Config** | 3 | Feature flags, settings |
| **Analytics** | 2 | Patterns, reports |
| **Total** | **37** | |

### Key Relationships

```
organizations (1) ←→ (N) users
users (1) ←→ (N) candidate_votes
candidates (N) ←→ (1) agm_sessions
resolutions (N) ←→ (1) agm_sessions
proxy_assignments (N) ←→ (1) users (principal)
proxy_assignments (N) ←→ (1) users (holder)
```

---

## 🔑 Key Features

### 1. Multi-Tenancy
Every table includes `organization_id` for data isolation:
```sql
SELECT * FROM users WHERE organization_id = '...';
```

### 2. Advanced Proxy Voting
Supports three proxy types:
- **Discretionary**: Proxy votes at their discretion
- **Instructional**: Specific instructions per vote
- **Split**: Percentage allocation to multiple proxies

```sql
-- Example: 60% to Proxy A, 40% to Proxy B
INSERT INTO proxy_assignments VALUES
  ('user1', 'proxyA', 'discretionary', 60.00),
  ('user1', 'proxyB', 'instructional', 40.00);
```

### 3. Audit Trail
Automatic logging via triggers:
```sql
-- Every vote automatically creates audit log
CREATE TRIGGER audit_candidate_vote_cast 
  AFTER INSERT ON candidate_votes ...
```

### 4. Real-Time Views
Pre-built queries for performance:
```sql
-- Instant candidate results
SELECT * FROM v_candidate_vote_results 
WHERE agm_session_id = '...';
```

### 5. Notification Queue
Centralized notification management:
```sql
-- Schedule email 24 hours before meeting
INSERT INTO email_notifications (scheduled_for, ...)
VALUES (NOW() + INTERVAL '24 hours', ...);
```

---

## 🏗️ Architecture Highlights

### Data Integrity
- ✅ Foreign key constraints
- ✅ Check constraints (vote weights, percentages)
- ✅ Unique constraints (prevent duplicate votes)
- ✅ NOT NULL constraints

### Performance
- ✅ 24+ strategic indexes
- ✅ Materialized views for analytics
- ✅ Connection pooling ready
- ✅ Query optimization

### Security
- ✅ Row-level security (RLS) policies
- ✅ Password hashing (bcrypt)
- ✅ JWT token authentication
- ✅ IP address logging

### Scalability
- ✅ Partition-ready design
- ✅ Archive strategy for old data
- ✅ Soft deletes (is_active flags)
- ✅ Efficient pagination

---

## 📖 How to Use These Files

### For Database Administrators:
1. Read **DATABASE_SCHEMA.sql** - Understand table structure
2. Run schema script to create database
3. Review indexes and constraints
4. Setup backup strategy (see DATABASE_DOCUMENTATION.md)

### For Backend Developers:
1. Read **DATABASE_DOCUMENTATION.md** - Full context
2. Follow **MIGRATION_ROADMAP.md** - Step-by-step implementation
3. Use **prisma/schema.prisma** - Type-safe queries
4. Implement authentication first
5. Build API endpoints incrementally

### For Frontend Developers:
1. Review API endpoints in MIGRATION_ROADMAP.md
2. Update `src/services/api.ts` to call backend
3. Replace localStorage with API calls
4. Handle loading/error states
5. Test with real data

### For Project Managers:
1. Review **MIGRATION_ROADMAP.md** - 3-week timeline
2. Check success criteria at end of each phase
3. Plan testing windows
4. Prepare rollback strategy
5. Schedule deployment

---

## 🧪 Testing

### Database Tests
```sql
-- Test user creation
INSERT INTO users (organization_id, email, first_name, last_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Test', 'User');

-- Test vote casting
INSERT INTO candidate_votes (agm_session_id, candidate_id, voter_id, vote_type)
VALUES ('...', '...', '...', 'regular');

-- Verify audit log created
SELECT * FROM audit_logs WHERE action = 'vote_cast' ORDER BY created_at DESC LIMIT 1;
```

### Backend Tests
```typescript
// Test authentication
describe('Auth API', () => {
  test('should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', ... });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });
});
```

---

## 🚨 Important Notes

### Before Running Schema Script:
1. ⚠️ **Backup existing data** if any
2. ⚠️ Ensure PostgreSQL 14+ installed
3. ⚠️ Create database first: `CREATE DATABASE wevote;`
4. ⚠️ Use correct user with privileges

### Production Deployment:
1. 🔒 Change all default passwords
2. 🔒 Use environment variables for secrets
3. 🔒 Enable SSL connections
4. 🔒 Setup automated backups
5. 🔒 Configure connection pooling
6. 🔒 Enable query logging (initially)

### Common Issues:

**Issue**: `ERROR: extension "uuid-ossp" does not exist`
**Solution**: Install PostgreSQL contrib package
```bash
# Ubuntu
sudo apt-get install postgresql-contrib

# Windows - included by default
```

**Issue**: `FATAL: role "postgres" does not exist`
**Solution**: Create postgres user or use your admin user
```bash
psql -U your_admin_user -d wevote -f DATABASE_SCHEMA.sql
```

---

## 📚 Additional Resources

### Official Documentation:
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Prisma**: https://www.prisma.io/docs
- **Express.js**: https://expressjs.com/

### Tools:
- **pgAdmin**: Database management GUI
- **DBeaver**: Universal database tool
- **TablePlus**: Modern database client

### Hosting Options:
- **Supabase**: PostgreSQL + Auth + Storage (Free tier available)
- **Heroku Postgres**: Simple deployment
- **AWS RDS**: Enterprise-grade
- **Azure Database**: Microsoft cloud

---

## 📞 Support

For questions or issues:
1. Check **DATABASE_DOCUMENTATION.md** first
2. Review **MIGRATION_ROADMAP.md** for implementation help
3. Search PostgreSQL docs for specific errors
4. Check Prisma docs for ORM issues

---

## ✅ Checklist for Database Setup

### Initial Setup:
- [ ] PostgreSQL 14+ installed
- [ ] Database created (`CREATE DATABASE wevote;`)
- [ ] Schema script run successfully
- [ ] 37 tables created
- [ ] 5 views created
- [ ] Seed data inserted
- [ ] Default organization exists

### Development Setup:
- [ ] `.env` file configured
- [ ] Prisma schema copied
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Test connection successful
- [ ] Can query database from Node.js

### Production Setup:
- [ ] Database hosted (AWS/Azure/Heroku/etc.)
- [ ] SSL enabled
- [ ] Connection pooling configured
- [ ] Backups automated
- [ ] Monitoring setup
- [ ] Secrets secured

---

**Database Version**: 1.0  
**Last Updated**: December 7, 2025  
**Status**: ✅ Ready for implementation  
**Next Step**: Follow MIGRATION_ROADMAP.md Phase 1
