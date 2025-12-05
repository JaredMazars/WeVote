# WeVote API Reference

## Overview

Base URL: `http://localhost:3001/api` (Development)  
API Version: 1.0  
Authentication: JWT Bearer Token

## Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Employees (Trustees)](#employees-trustees)
- [Resolutions](#resolutions)
- [Voting](#voting)
- [Proxy Management](#proxy-management)
- [Voting Status](#voting-status)
- [Audit Logs](#audit-logs)
- [Admin Operations](#admin-operations)
- [Error Responses](#error-responses)

---

## Authentication

### Register User
Create a new user account (awaits admin approval).

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "name": "string (required)",
  "surname": "string (optional)",
  "email": "string (required, unique)",
  "password": "string (required, min 8 chars)",
  "memberNumber": "string (optional)",
  "idNumber": "string (optional)"
}
```

**Response** (201 Created):
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

**Errors**:
- `400`: Validation error (invalid email, weak password)
- `409`: Email already exists

---

### Login
Authenticate and receive JWT token.

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "member",
    "roleId": 1,
    "mustChangePassword": true,
    "isApproved": true
  }
}
```

**Errors**:
- `401`: Invalid credentials
- `403`: Account not approved
- `403`: Account inactive

---

### Verify Token
Verify JWT token validity and get user info.

**Endpoint**: `GET /auth/verify`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "member",
    "roleId": 1
  }
}
```

**Errors**:
- `401`: Invalid or expired token

---

### Change Password
Update user password.

**Endpoint**: `POST /auth/change-password`

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 8 chars)"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors**:
- `400`: Current password incorrect
- `400`: New password doesn't meet requirements

---

### Forgot Password
Request password reset email.

**Endpoint**: `POST /auth/forgot-password`

**Request Body**:
```json
{
  "email": "string (required)"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset instructions sent to your email"
}
```

**Note**: Returns 200 even if email doesn't exist (security best practice)

---

### Reset Password
Reset password using token from email.

**Endpoint**: `POST /auth/reset-password`

**Request Body**:
```json
{
  "token": "string (required)",
  "newPassword": "string (required, min 8 chars)"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Errors**:
- `400`: Invalid or expired token
- `400`: New password doesn't meet requirements

---

## Users

### Get User Profile
Get logged-in user's profile information.

**Endpoint**: `GET /auth/profile`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "surname": "Doe",
    "email": "john.doe@example.com",
    "memberNumber": "MEM001",
    "idNumber": "1234567890123",
    "role": "member",
    "isApproved": true,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

## Employees (Trustees)

### Get All Employees
Retrieve list of all active trustee candidates.

**Endpoint**: `GET /employees`

**Query Parameters**:
- `isActive` (optional): Filter by active status (true/false)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Jane Smith",
      "position": "Trustee Candidate",
      "department": "Finance",
      "bio": "Experienced finance professional with 15 years...",
      "image_url": "/uploads/jane-smith.jpg",
      "vote_count": 45,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Get Employee by ID
Retrieve single employee details.

**Endpoint**: `GET /employees/:id`

**Parameters**:
- `id` (path): Employee ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jane Smith",
    "position": "Trustee Candidate",
    "department": "Finance",
    "bio": "Experienced finance professional...",
    "image_url": "/uploads/jane-smith.jpg",
    "vote_count": 45,
    "is_active": true
  }
}
```

**Errors**:
- `404`: Employee not found

---

### Create Employee (Admin Only)
Add a new trustee candidate.

**Endpoint**: `POST /employees`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData)**:
```
name: string (required)
position: string (optional)
department: string (optional)
bio: text (optional)
image: file (optional, max 5MB)
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Employee created successfully",
  "employee": {
    "id": 5,
    "name": "New Candidate",
    "position": "Trustee",
    "image_url": "/uploads/new-candidate.jpg"
  }
}
```

**Errors**:
- `401`: Unauthorized (not admin)
- `400`: Validation error

---

### Update Employee (Admin Only)
Update trustee candidate information.

**Endpoint**: `PUT /employees/:id`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData)**:
```
name: string (optional)
position: string (optional)
department: string (optional)
bio: text (optional)
image: file (optional)
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "employee": {
    "id": 5,
    "name": "Updated Name"
  }
}
```

---

### Delete Employee (Admin Only)
Remove a trustee candidate.

**Endpoint**: `DELETE /employees/:id`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

**Errors**:
- `400`: Cannot delete employee with votes

---

## Resolutions

### Get All Resolutions
Retrieve all AGM resolutions.

**Endpoint**: `GET /resolutions`

**Query Parameters**:
- `isActive` (optional): Filter by active status

**Response** (200 OK):
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
      "abstain_votes": 10,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Vote on Resolution
Cast a vote for a resolution.

**Endpoint**: `POST /resolutions/vote`

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "resolutionId": 1,
  "voteValue": "VOTE" | "NO" | "ABSTAIN",
  "isProxy": false,
  "proxyForUserId": null
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "voteId": 123
}
```

**Errors**:
- `400`: Already voted
- `404`: Resolution not found
- `400`: No votes available

---

## Voting

### Cast Vote for Employee
Vote for a trustee candidate.

**Endpoint**: `POST /employees/vote`

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "employeeId": 1,
  "voteValue": "VOTE" | "ABSTAIN",
  "isProxy": false,
  "proxyForUserId": null,
  "proxyGroupId": null
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "vote": {
    "id": 456,
    "employeeId": 1,
    "employeeName": "Jane Smith",
    "voteValue": "VOTE",
    "votedAt": "2025-06-20T10:30:00Z"
  }
}
```

**Errors**:
- `400`: Already voted for this employee
- `400`: No votes remaining
- `404`: Employee not found
- `403`: Not authorized (for proxy votes)

---

### Get User's Vote History
Retrieve all votes cast by user.

**Endpoint**: `GET /votes/history`

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `type` (optional): Filter by vote type (employee/resolution)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "votes": [
      {
        "id": 123,
        "type": "employee",
        "targetId": 5,
        "targetName": "Jane Smith",
        "targetPosition": "Trustee Candidate",
        "voteValue": "VOTE",
        "votedAt": "2025-06-20T10:30:00Z",
        "isProxy": false,
        "weight": 1
      }
    ],
    "total": 15,
    "limit": 50,
    "offset": 0
  }
}
```

