const pool = require('../config/db');

const Profile = {
  // Create a profile
  async create(userId) {
    const result = await pool.query(
      'INSERT INTO profiles (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    return result.rows[0];
  },

  // Get profile by user id
  async findByUserId(userId) {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, 
       p.bio, p.phone, p.location, p.profile_image
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0];
  },

  // Update profile
  async update(userId, bio, phone, location) {
    const result = await pool.query(
      `INSERT INTO profiles (user_id, bio, phone, location)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET bio = $2, phone = $3, location = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, bio, phone, location]
    );
    return result.rows[0];
  }
};

module.exports = Profile;