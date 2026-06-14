const pool = require('../config/db');

const Review = {
  // Create a review
  async create(bookingId, customerId, providerId, rating, comment) {
    const result = await pool.query(
      `INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [bookingId, customerId, providerId, rating, comment]
    );
    return result.rows[0];
  },

  // Check if a review already exists for a booking
  async findByBooking(bookingId) {
    const result = await pool.query(
      `SELECT * FROM reviews WHERE booking_id = $1`,
      [bookingId]
    );
    return result.rows[0];
  },

  // Get all reviews for a provider
  async findByProvider(providerId) {
    const result = await pool.query(
      `SELECT r.*, u.name AS customer_name
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       WHERE r.provider_id = $1
       ORDER BY r.created_at DESC`,
      [providerId]
    );
    return result.rows;
  },

  // Get average rating for a provider
  async getAverageRating(providerId) {
    const result = await pool.query(
      `SELECT 
       COUNT(*) AS total_reviews,
       ROUND(AVG(rating), 1) AS average_rating
       FROM reviews
       WHERE provider_id = $1`,
      [providerId]
    );
    return result.rows[0];
  }
};

module.exports = Review;