const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth');

// All profile routes require authentication
router.get('/me', authMiddleware, profileController.getProfile);
router.put('/me', authMiddleware, profileController.updateProfile);
router.get('/:id', authMiddleware, profileController.getProfileById);

module.exports = router;