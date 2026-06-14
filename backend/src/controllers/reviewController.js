const Review = require('../models/Review');
const Booking = require('../models/Booking');

const reviewController = {
  // Create a review (customers only)
  async createReview(req, res) {
    try {
      const { bookingId, rating, comment } = req.body;

      // Check all required fields
      if (!bookingId || !rating) {
        return res.status(400).json({ message: 'Booking ID and rating are required' });
      }

      // Rating must be 1-5
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      // Check booking exists
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Only the customer of that booking can review
      if (booking.customer_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only review your own bookings' });
      }

      // Booking must be completed to review
      if (booking.status !== 'completed') {
        return res.status(400).json({ message: 'You can only review completed bookings' });
      }

      // Check review doesn't already exist
      const existing = await Review.findByBooking(bookingId);
      if (existing) {
        return res.status(400).json({ message: 'You have already reviewed this booking' });
      }

      const review = await Review.create(
        bookingId,
        req.user.id,
        booking.provider_id,
        rating,
        comment
      );

      res.status(201).json({
        message: 'Review submitted successfully',
        review
      });

    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get all reviews for a provider
  async getProviderReviews(req, res) {
    try {
      const reviews = await Review.findByProvider(req.params.providerId);
      const stats = await Review.getAverageRating(req.params.providerId);

      res.json({
        provider_id: req.params.providerId,
        average_rating: stats.average_rating || 0,
        total_reviews: stats.total_reviews,
        reviews
      });

    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = reviewController;