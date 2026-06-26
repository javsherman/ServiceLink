const pool = require('../config/db');

const Listing = {
  // Create a new listing
  async create(providerId, title, description, category, price, location, latitude, longitude) {
    const result = await pool.query(
      `INSERT INTO listings 
       (provider_id, title, description, category, price, location, latitude, longitude) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [providerId, title, description, category, price, location, latitude, longitude]
    );
    return result.rows[0];
  },

  // Get all listings (with optional search filters + optional location ranking)
  // If lat & lng are provided, results include a distance_km column.
  // applyBoost (default true) puts new providers (<30 days) first; when false,
  // results are ordered by distance only (used for fairness comparison).
  async search(category, location, keyword, lat, lng, applyBoost = true) {
    const hasCoords =
      lat !== undefined && lat !== null && lat !== '' &&
      lng !== undefined && lng !== null && lng !== '';

    const params = [];
    let distanceSelect = '';

    if (hasCoords) {
      // $1 = customer latitude, $2 = customer longitude
      params.push(lat, lng);
      distanceSelect = `,
        6371 * acos(
          cos(radians($1)) * cos(radians(l.latitude)) *
          cos(radians(l.longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(l.latitude))
        ) AS distance_km,
        CASE WHEN (NOW() - u.created_at) < INTERVAL '30 days'
             THEN 1 ELSE 0 END AS new_provider_boost`;
    }

    let query = `
      SELECT l.*, u.name AS provider_name, u.email AS provider_email${distanceSelect}
      FROM listings l
      JOIN users u ON l.provider_id = u.id
      WHERE l.is_available = true
      AND l.approval_status = 'approved'
    `;

    if (hasCoords) {
      // Only rank listings that actually have coordinates
      query += ` AND l.latitude IS NOT NULL AND l.longitude IS NOT NULL`;
    }

    if (category) {
      params.push(`%${category}%`);
      query += ` AND LOWER(l.category) LIKE LOWER($${params.length})`;
    }

    if (location) {
      params.push(`%${location}%`);
      query += ` AND LOWER(l.location) LIKE LOWER($${params.length})`;
    }

    if (keyword) {
      params.push(`%${keyword}%`);
      query += ` AND (LOWER(l.title) LIKE LOWER($${params.length}) 
                 OR LOWER(l.description) LIKE LOWER($${params.length}))`;
    }

    if (hasCoords) {
      if (applyBoost) {
        // New providers first, then closest
        query += ` ORDER BY new_provider_boost DESC, distance_km ASC`;
      } else {
        // Distance only (no fairness boost)
        query += ` ORDER BY distance_km ASC`;
      }
    } else {
      query += ` ORDER BY l.created_at DESC`;
    }

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
  async update(id, title, description, category, price, location, isAvailable, latitude, longitude) {
    const result = await pool.query(
      `UPDATE listings 
       SET title = $1, description = $2, category = $3, 
           price = $4, location = $5, is_available = $6,
           latitude = $7, longitude = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 
       RETURNING *`,
      [title, description, category, price, location, isAvailable, latitude, longitude, id]
    );
    return result.rows[0];
  },

  // Delete a listing
  async delete(id) {
    await pool.query('DELETE FROM listings WHERE id = $1', [id]);
  },

  // Get all pending listings (admin only)
  async findPending() {
    const result = await pool.query(
      `SELECT l.*, u.name AS provider_name, u.email AS provider_email
      FROM listings l
      JOIN users u ON l.provider_id = u.id
      WHERE l.approval_status = 'pending'
      ORDER BY l.created_at DESC`
    );
    return result.rows;
  },

  // Update approval status
  async updateApprovalStatus(id, status) {
    const result = await pool.query(
      `UPDATE listings 
      SET approval_status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

};

module.exports = Listing;

