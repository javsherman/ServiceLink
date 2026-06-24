const pool = require('../config/db');

const Booking = {
  // Create a new booking
  async create(customerId, providerId, serviceDescription, bookingDate, bookingTime, notes) {
    const result = await pool.query(
      `INSERT INTO bookings 
       (customer_id, provider_id, service_description, booking_date, booking_time, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [customerId, providerId, serviceDescription, bookingDate, bookingTime, notes]
    );
    return result.rows[0];
  },

  // Check for conflicting bookings (prevent double booking)
  async checkConflict(providerId, bookingDate, bookingTime) {
    const result = await pool.query(
      `SELECT * FROM bookings 
       WHERE provider_id = $1 
       AND booking_date = $2 
       AND booking_time = $3
       AND status NOT IN ('rejected', 'cancelled')`,
      [providerId, bookingDate, bookingTime]
    );
    return result.rows[0];
  },

  // Get all bookings for a customer
  async findByCustomer(customerId) {
    const result = await pool.query(
      `SELECT b.*, 
       u.name AS provider_name, 
       u.email AS provider_email
       FROM bookings b
       JOIN users u ON b.provider_id = u.id
       WHERE b.customer_id = $1
       ORDER BY b.booking_date DESC`,
      [customerId]
    );
    return result.rows;
  },

  // Get all bookings for a provider
  async findByProvider(providerId) {
    const result = await pool.query(
      `SELECT b.*, 
       u.name AS customer_name, 
       u.email AS customer_email
       FROM bookings b
       JOIN users u ON b.customer_id = u.id
       WHERE b.provider_id = $1
       ORDER BY b.booking_date DESC`,
      [providerId]
    );
    return result.rows;
  },

  // Get a single booking by id
  async findById(id) {
    const result = await pool.query(
      `SELECT b.*, 
       c.name AS customer_name, 
       p.name AS provider_name
       FROM bookings b
       JOIN users c ON b.customer_id = c.id
       JOIN users p ON b.provider_id = p.id
       WHERE b.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Update booking status
  async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE bookings 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  },
  // Update booking status
  async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE bookings 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  },

  // Reschedule a booking — update date/time, reset to pending for re-confirmation
  async reschedule(id, bookingDate, bookingTime) {
    const result = await pool.query(
      `UPDATE bookings 
       SET booking_date = $1, 
           booking_time = $2, 
           status = 'pending', 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [bookingDate, bookingTime, id]
    );
    return result.rows[0];
  }
};

module.exports = Booking;