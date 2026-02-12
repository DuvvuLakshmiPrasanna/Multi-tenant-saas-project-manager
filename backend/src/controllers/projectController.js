const { pool } = require('../db');

exports.createProject = async (req, res) => {
    const { name, description, status } = req.body;
    const { tenantId, userId } = req.user;

    if (!tenantId) return res.status(403).json({ success: false, message: 'Super admin cannot create projects directly' });

    try {
        // Check Limits
        const tenantRes = await pool.query('SELECT max_projects FROM tenants WHERE id = $1', [tenantId]);
        const maxProjects = tenantRes.rows[0].max_projects;
        const countRes = await pool.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);

        if (parseInt(countRes.rows[0].count) >= maxProjects) {
            return res.status(403).json({ success: false, message: 'Project limit reached' });
        }

        const result = await pool.query(
            'INSERT INTO projects (tenant_id, name, description, status, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [tenantId, name, description, status || 'active', userId]
        );

        res.status(201).json({
            success: true,
            data: {
                id: result.rows[0].id,
                tenantId: result.rows[0].tenant_id,
                name: result.rows[0].name,
                description: result.rows[0].description,
                status: result.rows[0].status,
                createdBy: result.rows[0].created_by,
                createdAt: result.rows[0].created_at
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.listProjects = async (req, res) => {
    const { tenantId } = req.user;
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
        SELECT p.*, u.full_name as creator_name, 
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_task_count
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.tenant_id = $1
    `;
    const params = [tenantId];
    let idx = 2;

    if (status) {
        query += ` AND p.status = $${idx++}`;
        params.push(status);
    }
    if (search) {
        query += ` AND p.name ILIKE $${idx++}`;
        params.push(`%${search}%`);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    params.push(limit, offset);

    try {
        const result = await pool.query(query, params);
        const countRes = await pool.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]);

        res.json({
            success: true,
            data: {
                projects: result.rows.map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    status: p.status,
                    createdBy: { id: p.created_by, fullName: p.creator_name },
                    taskCount: parseInt(p.task_count),
                    completedTaskCount: parseInt(p.completed_task_count),
                    createdAt: p.created_at
                })),
                total: parseInt(countRes.rows[0].count),
                pagination: { currentPage: parseInt(page), limit: parseInt(limit) }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getProject = async (req, res) => {
    const { projectId } = req.params;
    const { tenantId } = req.user;

    try {
        const result = await pool.query('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, tenantId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error' });
    }
};

exports.updateProject = async (req, res) => {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const { tenantId, userId, role } = req.user;

    try {
        const check = await pool.query('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, tenantId]);
        if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });

        const project = check.rows[0];
        if (role !== 'tenant_admin' && project.created_by !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        let query = 'UPDATE projects SET updated_at = NOW()';
        const params = [];
        let idx = 1;
        if (name) { query += `, name = $${idx++}`; params.push(name); }
        if (description) { query += `, description = $${idx++}`; params.push(description); }
        if (status) { query += `, status = $${idx++}`; params.push(status); }

        query += ` WHERE id = $${idx}`;
        params.push(projectId);
        query += ' RETURNING *';

        const result = await pool.query(query, params);
        res.json({ success: true, message: 'Updated', data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error' });
    }
};

exports.deleteProject = async (req, res) => {
    const { projectId } = req.params;
    const { tenantId, userId, role } = req.user;

    try {
        const check = await pool.query('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, tenantId]);
        if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });

        const project = check.rows[0];
        if (role !== 'tenant_admin' && project.created_by !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
        res.json({ success: true, message: 'Project deleted' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error' });
    }
};
