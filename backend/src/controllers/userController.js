const bcrypt = require('bcrypt');
const { pool } = require('../db');

exports.addUser = async (req, res) => {
    // Tenant Admin only
    const { tenantId } = req.params; // From URL: /api/tenants/:tenantId/users OR context?
    // Spec says: POST /api/tenants/:tenantId/users

    if (req.user.role !== 'tenant_admin' || req.user.tenantId !== tenantId) {
        if (req.user.role !== 'super_admin') { // Allowing super admin too? Spec says tenant_admin only usually.
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
    }

    const { email, password, fullName, role } = req.body;

    try {
        // 1. Check Limits
        const tenantRes = await pool.query('SELECT plan, max_users FROM tenants WHERE id = $1', [tenantId]);
        const tenant = tenantRes.rows[0];
        const userCountRes = await pool.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]);
        const currentUsers = parseInt(userCountRes.rows[0].count);

        if (currentUsers >= tenant.max_users) {
            return res.status(403).json({ success: false, message: 'Subscription user limit reached' });
        }

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create User
        const newUserRes = await pool.query(
            'INSERT INTO users (tenant_id, email, password, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [tenantId, email, hashedPassword, fullName, role || 'user']
        );

        const newUser = newUserRes.rows[0];

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: newUser.id,
                email: newUser.email,
                fullName: newUser.full_name,
                role: newUser.role,
                tenantId: newUser.tenant_id,
                isActive: newUser.is_active,
                createdAt: newUser.created_at
            }
        });

    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ success: false, message: 'Email already exists in this tenant' });
        }
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.listUsers = async (req, res) => {
    // Spec: GET /api/tenants/:tenantId/users
    const { tenantId } = req.params;

    // Auth Check
    if (req.user.tenantId !== tenantId && req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { page = 1, limit = 50, search, role } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE tenant_id = $1';
        let countQuery = 'SELECT COUNT(*) FROM users WHERE tenant_id = $1';
        const params = [tenantId];
        let paramIdx = 2;

        if (search) {
            query += ` AND (email ILIKE $${paramIdx} OR full_name ILIKE $${paramIdx})`;
            countQuery += ` AND (email ILIKE $${paramIdx} OR full_name ILIKE $${paramIdx})`;
            params.push(`%${search}%`);
            paramIdx++;
        }

        if (role) {
            query += ` AND role = $${paramIdx}`;
            countQuery += ` AND role = $${paramIdx}`;
            params.push(role);
            paramIdx++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
        const queryParams = [...params, limit, offset];

        const usersRes = await pool.query(query, queryParams);
        const countRes = await pool.query(countQuery, params); // Use original params without limit/offset

        res.json({
            success: true,
            data: {
                users: usersRes.rows.map(u => ({
                    id: u.id,
                    email: u.email,
                    fullName: u.full_name,
                    role: u.role,
                    isActive: u.is_active,
                    createdAt: u.created_at
                })),
                total: parseInt(countRes.rows[0].count),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(countRes.rows[0].count / limit),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.updateUser = async (req, res) => {
    // PUT /api/users/:userId
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;

    try {
        // Get target user to check tenant
        const targetUserRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (targetUserRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        const targetUser = targetUserRes.rows[0];

        // Auth: 
        // 1. Tenant Admin of the same tenant
        // 2. Self (can only update fullName)

        const isSelf = req.user.userId === userId;
        const isTenantAdmin = req.user.role === 'tenant_admin' && req.user.tenantId === targetUser.tenant_id;
        const isSuperAdmin = req.user.role === 'super_admin';

        if (!isSelf && !isTenantAdmin && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Restriction: Only admin can update role/active
        if (!isTenantAdmin && !isSuperAdmin) {
            if (role || isActive !== undefined) {
                return res.status(403).json({ success: false, message: 'Unauthorized to update role/status' });
            }
        }

        let query = 'UPDATE users SET updated_at = NOW()';
        const params = [];
        let idx = 1;

        if (fullName) { query += `, full_name = $${idx++}`; params.push(fullName); }
        if (role && (isTenantAdmin || isSuperAdmin)) { query += `, role = $${idx++}`; params.push(role); }
        if (isActive !== undefined && (isTenantAdmin || isSuperAdmin)) { query += `, is_active = $${idx++}`; params.push(isActive); }

        query += ` WHERE id = $${idx}`;
        params.push(userId);
        query += ' RETURNING *';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                id: result.rows[0].id,
                fullName: result.rows[0].full_name,
                role: result.rows[0].role,
                updatedAt: result.rows[0].updated_at
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.deleteUser = async (req, res) => {
    // DELETE /api/users/:userId
    const { userId } = req.params;

    try {
        const targetUserRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (targetUserRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        const targetUser = targetUserRes.rows[0];

        if (req.user.role !== 'tenant_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (req.user.role === 'tenant_admin' && req.user.tenantId !== targetUser.tenant_id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (req.user.userId === userId) {
            return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
        }

        // Set tasks to NULL before delete (handled by DB constraint ON DELETE SET NULL usually, or we do it manually)
        // Schema: assigned_to UUID REFERENCES users(id) ON DELETE SET NULL

        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        res.json({ success: true, message: 'User deleted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
