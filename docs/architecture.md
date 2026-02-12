# System Architecture

## Overview
- **Client**: React SPA (Single Page Application)
- **Server**: Express REST API
- **Database**: PostgreSQL

## Database Schema (ERD Description)
- **Tenants**: `id`, `name`, `subdomain`, `plan`, `limits`...
- **Users**: `id`, `tenant_id` (FK), `email`, `password`, `role`...
- **Projects**: `id`, `tenant_id` (FK), `name`, `status`...
- **Tasks**: `id`, `project_id` (FK), `assigned_to` (FK), `status`...
- **AuditLogs**: `id`, `tenant_id`, `action`, `details`...

## API Architecture
- **Auth**: `/api/auth`
- **Tenants**: `/api/tenants`
- **Users**: `/api/users`
- **Projects**: `/api/projects`
- **Tasks**: `/api/tasks`

All endpoints (except login/register) require `Authorization: Bearer <token>`.
Tenant ID is extracted from the token, NOT the request body (for security).
