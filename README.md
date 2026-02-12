# Multi-Tenant SaaS Project Manager

A production-ready, enterprise-grade multi-tenant SaaS application for project and task management. Organizations can register, manage teams, create projects, and track tasks with complete data isolation and role-based access control.

![Multi-Tenant Architecture](https://img.shields.io/badge/Architecture-Multi--Tenant-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 🚀 Features

### Core Functionality

- **Multi-Tenancy**: Complete data isolation via `tenant_id` with row-level security
- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **Project Management**: Full CRUD operations for projects with status tracking
- **Task Management**: Create, assign, and track tasks with priority levels and due dates
- **Team Management**: Invite and manage team members with role assignments
- **Subscription Plans**: Tenant-based limits on users and projects (Free, Pro, Enterprise)
- **Super Admin Dashboard**: Platform-level management and tenant overview
- **Tenant Isolation**: Guaranteed data privacy between different organizations
- **Audit Logging**: Comprehensive logging of all critical actions

### User Roles

- **Super Admin**: Platform-level access, can manage all tenants
- **Tenant Admin**: Organization admin, can manage users and projects
- **User**: Regular team member, can view and contribute to projects

### Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- Cross-tenant access prevention

## 🛠 Technology Stack

### Frontend

- **React 18** with Vite for fast development
- **React Router** for navigation
- **Axios** for API communication
- **CSS Variables** for theming
- **Modern UI** with dark theme

### Backend

- **Node.js** with Express.js
- **PostgreSQL 15** for database
- **JWT** for authentication
- **bcrypt** for password hashing
- **Morgan** for logging
- **Helmet** for security headers
- **CORS** for cross-origin requests

### DevOps

- **Docker** & **Docker Compose** for containerization
- **Alpine Linux** base images for minimal size
- Health checks for container monitoring
- Volume persistence for database data

## 📋 Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/DuvvuLakshmiPrasanna/Multi-Tenant-Saas-Project-Manager.git
cd Multi-Tenant-Saas-Project-Manager
```

### 2. Start the Application

```bash
docker compose up -d
```

This will start three services:

- **Database**: PostgreSQL on port 5432
- **Backend**: Node.js API on port 5000
- **Frontend**: React app on port 3000

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### 4. Stop the Application

```bash
docker compose down
```

To remove all data including the database:

```bash
docker compose down -v
```

## 👥 Test Credentials

### Super Admin (Platform Level)

```
Email: superadmin@system.com
Password: Admin@123
Tenant Subdomain: (leave blank)
```

### Demo Company - Tenant Admin

```
Email: admin@demo.com
Password: Demo@123
Tenant Subdomain: demo
```

### Demo Company - Regular Users

```
User 1:
Email: user1@demo.com
Password: User@123
Tenant Subdomain: demo

User 2:
Email: user2@demo.com
Password: User@123
Tenant Subdomain: demo
```

## 🧪 Testing

### Run All Tests

```bash
npm install
node test_all_features.js
```

This will test:

- ✅ Authentication (all user types)
- ✅ Tenant registration and management
- ✅ User CRUD operations
- ✅ Project CRUD operations
- ✅ Task CRUD operations
- ✅ Authorization and permissions
- ✅ Cross-tenant isolation
- ✅ Subscription limits

### Run Verification Tests

```bash
node verify_system.js
```

## 📁 Project Structure

```
Multi-tenant-saas-project-manager-final/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/        # Auth & validation
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Helper functions
│   │   ├── app.js             # Express app setup
│   │   ├── db.js              # Database connection
│   │   └── server.js          # Server entry point
│   ├── migrations/            # Database migrations
│   ├── seeds/                 # Seed data
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/               # API client
│   │   ├── components/        # React components
│   │   ├── context/           # Context providers
│   │   ├── pages/             # Page components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── API.md                 # API documentation
│   ├── architecture.md        # Architecture details
│   ├── PRD.md                 # Product requirements
│   └── technical-spec.md      # Technical specifications
├── docker-compose.yml
├── test_all_features.js       # Comprehensive test suite
├── verify_system.js           # System verification
└── README.md
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register-tenant` - Register new tenant
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Tenants

- `GET /api/tenants` - List all tenants (Super Admin)
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant

### Users

- `GET /api/tenants/:tenantId/users` - List users
- `POST /api/tenants/:tenantId/users` - Create user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Projects

- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks

- `GET /api/projects/:projectId/tasks` - List tasks
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task

Full API documentation: [docs/API.md](docs/API.md)

## 🏗 Architecture

The application follows a three-tier architecture:

1. **Presentation Layer**: React frontend with responsive design
2. **Application Layer**: Express.js REST API with middleware
3. **Data Layer**: PostgreSQL database with multi-tenant schema

### Multi-Tenancy Implementation

- Row-Level Security using `tenant_id` in all tenant-scoped tables
- JWT tokens include tenant context
- Middleware enforces tenant isolation
- Database queries automatically filtered by tenant

See [docs/architecture.md](docs/architecture.md) for detailed architecture.

## 🔒 Security

- **Password Security**: bcrypt hashing with salt rounds
- **Authentication**: JWT tokens with expiration
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Parameterized queries prevent SQL injection
- **CORS**: Configured for allowed origins only
- **Headers**: Security headers via Helmet.js
- **Data Isolation**: Automatic tenant filtering in queries

## 🌟 Key Highlights

- ✅ **100% Docker-based** - No local setup required
- ✅ **Production-ready** - Health checks, logging, error handling
- ✅ **Scalable** - Horizontally scalable architecture
- ✅ **Secure** - Industry-standard security practices
- ✅ **Well-tested** - Comprehensive test suite included
- ✅ **Well-documented** - Complete API and architecture docs

## 📚 Additional Documentation

- [Product Requirements Document (PRD)](docs/PRD.md)
- [Technical Specifications](docs/technical-spec.md)
- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/API.md)
- [Research & Planning](docs/research.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Duvvu Lakshmi Prasanna

## 🙏 Acknowledgments

- Built with modern best practices for SaaS applications
- Implements multi-tenancy patterns for data isolation
- Follows RESTful API design principles