---

## Proxy Management

### Submit Proxy Form
Create a new proxy delegation.

**Endpoint**: `POST /proxy/proxy-form`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
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
  "trustee_remuneration": "yes" | "no" | "abstain",
  "remuneration_policy": "yes" | "no" | "abstain",
  "auditors_appointment": "yes" | "no" | "abstain",
  "agm_motions": "yes" | "no" | "abstain",
  "proxy_groups": {
    "group_name": "Mr J.D. Doe",
    "principal_member_name": "Mr J.D. Doe",
    "principal_member_id": "MEM001"
  },
  "proxy_group_members": [
    {
      "initials": "A.S.",
      "full_name": "Alice Smith",
      "surname": "Smith",
      "membership_number": "MEM002",
      "id_number": "9876543210987",
      "appointment_type": "DISCRETIONAL" | "INSTRUCTIONAL" | "MIXED",
      "votes_allocated": 10,
      "discretional_votes": 0,
      "instructional_votes": 10,
      "allowed_candidates": ["1", "3", "5"] // For instructional/mixed
    }
  ],
  "total_available_votes": 10,
  "total_allocated_votes": 10
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Proxy form submitted successfully",
  "proxyGroupId": 5,
  "proxyMemberIds": [12, 13]
}
```

**Errors**:
- `400`: Validation error (vote mismatch, invalid candidates, etc.)
- `400`: Proxy deadline passed
- `409`: Proxy already exists for this member

---

### Get User's Proxy Delegations
Retrieve proxy forms created by user.

**Endpoint**: `GET /proxy/my-proxies`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "groupName": "Mr J.D. Doe",
      "principalMemberName": "John Doe",
      "totalVotesDelegated": 10,
      "isActive": true,
      "createdAt": "2025-06-15T10:00:00Z",
      "proxyMembers": [
        {
          "id": 12,
          "fullName": "Alice Smith",
          "appointmentType": "INSTRUCTIONAL",
          "votesAllocated": 10,
          "allowedCandidates": ["1", "3", "5"]
        }
      ]
    }
  ]
}
```

