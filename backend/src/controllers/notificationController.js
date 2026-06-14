const Notification = require('../models/Notification');

const notificationController = {
  // Get all notifications for logged in user
  async getNotifications(req, res) {
    try {
      const notifications = await Notification.findByUser(req.user.id);
      const unreadCount = await Notification.getUnreadCount(req.user.id);

      res.json({
        unread_count: parseInt(unreadCount.unread_count),
        notifications
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get only unread notifications
  async getUnread(req, res) {
    try {
      const notifications = await Notification.getUnread(req.user.id);

      res.json({
        count: notifications.length,
        notifications
      });

    } catch (error) {
      console.error('Get unread error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Mark one notification as read
  async markAsRead(req, res) {
    try {
      const notification = await Notification.markAsRead(req.params.id, req.user.id);

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json({
        message: 'Notification marked as read',
        notification
      });

    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      await Notification.markAllAsRead(req.user.id);

      res.json({ message: 'All notifications marked as read' });

    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = notificationController;