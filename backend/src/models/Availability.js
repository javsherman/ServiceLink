const pool = require('../config/db');

const Availability = {
  async create(providerId, dayOfWeek, startTime, endTime) {
    const result = await pool.query(
      `INSERT INTO availability (provider_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (provider_id, day_of_week)
       DO UPDATE SET start_time = $3, end_time = $4, is_available = true
       RETURNING *`,
      [providerId, dayOfWeek, startTime, endTime]
    );
    return result.rows[0];
  },

  async findByProvider(providerId) {
    const result = await pool.query(
      `SELECT * FROM availability
       WHERE provider_id = $1
       ORDER BY CASE day_of_week
         WHEN 'monday' THEN 1
         WHEN 'tuesday' THEN 2
         WHEN 'wednesday' THEN 3
         WHEN 'thursday' THEN 4
         WHEN 'friday' THEN 5
         WHEN 'saturday' THEN 6
         WHEN 'sunday' THEN 7
       END`,
      [providerId]
    );
    return result.rows;
  },

  async checkAvailability(providerId, dayOfWeek, bookingTime) {
    const result = await pool.query(
      `SELECT * FROM availability
       WHERE provider_id = $1
       AND day_of_week = $2
       AND is_available = true
       AND start_time <= $3
       AND end_time >= $3`,
      [providerId, dayOfWeek, bookingTime]
    );
    return result.rows[0];
  },

  async toggleDay(providerId, dayOfWeek, isAvailable) {
    const result = await pool.query(
      `UPDATE availability
       SET is_available = $1
       WHERE provider_id = $2
       AND day_of_week = $3
       RETURNING *`,
      [isAvailable, providerId, dayOfWeek]
    );
    return result.rows[0];
  },

  async deleteDay(providerId, dayOfWeek) {
    await pool.query(
      `DELETE FROM availability WHERE provider_id = $1 AND day_of_week = $2`,
      [providerId, dayOfWeek]
    );
  }
};

module.exports = Availability;