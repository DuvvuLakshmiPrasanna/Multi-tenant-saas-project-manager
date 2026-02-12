const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// User CRUD
router.put('/:userId', userController.updateUser);
router.delete('/:userId', userController.deleteUser); // Make sure this matches app.js mount point /api/users

// Note: Create and List are under /api/tenants/:tenantId/users as per spec
// But we need to define them. 
// A common pattern is mounting tenant routes that include user sub-routes?
// Or we can handle it here if we mount this router at /api/tenants/:tenantId/users? No that complicates it.
// Let's go back to app.js. 
// Mounts:
// app.use('/api/tenants', tenantRoutes);
// app.use('/api/users', userRoutes);

// So for /api/tenants/:tenantId/users, we should add that to tenantRoutes!
// I will modify tenantRoutes next.

module.exports = router;
