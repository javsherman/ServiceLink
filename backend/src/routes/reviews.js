const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// Submit a review (customers only)
router.post('/', authMiddleware, rbac('customer'), reviewController.createReview);

// Get all reviews for a provider
router.get('/provider/:providerId', authMiddleware, reviewController.getProviderReviews);

module.exports = router;