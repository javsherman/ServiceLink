const pool = require('../config/db');

const Listing = {
  // Create a new listing
  async create(providerId, title, description, category, price, location) {
    const result = await pool.query(
      `INSERT INTO listings 
       (provider_id, title, description, category, price, location) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [providerId, title, description, category, price, location]
    );
    return result.rows[0];
  },

  // Get all listings (with optional search filters)
  async search(category, location) {
    let query = `
      SELECT l.*, u.name AS provider_name, u.email AS provider_email
      FROM listings l
      JOIN users u ON l.provider_id = u.id
      WHERE l.is_available = true
    `;
    const params = [];

    if (category) {
      params.push(`%${category}%`);
      query += ` AND LOWER(l.category) LIKE LOWER($${params.length})`;
    }

    if (location) {
      params.push(`%${location}%`);
      query += ` AND LOWER(l.location) LIKE LOWER($${params.length})`;
    }

    query += ` ORDER BY l.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Get a single listing by id
  async findById(id) {
    const result = await pool.query(
      `SELECT l.*, u.name AS provider_name, u.email AS provider_email
       FROM listings l
       JOIN users u ON l.provider_id = u.id
       WHERE l.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Get all listings by a provider
  async findByProvider(providerId) {
    const result = await pool.query(
      `SELECT * FROM listings WHERE provider_id = $1 ORDER BY created_at DESC`,
      [providerId]
    );
    return result.rows;
  },

  // Update a listing
  async update(id, title, description, category, price, location, isAvailable) {
    const result = await pool.query(
      `UPDATE listings 
       SET title = $1, description = $2, category = $3, 
           price = $4, location = $5, is_available = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING *`,
      [title, description, category, price, location, isAvailable, id]
    );
    return result.rows[0];
  },

  // Delete a listing
  async delete(id) {
    await pool.query('DELETE FROM listings WHERE id = $1', [id]);
  }
};

module.exports = Listing;