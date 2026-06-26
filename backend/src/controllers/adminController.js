const pool = require('../config/db');

const adminController = {
  // Get all users
  async getAllUsers(req, res) {
    try {
      const result = await pool.query(
        `SELECT id, name, email, role, created_at 
         FROM users 
         ORDER BY created_at DESC`
      );

      res.json({
        count: result.rows.length,
        users: result.rows
      });

    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete a user
  async deleteUser(req, res) {
    try {
      const result = await pool.query(
        `DELETE FROM users WHERE id = $1 RETURNING *`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get all bookings
  async getAllBookings(req, res) {
    try {
      const result = await pool.query(
        `SELECT b.*, 
         c.name AS customer_name,
         p.name AS provider_name
         FROM bookings b
         JOIN users c ON b.customer_id = c.id
         JOIN users p ON b.provider_id = p.id
         ORDER BY b.created_at DESC`
      );

      res.json({
        count: result.rows.length,
        bookings: result.rows
      });

    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get all listings
  async getAllListings(req, res) {
    try {
      const result = await pool.query(
        `SELECT l.*, u.name AS provider_name
         FROM listings l
         JOIN users u ON l.provider_id = u.id
         ORDER BY l.created_at DESC`
      );

      res.json({
        count: result.rows.length,
        listings: result.rows
      });

    } catch (error) {
      console.error('Get all listings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete a listing
  async deleteListing(req, res) {
    try {
      const result = await pool.query(
        `DELETE FROM listings WHERE id = $1 RETURNING *`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      res.json({ message: 'Listing deleted successfully' });

    } catch (error) {
      console.error('Delete listing error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get platform analytics
  async getAnalytics(req, res) {
    try {
      const totalUsers = await pool.query(`SELECT COUNT(*) FROM users`);
      const totalCustomers = await pool.query(`SELECT COUNT(*) FROM users WHERE role = 'customer'`);
      const totalProviders = await pool.query(`SELECT COUNT(*) FROM users WHERE role = 'provider'`);
      const totalBookings = await pool.query(`SELECT COUNT(*) FROM bookings`);
      const pendingBookings = await pool.query(`SELECT COUNT(*) FROM bookings WHERE status = 'pending'`);
      const confirmedBookings = await pool.query(`SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'`);
      const completedBookings = await pool.query(`SELECT COUNT(*) FROM bookings WHERE status = 'completed'`);
      const totalListings = await pool.query(`SELECT COUNT(*) FROM listings`);
      const totalReviews = await pool.query(`SELECT COUNT(*) FROM reviews`);
      const avgRating = await pool.query(`SELECT ROUND(AVG(rating), 1) AS average FROM reviews`);
      const totalMessages = await pool.query(`SELECT COUNT(*) FROM messages`);

      res.json({
        users: {
          total: parseInt(totalUsers.rows[0].count),
          customers: parseInt(totalCustomers.rows[0].count),
          providers: parseInt(totalProviders.rows[0].count)
        },
        bookings: {
          total: parseInt(totalBookings.rows[0].count),
          pending: parseInt(pendingBookings.rows[0].count),
          confirmed: parseInt(confirmedBookings.rows[0].count),
          completed: parseInt(completedBookings.rows[0].count)
        },
        listings: {
          total: parseInt(totalListings.rows[0].count)
        },
        reviews: {
          total: parseInt(totalReviews.rows[0].count),
          average_rating: avgRating.rows[0].average || 0
        },
        messages: {
          total: parseInt(totalMessages.rows[0].count)
        }
      });

    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  // Run a fairness simulation and compute Jain's Fairness Index.
  // Fires N searches from random Jamaica locations, tallies how often each
  // seeded provider lands in the top-K results, with and without the
  // new-provider boost, and returns Jain's index for each.
  async getFairness(req, res) {
    try {
      const Listing = require('../models/Listing');

      const N = 60;        // number of simulated searches (kept small for speed)
      const TOP_K = 5;     // top results counted as "shown"
      const CATEGORY = 'Plumbing';

      // Only count the controlled seed providers so the experiment is clean
      // (excludes any non-seed providers that would skew the result).
      const seedRes = await pool.query(
        `SELECT id, name FROM users WHERE email LIKE '%@seed.test'`
      );
      const seedNames = {};
      seedRes.rows.forEach((r) => { seedNames[r.id] = r.name; });
      const seedIds = new Set(seedRes.rows.map((r) => r.id));

      // Bounding box over populated Jamaica
      const B = { latMin: 17.85, latMax: 18.50, lngMin: -78.30, lngMax: -76.20 };
      const randCoord = () => ({
        lat: B.latMin + Math.random() * (B.latMax - B.latMin),
        lng: B.lngMin + Math.random() * (B.lngMax - B.lngMin),
      });

      const jain = (counts) => {
        const x = Object.values(counts);
        const n = x.length;
        if (n === 0) return 0;
        const sum = x.reduce((a, b) => a + b, 0);
        const sumSq = x.reduce((a, b) => a + b * b, 0);
        if (sumSq === 0) return 0;
        return (sum * sum) / (n * sumSq);
      };

      const simulate = async (applyBoost) => {
        const counts = {};
        // seed every known provider at 0 so all appear in the chart
        seedIds.forEach((id) => { counts[id] = 0; });

        for (let i = 0; i < N; i++) {
          const { lat, lng } = randCoord();
          const results = await Listing.search(CATEGORY, null, null, lat, lng, applyBoost);
          const topK = results.slice(0, TOP_K);
          for (const listing of topK) {
            if (seedIds.has(listing.provider_id)) {
              counts[listing.provider_id] += 1;
            }
          }
        }
        return counts;
      };

      const withoutCounts = await simulate(false);
      const withCounts = await simulate(true);

      const toRows = (counts) =>
        Object.keys(counts)
          .map((id) => ({ id: Number(id), name: seedNames[id], shown: counts[id] }))
          .sort((a, b) => b.shown - a.shown);

      res.json({
        searches: N,
        topK: TOP_K,
        category: CATEGORY,
        withoutBoost: { jain: jain(withoutCounts), providers: toRows(withoutCounts) },
        withBoost: { jain: jain(withCounts), providers: toRows(withCounts) },
      });

    } catch (error) {
      console.error('Get fairness error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  // Get all pending listings
async getPendingListings(req, res) {
  try {
    const Listing = require('../models/Listing');
    const listings = await Listing.findPending();

    res.json({
      count: listings.length,
      listings
    });

  } catch (error) {
    console.error('Get pending listings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
},

// Approve a listing
async approveListing(req, res) {
  try {
    const Listing = require('../models/Listing');
    const listing = await Listing.updateApprovalStatus(req.params.id, 'approved');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({
      message: 'Listing approved successfully',
      listing
    });

  } catch (error) {
    console.error('Approve listing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
},

// Decline a listing
async declineListing(req, res) {
  try {
    const Listing = require('../models/Listing');
    const listing = await Listing.updateApprovalStatus(req.params.id, 'declined');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({
      message: 'Listing declined',
      listing
    });

  } catch (error) {
    console.error('Decline listing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
};

module.exports = adminController;   