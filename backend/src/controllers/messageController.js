const Message = require('../models/Message');

const messageController = {
  // Send a message
  async sendMessage(req, res) {
    try {
      const { receiverId, content } = req.body;

      if (!receiverId || !content) {
        return res.status(400).json({ message: 'Receiver and content are required' });
      }

      // Can't message yourself
      if (req.user.id === parseInt(receiverId)) {
        return res.status(400).json({ message: 'You cannot message yourself' });
      }

      const message = await Message.create(req.user.id, receiverId, content);

      res.status(201).json({
        message: 'Message sent successfully',
        data: message
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get conversation with a specific user
  async getConversation(req, res) {
    try {
      const otherUserId = req.params.userId;

      // Mark messages as read
      await Message.markAsRead(otherUserId, req.user.id);

      const messages = await Message.getConversation(req.user.id, otherUserId);

      res.json(messages);

    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get all conversations
  async getConversations(req, res) {
    try {
      const conversations = await Message.getConversations(req.user.id);
      res.json(conversations);

    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Poll for new messages (HTTP polling every 30 seconds)
  async pollMessages(req, res) {
    try {
      const since = req.query.since || new Date(Date.now() - 30000).toISOString();

      const messages = await Message.getNewMessages(req.user.id, since);

      res.json({
        timestamp: new Date().toISOString(),
        count: messages.length,
        messages
      });

    } catch (error) {
      console.error('Poll messages error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = messageController;