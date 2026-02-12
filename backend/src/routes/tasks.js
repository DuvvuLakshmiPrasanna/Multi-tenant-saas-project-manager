const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Task Routes mounted at /api usually
// But specific endpoints:
// POST /api/projects/:projectId/tasks
// GET /api/projects/:projectId/tasks
// PATCH /api/tasks/:taskId/status
// PUT /api/tasks/:taskId

// Because router is mounted at /api in app.js
// We use absolute paths here relative to mount point if we want mixed hierarchy
// OR we mount this router on multiple paths.

// Let's use specific matching.
// app.js has: app.use('/api', taskRoutes);

// Projects context
router.post('/projects/:projectId/tasks', taskController.createTask);
router.get('/projects/:projectId/tasks', taskController.listTasks);

// Direct Task context
router.patch('/tasks/:taskId/status', taskController.updateTaskStatus);
router.put('/tasks/:taskId', taskController.updateTask);
router.delete('/tasks/:taskId', taskController.deleteTask);

module.exports = router;
