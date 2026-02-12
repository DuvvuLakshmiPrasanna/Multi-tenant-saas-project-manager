-- Seed Super Admin (Tenant ID is NULL)
INSERT INTO users (id, tenant_id, email, password, full_name, role, is_active)
VALUES (
    uuid_generate_v4(), 
    NULL, 
    'super@admin.com', 
    '$2b$10$z0Uyt2adTrFX2gZBAG4Iv.vSEVKL4mKKb.2RyYy7l9dZRzAKsHuPZW', 
    'Super Admin', 
    'super_admin', 
    true
);

-- Seed Tenant
INSERT INTO tenants (id, name, subdomain, plan, max_users, max_projects)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Tech Corp',
    'tech',
    'pro',
    25,
    15
);

-- Seed Tenant Admin
INSERT INTO users (id, tenant_id, email, password, full_name, role)
VALUES (
    uuid_generate_v4(),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@tech.com',
    '$2b$10$z0Uyt2adTrFX2gZBAG4Iv.vSEVKL4mKKb.2RyYy7l9dZRzAKsHuPZW', -- Password: password123
    'Tech Admin',
    'tenant_admin'
);
