const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

exports.registerTenant = async (req, res) => {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if subdomain exists
        const subdomainCheck = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
        if (subdomainCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, message: 'Subdomain already exists' });
        }

        // Check if email exists in this new tenant context (it won't, but maybe globally for admin?)
        // Actually email needs to be unique per tenant. Since it's a new tenant, it's fine.

        // Create Tenant
        const tenantRes = await client.query(
            'INSERT INTO tenants (name, subdomain, plan, max_users, max_projects) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [tenantName, subdomain, 'free', 5, 3]
        );
        const tenant = tenantRes.rows[0];

        // Hash Password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create Admin User
        const userRes = await client.query(
            'INSERT INTO users (tenant_id, email, password, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [tenant.id, adminEmail, hashedPassword, adminFullName, 'tenant_admin']
        );
        const user = userRes.rows[0];

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Tenant registered successfully',
            data: {
                tenantId: tenant.id,
                subdomain: tenant.subdomain,
                adminUser: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role
                }
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
    } finally {
        client.release();
    }
};

exports.login = async (req, res) => {
    const { email, password, tenantSubdomain } = req.body; // or tenantId? The prompt says tenantSubdomain OR tenantId

    try {
        let tenantId;

        if (tenantSubdomain) {
            const tenantRes = await pool.query('SELECT id, status FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
            if (tenantRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Tenant not found' });
            }
            if (tenantRes.rows[0].status !== 'active') {
                return res.status(403).json({ success: false, message: 'Tenant is not active' });
            }
            tenantId = tenantRes.rows[0].id;
        } else {
            // If logging in as super admin, tenantSubdomain might be null or handled differently.
            // Prompt says "Super Admin Exception: Super admin users have tenant_id as NULL".
            // If no tenantSubdomain provided, check for super admin in global context?
            // Actually, prompt says super admin has tenant_id NULL.
            // If email is superadmin, we might skip tenant check or check specifically for NULL tenant_id.
            // Let's first try to find user by email.
        }

        // Find user by email first
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        // Authorization Check
        // 1. If tenant context exists (subdomain provided)
        if (tenantId) {
            // User must belong to this tenant OR be a super_admin
            if (user.tenant_id !== tenantId && user.role !== 'super_admin') {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        }
        // 2. If no tenant context (platform login)
        else {
            // Only super_admin can login without tenant context (or maybe platform level users if any)
            // For now, strict:
            if (user.role !== 'super_admin') {
                return res.status(401).json({ success: false, message: 'Tenant domain required' });
            }
        }

        // Check if user is active

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Account suspended' });
        }

        // Verify Password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenant_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    tenantId: user.tenant_id
                },
                token,
                expiresIn: 86400
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

exports.getMe = async (req, res) => {
    try {
        // req.user contains userId, tenantId, role from token
        const userRes = await pool.query('SELECT id, email, full_name, role, tenant_id, is_active FROM users WHERE id = $1', [req.user.userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const user = userRes.rows[0];

        // Fetch tenant details if not super admin
        let tenant = null;
        if (user.tenant_id) {
            const tenantRes = await pool.query('SELECT id, name, subdomain, plan, max_users, max_projects FROM tenants WHERE id = $1', [user.tenant_id]);
            if (tenantRes.rows.length > 0) {
                tenant = tenantRes.rows[0];
                // map db columns to camelCase for consistency if needed, strictly following spec
                tenant = {
                    id: tenant.id,
                    name: tenant.name,
                    subdomain: tenant.subdomain,
                    subscriptionPlan: tenant.plan,
                    maxUsers: tenant.max_users,
                    maxProjects: tenant.max_projects
                };
            }
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                isActive: user.is_active,
                tenant
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
};
