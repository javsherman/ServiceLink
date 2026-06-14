const pool = require('../config/db');

const Notification = {
  // Create a notification
  async create(userId, title, message, type) {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, title, message, type]
    );
    return result.rows[0];
  },

  // Get all notifications for a user
  async findByUser(userId) {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  // Get unread notifications for a user
  async getUnread(userId) {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1 AND is_read = false
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  // Mark a notification as read
  async markAsRead(id, userId) {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0];
  },

  // Mark all notifications as read
  async markAllAsRead(userId) {
    await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
  },

  // Get unread count
  async getUnreadCount(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return result.rows[0];
  }
};

module.exports = Notification;