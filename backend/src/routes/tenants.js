const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken); // All tenant routes required auth

router.get('/', tenantController.listTenants);
router.get('/:tenantId', tenantController.getTenant);
router.put('/:tenantId', tenantController.updateTenant);

// User Handling Nested Routes
const userController = require('../controllers/userController');
router.get('/:tenantId/users', userController.listUsers);
router.post('/:tenantId/users', userController.addUser);

module.exports = router;
