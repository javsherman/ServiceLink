const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.post('/', authMiddleware, messageController.sendMessage);
router.get('/conversations', authMiddleware, messageController.getConversations);
router.get('/poll', authMiddleware, messageController.pollMessages);
router.get('/:userId', authMiddleware, messageController.getConversation);

module.exports = router;