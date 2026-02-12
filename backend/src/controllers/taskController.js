const { pool } = require('../db');

exports.createTask = async (req, res) => {
    // POST /api/projects/:projectId/tasks
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const { tenantId } = req.user;

    try {
        // Verify project existence & Tenant
        const projectRes = await pool.query('SELECT tenant_id FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });

        if (projectRes.rows[0].tenant_id !== tenantId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Validate Assigned User
        if (assignedTo) {
            const userCheck = await pool.query('SELECT tenant_id FROM users WHERE id = $1', [assignedTo]);
            if (userCheck.rows.length === 0 || userCheck.rows[0].tenant_id !== tenantId) {
                return res.status(400).json({ success: false, message: 'Assigned user does not belong to tenant' });
            }
        }

        // Get tenant_id from project for task creation
        const projectTenantId = projectRes.rows[0].tenant_id;

        const result = await pool.query(
            'INSERT INTO tasks (project_id, tenant_id, title, description, assigned_to, priority, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [projectId, projectTenantId, title, description, assignedTo, priority || 'medium', dueDate]
        );

        res.status(201).json({ success: true, data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error' });
    }
};

exports.listTasks = async (req, res) => {
    // GET /api/projects/:projectId/tasks
    const { projectId } = req.params;
    const { tenantId } = req.user;
    const { status, assignedTo, priority, search } = req.query;

    try {
        // Verify project
        const projectRes = await pool.query('SELECT tenant_id FROM projects WHERE id = $1', [projectId]);
        if (projectRes.rows.length === 0 || projectRes.rows[0].tenant_id !== tenantId) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        let query = `
            SELECT t.*, u.full_name as assignee_name, u.email as assignee_email
            FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.project_id = $1
        `;
        const params = [projectId];
        let idx = 2;

        if (status) { query += ` AND t.status = $${idx++}`; params.push(status); }
        if (priority) { query += ` AND t.priority = $${idx++}`; params.push(priority); }
        if (assignedTo) { query += ` AND t.assigned_to = $${idx++}`; params.push(assignedTo); }
        if (search) { query += ` AND t.title ILIKE $${idx++}`; params.push(`%${search}%`); }

        // Order by Priority (High->Low) then DueDate
        // Assuming Enum 'high', 'medium', 'low' -> we can use CASE for sorting if needed, or just standard sort
        query += ` ORDER BY 
            CASE 
                WHEN t.priority = 'high' THEN 1 
                WHEN t.priority = 'medium' THEN 2 
                WHEN t.priority = 'low' THEN 3 
                ELSE 4 
            END,
            t.due_date ASC
        `;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: {
                tasks: result.rows.map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    priority: t.priority,
                    assignedTo: t.assigned_to ? { id: t.assigned_to, fullName: t.assignee_name, email: t.assignee_email } : null,
                    dueDate: t.due_date,
                    createdAt: t.created_at
                })),
                total: result.rows.length
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error' });
    }
};

exports.updateTaskStatus = async (req, res) => {
    // PATCH /api/tasks/:taskId/status
    const { taskId } = req.params;
    const { status } = req.body;
    const { tenantId } = req.user;

    try {
        // Verify Task Ownership via Project -> Tenant
        const taskRes = await pool.query(`
            SELECT t.*, p.tenant_id 
            FROM tasks t 
            JOIN projects p ON t.project_id = p.id 
            WHERE t.id = $1
        `, [taskId]);

        if (taskRes.rows.length === 0 || taskRes.rows[0].tenant_id !== tenantId) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const result = await pool.query(
            'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, taskId]
        );

        res.json({ success: true, data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error' });
    }
};

exports.updateTask = async (req, res) => {
    // PUT /api/tasks/:taskId
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const { tenantId } = req.user;

    try {
        const taskRes = await pool.query(`
            SELECT t.*, p.tenant_id 
            FROM tasks t 
            JOIN projects p ON t.project_id = p.id 
            WHERE t.id = $1
        `, [taskId]);

        if (taskRes.rows.length === 0 || taskRes.rows[0].tenant_id !== tenantId) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Validate Assignee if changing
        if (assignedTo) {
            const userCheck = await pool.query('SELECT tenant_id FROM users WHERE id = $1', [assignedTo]);
            if (userCheck.rows.length === 0 || userCheck.rows[0].tenant_id !== tenantId) {
                return res.status(400).json({ success: false, message: 'Invalid assignee' });
            }
        }

        let query = 'UPDATE tasks SET updated_at = NOW()';
        const params = [];
        let idx = 1;

        if (title) { query += `, title = $${idx++}`; params.push(title); }
        if (description) { query += `, description = $${idx++}`; params.push(description); }
        if (status) { query += `, status = $${idx++}`; params.push(status); }
        if (priority) { query += `, priority = $${idx++}`; params.push(priority); }
        if (assignedTo !== undefined) {
            // Handle NULL (unassign)
            query += `, assigned_to = $${idx++}`;
            params.push(assignedTo);
        }
        if (dueDate !== undefined) { query += `, due_date = $${idx++}`; params.push(dueDate); }

        query += ` WHERE id = $${idx}`;
        params.push(taskId);
        query += ' RETURNING *';

        const result = await pool.query(query, params);

        // Fetch full data for response
        const updated = result.rows[0];
        // Could do a re-fetch join here if we need assignee name in response immediately, 
        // but frontend usually has list or can re-fetch.

        res.json({ success: true, message: 'Task updated', data: updated });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error' });
    }
};

exports.deleteTask = async (req, res) => {
    const { taskId } = req.params;
    const { tenantId } = req.user;

    try {
        const taskRes = await pool.query(`
            SELECT t.*, p.tenant_id 
            FROM tasks t 
            JOIN projects p ON t.project_id = p.id 
            WHERE t.id = $1
        `, [taskId]);

        if (taskRes.rows.length === 0 || taskRes.rows[0].tenant_id !== tenantId) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
        res.json({ success: true, message: 'Deleted' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error' });
    }
};