---

### Get Proxies Received
Retrieve proxy delegations where user is the proxy holder.

**Endpoint**: `GET /proxy/received`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "delegatorName": "Bob Member",
      "delegatorEmail": "bob@example.com",
      "appointmentType": "DISCRETIONAL",
      "votesAllocated": 5,
      "votesRemaining": 3,
      "validUntil": "2025-06-26T09:00:00Z",
      "allowedCandidates": null
    }
  ]
}
```

---

### Cancel Proxy Delegation
Remove a proxy delegation (before deadline).

**Endpoint**: `DELETE /proxy/:proxyGroupId`

**Headers**:
```
Authorization: Bearer <token>
```

**Parameters**:
- `proxyGroupId` (path): Proxy group ID to cancel

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Proxy delegation canceled successfully"
}
```

**Errors**:
- `403`: Cannot cancel after deadline
- `404`: Proxy not found
- `403`: Not authorized (not owner)

---

## Voting Status

### Get User Voting Status
Comprehensive voting status including personal and proxy votes.

**Endpoint**: `GET /voting-status/status/:userId`

**Headers**:
```
Authorization: Bearer <token>
```

**Parameters**:
- `userId` (path): User ID (must be own ID unless admin)

**Response** (200 OK):
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
        "targetPosition": "Trustee Candidate",
        "voteValue": "VOTE",
        "votedAt": "2025-06-20T10:30:00Z",
        "isProxy": false,
        "weight": 1
      }
    ],
    "proxyDelegations": [
      {
        "id": "1",
        "delegatorId": "10",
        "delegatorName": "Bob Member",
        "delegatorEmail": "bob@example.com",
        "voteType": "employee",
        "remainingVotes": 5,
        "totalVotes": 10,
        "validUntil": "2025-06-26T09:00:00Z",
        "proxyMembers": []
      }
    ],
    "myProxyGroups": [
      {
        "id": "5",
        "groupName": "Mr J.D. Doe",
        "appointmentType": "INSTRUCTIONAL",
        "isActive": true,
        "createdAt": "2025-06-15T10:00:00Z",
        "proxyMembers": []
      }
    ]
  }
}
```

**Errors**:
- `403`: Not authorized (accessing other user's status without admin role)
- `404`: User not found

---

## Audit Logs

### Get Audit Logs (Admin Only)
Retrieve system audit trail.

**Endpoint**: `GET /audit-logs`

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `startDate` (optional): ISO 8601 date (e.g., "2025-06-01T00:00:00Z")
- `endDate` (optional): ISO 8601 date
- `action` (optional): Filter by action type
- `userId` (optional): Filter by user ID
- `entityType` (optional): Filter by entity type
- `limit` (optional): Number of results (default: 100, max: 1000)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "userId": 5,
        "userName": "John Doe",
        "userEmail": "john.doe@example.com",
        "action": "USER_LOGIN",
        "entityType": "user",
        "entityId": 5,
        "details": "Login successful from IP 192.168.1.1",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2025-06-20T10:00:00Z"
      }
    ],
    "total": 150,
    "limit": 100,
    "offset": 0
  }
}
```

**Errors**:
- `403`: Not authorized (not admin)

---

### Get Audit Log Actions
Get list of all possible audit actions.

