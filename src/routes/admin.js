const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const requireAdmin = require('../middlewares/requireAdmin');

/**
 * Admin Routes
 * All routes require admin authentication
 */

// Apply admin middleware to all routes
router.use(requireAdmin);

// Dashboard
router.get('/', adminController.showDashboard);
router.get('/dashboard', adminController.showDashboard);

// User Management
router.get('/users', adminController.showUsers);
router.get('/users/:id/edit', adminController.showEditUser);
router.post('/users/:id/edit', adminController.updateUser);
router.post('/users/:id/role', adminController.updateUserRole);
router.post('/users/:id/toggle-active', adminController.toggleUserActive);
router.post('/users/:id/ban', adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);
router.post('/users/:id/delete', adminController.deleteUser);

// Thread Management
router.get('/threads', adminController.showThreads);

module.exports = router;
