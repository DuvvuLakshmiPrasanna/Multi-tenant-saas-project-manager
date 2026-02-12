const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register-tenant', authController.registerTenant);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);
// router.post('/logout', authController.logout); // Optional: if implementing logout logic

module.exports = router;
