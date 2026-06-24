const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// All routes require authentication
router.post('/', authMiddleware, rbac('customer'), bookingController.createBooking);
router.get('/my', authMiddleware, rbac('customer', 'provider'), bookingController.getMyBookings);
router.get('/:id', authMiddleware, bookingController.getBookingById);
router.put('/:id/confirm', authMiddleware, rbac('provider'), bookingController.confirmBooking);
router.put('/:id/reject', authMiddleware, rbac('provider'), bookingController.rejectBooking);
router.put('/:id/cancel', authMiddleware, rbac('customer'), bookingController.cancelBooking);
router.put('/:id/complete', authMiddleware, rbac('provider'), bookingController.completeBooking);
// Reschedule a booking (customers only)
router.put('/:id/reschedule', authMiddleware, rbac('customer'), bookingController.rescheduleBooking);

module.exports = router;