const { pool } = require('../db');

exports.getTenant = async (req, res) => {
    const { tenantId } = req.params;

    // Authorization check
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const tenantRes = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        if (tenantRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }
        const tenant = tenantRes.rows[0];

        // Get Stats
        const usersCount = await pool.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
        const projectsCount = await pool.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);
        const tasksCount = await pool.query(
            'SELECT COUNT(t.id) FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.tenant_id = $1',
            [tenantId]
        );

        res.json({
            success: true,
            data: {
                id: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain,
                status: tenant.status,
                subscriptionPlan: tenant.plan,
                maxUsers: tenant.max_users,
                maxProjects: tenant.max_projects,
                createdAt: tenant.created_at,
                stats: {
                    totalUsers: parseInt(usersCount.rows[0].count),
                    totalProjects: parseInt(projectsCount.rows[0].count),
                    totalTasks: parseInt(tasksCount.rows[0].count)
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.updateTenant = async (req, res) => {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

    // Authorization: Only Super Admin or Tenant Admin
    if (req.user.role !== 'super_admin' && (req.user.role !== 'tenant_admin' || req.user.tenantId !== tenantId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Tenant Admin can ONLY update name
    if (req.user.role === 'tenant_admin') {
        if (status || subscriptionPlan || maxUsers || maxProjects) {
            return res.status(403).json({ success: false, message: 'Tenant Admin can only update name' });
        }
    }

    try {
        // Audit Log would go here

        // Dynamic update query
        let query = 'UPDATE tenants SET updated_at = NOW()';
        const params = [];
        let idx = 1;

        if (name) {
            query += `, name = $${idx++}`;
            params.push(name);
        }

        if (req.user.role === 'super_admin') {
            if (status) { query += `, status = $${idx++}`; params.push(status); }
            if (subscriptionPlan) { query += `, plan = $${idx++}`; params.push(subscriptionPlan); }
            if (maxUsers) { query += `, max_users = $${idx++}`; params.push(maxUsers); }
            if (maxProjects) { query += `, max_projects = $${idx++}`; params.push(maxProjects); }
        }

        query += ` WHERE id = $${idx}`;
        params.push(tenantId);

        query += ' RETURNING *';

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        res.json({
            success: true,
            message: 'Tenant updated successfully',
            data: result.rows[0] // ideally transform to camelCase
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Update failed' });
    }
};

exports.listTenants = async (req, res) => {
    // Super Admin only
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const tenantsRes = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const countRes = await pool.query('SELECT COUNT(*) FROM tenants');

        const tenants = tenantsRes.rows.map(t => ({
            id: t.id,
            name: t.name,
            subdomain: t.subdomain,
            status: t.status,
            subscriptionPlan: t.plan
        }));

        res.json({
            success: true,
            data: {
                tenants,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(countRes.rows[0].count / limit),
                    totalTenants: parseInt(countRes.rows[0].count),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
