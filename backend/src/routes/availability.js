const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// Provider sets their own availability
router.post('/', authMiddleware, rbac('provider'), availabilityController.setAvailability);
router.get('/my', authMiddleware, rbac('provider'), availabilityController.getMyAvailability);
router.put('/toggle', authMiddleware, rbac('provider'), availabilityController.toggleDay);
router.delete('/:day', authMiddleware, rbac('provider'), availabilityController.deleteDay);

// Customers view a provider's availability
router.get('/:providerId', authMiddleware, availabilityController.getProviderAvailability);

module.exports = router;