**Endpoint**: `GET /audit-logs/actions`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "actions": [
    "USER_LOGIN",
    "USER_LOGOUT",
    "USER_REGISTER",
    "PASSWORD_CHANGE",
    "VOTE_CAST",
    "PROXY_CREATED",
    "USER_APPROVED",
    "EMPLOYEE_CREATED"
  ]
}
```

---

## Admin Operations

### Get All Users (Admin Only)
Retrieve all user accounts.

**Endpoint**: `GET /admin/users`

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `isApproved` (optional): Filter by approval status
- `isActive` (optional): Filter by active status
- `roleId` (optional): Filter by role ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "memberNumber": "MEM001",
      "role": "member",
      "roleId": 1,
      "isApproved": true,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 500
}
```

---

### Get Pending Approvals (Admin Only)
Retrieve users awaiting approval.

**Endpoint**: `GET /admin/pending-approvals`

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 25,
      "name": "New User",
      "email": "new.user@example.com",
      "memberNumber": "MEM050",
      "createdAt": "2025-06-18T14:30:00Z"
    }
  ],
  "total": 5
}
```

---

### Approve User (Admin Only)
Approve a pending user registration.

**Endpoint**: `PUT /admin/approve-user/:userId`

**Headers**:
```
Authorization: Bearer <token>
```

**Parameters**:
- `userId` (path): User ID to approve

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User approved successfully",
  "userId": 25
}
```

**Errors**:
- `404`: User not found
- `400`: User already approved

---

### Reject User (Admin Only)
Reject a pending user registration.

**Endpoint**: `PUT /admin/reject-user/:userId`

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "reason": "string (optional)"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User rejected successfully"
}
```

---

### Delete User (Admin Only)
Delete a user account.

**Endpoint**: `DELETE /admin/users/:userId`

**Headers**:
```
Authorization: Bearer <token>
```

**Parameters**:
- `userId` (path): User ID to delete

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Errors**:
- `400`: Cannot delete user with votes
- `403`: Cannot delete super admin

---

### Update User Role (Super Admin Only)
Change a user's role.

**Endpoint**: `PUT /admin/users/:userId/role`

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "roleId": 2 // 1=Member, 2=Admin, 3=Super Admin
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User role updated successfully",
  "userId": 15,
  "newRole": "admin"
}
```

**Errors**:
- `403`: Not authorized (not super admin)
- `400`: Invalid role ID

---

## Error Responses

### Standard Error Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

### Common Error Messages

#### Authentication Errors
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

```json
{
  "success": false,
  "message": "Account not approved"
}
```

#### Validation Errors
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

#### Authorization Errors
```json
{
  "success": false,
  "message": "Insufficient permissions. Admin access required."
}
```

#### Rate Limit Errors
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

---

## Rate Limiting

### Global Rate Limits

| Endpoint Pattern | Limit | Window |
|------------------|-------|--------|
| `/api/auth/login` | 5 requests | 15 minutes |
| `/api/auth/register` | 3 requests | 1 hour |
| `/api/*` | 100 requests | 15 minutes |
| `/api/admin/*` | 50 requests | 15 minutes |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703001234
```

---

## Webhooks (Optional)

### Vote Cast Webhook
Triggered when a vote is cast.

**Payload**:
```json
{
  "event": "vote.cast",
  "timestamp": "2025-06-20T10:30:00Z",
  "data": {
    "voteId": 123,
    "userId": 5,
    "type": "employee",
    "targetId": 3,
    "voteValue": "VOTE",
    "isProxy": false
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Login
const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    password
  });
  
  const { token } = response.data;
  localStorage.setItem('token', token);
  return response.data;
};

// Vote for employee
const voteForEmployee = async (employeeId: number) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.post(
    `${API_BASE_URL}/employees/vote`,
    {
      employeeId,
      voteValue: 'VOTE',
      isProxy: false
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.data;
};

// Get voting status
const getVotingStatus = async (userId: number) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(
    `${API_BASE_URL}/voting-status/status/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.data;
};
```

---

## Postman Collection

Import this collection into Postman for testing:

```json
{
  "info": {
    "name": "WeVote API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

---

**API Version**: 1.0.0  
**Last Updated**: December 4, 2025  
**Maintained By**: WeVote API Team
