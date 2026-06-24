const pool = require('../config/db');

const Message = {
  // Send a message
  async create(senderId, receiverId, content) {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [senderId, receiverId, content]
    );
    return result.rows[0];
  },

  // Get conversation between two users
  async getConversation(userId1, userId2) {
    const result = await pool.query(
      `SELECT m.*, 
       s.name AS sender_name,
       r.name AS receiver_name
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
       OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [userId1, userId2]
    );
    return result.rows;
  },
  
  // Get all conversations for a user
  async getConversations(userId) {
    const result = await pool.query(
      `SELECT
         CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
         u.name AS other_user_name,
         u.email AS other_user_email,
         m.content,
         m.created_at,
         (SELECT COUNT(*) FROM messages msg
          WHERE msg.receiver_id = $1
          AND msg.sender_id = (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
          AND msg.is_read = false) AS unread_count
       FROM messages m
       JOIN users u
         ON u.id = (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
       WHERE (m.sender_id = $1 OR m.receiver_id = $1)
       AND m.created_at = (
         SELECT MAX(m2.created_at)
         FROM messages m2
         WHERE (m2.sender_id = m.sender_id AND m2.receiver_id = m.receiver_id)
            OR (m2.sender_id = m.receiver_id AND m2.receiver_id = m.sender_id)
       )
       ORDER BY m.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  // Mark messages as read
  async markAsRead(senderId, receiverId) {
    await pool.query(
      `UPDATE messages 
       SET is_read = true 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [senderId, receiverId]
    );
  },

  // Get new messages since last poll
  async getNewMessages(userId, since) {
    const result = await pool.query(
      `SELECT m.*,
       s.name AS sender_name
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       WHERE m.receiver_id = $1
       AND m.created_at > $2
       ORDER BY m.created_at ASC`,
      [userId, since]
    );
    return result.rows;
  }
};

module.exports = Message;