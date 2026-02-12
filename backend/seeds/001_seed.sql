-- Clean existing data (for development only)
TRUNCATE TABLE audit_logs, tasks, projects, users, tenants CASCADE;

-- Seed Super Admin (Tenant ID is NULL) - matches submission.json
INSERT INTO users (id, tenant_id, email, password, full_name, role, is_active)
VALUES (
    'f0000000-0000-0000-0000-000000000001', 
    NULL, 
    'superadmin@system.com', 
    '$2b$10$QZsjPvqi7DGFK0mCLTmgY.EiIEw88o5TOlYS0Jwh/XBL7uffizVcq', -- Admin@123
    'Super Admin', 
    'super_admin', 
    true
);

-- Seed Demo Company Tenant - matches submission.json
INSERT INTO tenants (id, name, subdomain, status, plan, max_users, max_projects)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Demo Company',
    'demo',
    'active',
    'pro',
    25,
    15
);

-- Seed Demo Company Tenant Admin - matches submission.json
INSERT INTO users (id, tenant_id, email, password, full_name, role, is_active)
VALUES (
    'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@demo.com',
    '$2b$10$uQmtsVMR/.X5byLtCMh1Se3ZUOXSGbsFNCDhY0PjabG5X9NT.IkfO', -- Demo@123
    'Demo Admin',
    'tenant_admin',
    true
);

-- Seed Demo Company Regular Users - matches submission.json
INSERT INTO users (id, tenant_id, email, password, full_name, role, is_active)
VALUES 
(
    'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'user1@demo.com',
    '$2b$10$2mpb6222sD8Revd2JKStruiPrb7yopng8sVINkdJxhKvfwR7h4Zm6', -- User@123
    'User One',
    'user',
    true
),
(
    'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'user2@demo.com',
    '$2b$10$2mpb6222sD8Revd2JKStruiPrb7yopng8sVINkdJxhKvfwR7h4Zm6', -- User@123
    'User Two',
    'user',
    true
);

-- Seed Demo Company Projects - matches submission.json
INSERT INTO projects (id, tenant_id, name, description, status, created_by, created_at)
VALUES 
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Project Alpha',
    'First demo project',
    'active',
    'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Created by Demo Admin
    CURRENT_TIMESTAMP
),
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Project Beta',
    'Second demo project',
    'active',
    'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Created by Demo Admin
    CURRENT_TIMESTAMP
);

-- Seed Demo Company Tasks
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES 
(
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Project Alpha
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Demo Company
    'Design homepage mockup',
    'Create high-fidelity design for the new homepage',
    'todo',
    'high',
    'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Assigned to User One
    CURRENT_TIMESTAMP + INTERVAL '7 days'
),
(
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Project Alpha
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Demo Company
    'Implement authentication',
    'Set up JWT authentication system',
    'in_progress',
    'high',
    'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Assigned to User Two
    CURRENT_TIMESTAMP + INTERVAL '5 days'
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Project Beta
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Demo Company
    'Write API documentation',
    'Document all REST API endpoints',
    'todo',
    'medium',
    'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Assigned to User One
    CURRENT_TIMESTAMP + INTERVAL '10 days'
),
(
    'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Project Beta
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Demo Company
    'Set up CI/CD pipeline',
    'Configure automated testing and deployment',
    'completed',
    'medium',
    'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Assigned to User Two
    CURRENT_TIMESTAMP - INTERVAL '2 days'
);

-- Add audit log entries
INSERT INTO audit_logs (tenant_id, user_id, action, details)
VALUES 
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'CREATE_PROJECT',
    '{"projectId": "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "projectName": "Project Alpha"}'::jsonb
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'CREATE_PROJECT',
    '{"projectId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "projectName": "Project Beta"}'::jsonb
);
