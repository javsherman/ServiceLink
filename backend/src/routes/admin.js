const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// All admin routes require authentication and admin role
router.get('/users', authMiddleware, rbac('admin'), adminController.getAllUsers);
router.delete('/users/:id', authMiddleware, rbac('admin'), adminController.deleteUser);
router.get('/bookings', authMiddleware, rbac('admin'), adminController.getAllBookings);
router.get('/listings', authMiddleware, rbac('admin'), adminController.getAllListings);
router.delete('/listings/:id', authMiddleware, rbac('admin'), adminController.deleteListing);
router.get('/analytics', authMiddleware, rbac('admin'), adminController.getAnalytics);

module.exports = router;