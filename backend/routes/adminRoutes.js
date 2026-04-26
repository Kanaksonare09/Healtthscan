const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Public Admin Routes
router.post('/login', adminController.adminLogin);

// Protected Admin Routes (SuperAdmin Only)
router.get('/pending-users', authMiddleware('SuperAdmin'), adminController.getPendingUsers);
router.get('/all-users', authMiddleware('SuperAdmin'), adminController.getAllUsers);
router.get('/all-reports', authMiddleware('SuperAdmin'), adminController.getAllReports);
router.post('/approve-user', authMiddleware('SuperAdmin'), adminController.approveUser);
router.post('/reject-user', authMiddleware('SuperAdmin'), adminController.rejectUser);
router.post('/suspend-user', authMiddleware('SuperAdmin'), adminController.suspendUser);
router.post('/delete-user', authMiddleware('SuperAdmin'), adminController.deleteUser);
router.post('/delete-report', authMiddleware('SuperAdmin'), adminController.deleteReport);

module.exports = router;
