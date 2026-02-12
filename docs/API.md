# API Documentation

## Auth
- `POST /api/auth/register-tenant`: Register new tenant + admin.
- `POST /api/auth/login`: Login user.
- `GET /api/auth/me`: Get current user profile.

## Tenants
- `GET /api/tenants`: List all (Super Admin).
- `GET /api/tenants/:id`: Get details.
- `PUT /api/tenants/:id`: Update details.

## Users
- `GET /api/tenants/:id/users`: List users.
- `POST /api/tenants/:id/users`: Create user.
- `PUT /api/users/:id`: Update user.
- `DELETE /api/users/:id`: Delete user.

## Projects
- `GET /api/projects`: List projects.
- `POST /api/projects`: Create project.
- `GET /api/projects/:id`: Get project.
- `PUT /api/projects/:id`: Update project.
- `DELETE /api/projects/:id`: Delete project.

## Tasks
- `GET /api/projects/:id/tasks`: List tasks.
- `POST /api/projects/:id/tasks`: Create task.
- `PUT /api/tasks/:id`: Update task.
- `DELETE /api/tasks/:id`: Delete task.
