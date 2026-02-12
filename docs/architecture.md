# System Architecture

## Overview

This document describes the architecture of the Multi-Tenant SaaS Platform, a production-ready application for project and task management with complete tenant isolation.

### Technology Stack

- **Frontend**: React 18 with Vite, React Router, Axios
- **Backend**: Node.js with Express.js, JWT authentication
- **Database**: PostgreSQL 15 (Alpine Linux container)
- **Deployment**: Docker Compose orchestration

## High-Level Architecture

![System Architecture](images/system-architecture.png)

### Architecture Components:

1. **Client Layer**
   - Web Browser accessing React SPA
   - Protected routes with JWT authentication
   - Role-based UI rendering

2. **Docker Environment** (3 containers)
   - **Frontend Container** (Port 3000)
     - React application built with Vite
     - Responsive design with CSS modules
     - Context API for state management
   - **Backend Container** (Port 5000)
     - Express.js REST API server
     - JWT authentication middleware
     - CORS configuration for frontend
     - Health check endpoint at `/api/health`
   - **Database Container** (Port 5432)
     - PostgreSQL 15 database
     - Persistent volume for data storage
     - Automatic migration and seed loading

3. **Data Layer**
   - Multi-tenant database schema
   - Row-level tenant isolation
   - Foreign key constraints with CASCADE delete

## Database Schema

![Database ERD](images/database-erd.png)

### Core Tables:

#### tenants

- Primary tenant organization table
- Contains subscription plan and limits
- Unique subdomain constraint

#### users

- User accounts with tenant association
- Super admin users have `tenant_id = NULL`
- Composite unique constraint on (tenant_id, email)

#### projects

- Projects owned by tenants
- Created by specific users
- Status tracking (active/archived/completed)

#### tasks

- Tasks within projects
- Assigned to specific users
- Priority and status tracking
- Due date support

#### audit_logs

- Tracks all important actions
- Includes user_id, tenant_id, action type
- Immutable audit trail

### Database Relationships:

- One tenant has many users, projects, tasks
- One user can create many projects
- One user can be assigned many tasks
- One project contains many tasks
- All tables (except audit_logs) have CASCADE delete on tenant_id

## API Architecture

All API endpoints follow RESTful principles with consistent response format:

```json
{
  "success": boolean,
  "message": "string (optional)",
  "data": {} (optional)
}
```

### Authentication & Authorization

- All endpoints (except login/register) require `Authorization: Bearer <JWT_TOKEN>` header
- JWT token contains: `{userId, tenantId, role}`
- Token expiry: 24 hours
- Tenant ID is extracted from token for data isolation (NOT from request body)
- Role-based access control enforced at controller level

### Complete API Endpoint List

#### Authentication Module (4 endpoints)

| Method | Endpoint                    | Auth | Role   | Description                         |
| ------ | --------------------------- | ---- | ------ | ----------------------------------- |
| POST   | `/api/auth/register-tenant` | No   | Public | Register new tenant with admin user |
| POST   | `/api/auth/login`           | No   | Public | Login and receive JWT token         |
| GET    | `/api/auth/me`              | Yes  | All    | Get current user profile            |
| POST   | `/api/auth/logout`          | Yes  | All    | Logout (optional session cleanup)   |

#### Tenant Management Module (3 endpoints)

| Method | Endpoint                 | Auth | Role                          | Description                      |
| ------ | ------------------------ | ---- | ----------------------------- | -------------------------------- |
| GET    | `/api/tenants/:tenantId` | Yes  | Tenant members or Super Admin | Get tenant details with stats    |
| PUT    | `/api/tenants/:tenantId` | Yes  | Tenant Admin or Super Admin   | Update tenant information        |
| GET    | `/api/tenants`           | Yes  | Super Admin only              | List all tenants with pagination |

#### User Management Module (4 endpoints)

| Method | Endpoint                       | Auth | Role                 | Description                          |
| ------ | ------------------------------ | ---- | -------------------- | ------------------------------------ |
| POST   | `/api/tenants/:tenantId/users` | Yes  | Tenant Admin         | Add user to tenant (enforces limits) |
| GET    | `/api/tenants/:tenantId/users` | Yes  | Tenant members       | List all users in tenant             |
| PUT    | `/api/users/:userId`           | Yes  | Tenant Admin or self | Update user information              |
| DELETE | `/api/users/:userId`           | Yes  | Tenant Admin         | Delete user (cannot delete self)     |

#### Project Management Module (4 endpoints)

| Method | Endpoint                   | Auth | Role                    | Description                         |
| ------ | -------------------------- | ---- | ----------------------- | ----------------------------------- |
| POST   | `/api/projects`            | Yes  | All                     | Create project (enforces limits)    |
| GET    | `/api/projects`            | Yes  | All                     | List tenant's projects with filters |
| PUT    | `/api/projects/:projectId` | Yes  | Creator or Tenant Admin | Update project details              |
| DELETE | `/api/projects/:projectId` | Yes  | Creator or Tenant Admin | Delete project with cascade         |

#### Task Management Module (5 endpoints)

| Method | Endpoint                         | Auth | Role                    | Description                  |
| ------ | -------------------------------- | ---- | ----------------------- | ---------------------------- |
| POST   | `/api/projects/:projectId/tasks` | Yes  | All                     | Create task in project       |
| GET    | `/api/projects/:projectId/tasks` | Yes  | All                     | List tasks with filters      |
| PATCH  | `/api/tasks/:taskId/status`      | Yes  | All                     | Update task status only      |
| PUT    | `/api/tasks/:taskId`             | Yes  | All                     | Update complete task details |
| DELETE | `/api/tasks/:taskId`             | Yes  | Creator or Tenant Admin | Delete task                  |

**Total: 20 API Endpoints**

### Security Features

1. **Multi-Tenancy Isolation**
   - All queries filtered by `tenant_id` from JWT
   - Super admin users bypass tenant filter
   - Cross-tenant access returns 403/404

2. **Authentication**
   - Bcrypt password hashing (10 rounds)
   - JWT tokens with HS256 algorithm
   - Token validation middleware

3. **Authorization**
   - Role-based access control (RBAC)
   - Super Admin: Access all tenants
   - Tenant Admin: Manage own tenant
   - User: Limited permissions

4. **Input Validation**
   - Request body validation
   - SQL injection prevention (parameterized queries)
   - XSS protection (helmet middleware)

5. **Audit Logging**
   - All important actions logged
   - Includes user_id, tenant_id, timestamp
   - Immutable audit trail

### Error Handling

| Status Code | Meaning               | Usage                                    |
| ----------- | --------------------- | ---------------------------------------- |
| 200         | Success               | Successful GET, PUT, PATCH, DELETE       |
| 201         | Created               | Successful POST                          |
| 400         | Bad Request           | Invalid input data                       |
| 401         | Unauthorized          | Missing/invalid JWT token                |
| 403         | Forbidden             | Valid token but insufficient permissions |
| 404         | Not Found             | Resource doesn't exist                   |
| 409         | Conflict              | Duplicate resource (e.g., email exists)  |
| 500         | Internal Server Error | Unexpected server error                  |
