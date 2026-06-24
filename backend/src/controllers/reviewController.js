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
  },
  // Edit a review (PUT /api/reviews/:id) — customers only, owner only
  async editReview(req, res) {
    try {
      const { rating, comment } = req.body;
      const reviewId = req.params.id;

      // Rating must be 1-5
      if (!rating) {
        return res.status(400).json({ message: 'Rating is required' });
      }
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      // Check review exists
      const existing = await Review.findById(reviewId);
      if (!existing) {
        return res.status(404).json({ message: 'Review not found' });
      }

      // Only the owner can edit
      if (existing.customer_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only edit your own review' });
      }

      const review = await Review.update(reviewId, req.user.id, rating, comment);

      res.json({
        message: 'Review updated successfully',
        review
      });

    } catch (error) {
      console.error('Edit review error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete a review (DELETE /api/reviews/:id) — customers only, owner only
  async deleteReview(req, res) {
    try {
      const reviewId = req.params.id;

      // Check review exists
      const existing = await Review.findById(reviewId);
      if (!existing) {
        return res.status(404).json({ message: 'Review not found' });
      }

      // Only the owner can delete
      if (existing.customer_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only delete your own review' });
      }

      await Review.delete(reviewId, req.user.id);

      res.json({ message: 'Review deleted successfully' });

    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
};

module.exports = reviewController;