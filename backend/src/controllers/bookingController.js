const Booking = require('../models/Booking');

const bookingController = {
  // Create a new booking (customers only)
  async createBooking(req, res) {
    try {
      const { providerId, serviceDescription, bookingDate, bookingTime, notes } = req.body;

      // Check all required fields
      if (!providerId || !serviceDescription || !bookingDate || !bookingTime) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check for conflicts
      const conflict = await Booking.checkConflict(providerId, bookingDate, bookingTime);
      if (conflict) {
        return res.status(400).json({ message: 'This time slot is already booked' });
      }

      // Create the booking
      const booking = await Booking.create(
        req.user.id,
        providerId,
        serviceDescription,
        bookingDate,
        bookingTime,
        notes
      );

      res.status(201).json({
        message: 'Booking created successfully',
        booking
      });

    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get all bookings for the logged in user
  async getMyBookings(req, res) {
    try {
      let bookings;

      if (req.user.role === 'customer') {
        bookings = await Booking.findByCustomer(req.user.id);
      } else if (req.user.role === 'provider') {
        bookings = await Booking.findByProvider(req.user.id);
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(bookings);

    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get a single booking by id
  async getBookingById(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Make sure only the customer or provider can view it
      if (booking.customer_id !== req.user.id && booking.provider_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(booking);

    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Confirm a booking (providers only)
  async confirmBooking(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Only the provider can confirm
      if (booking.provider_id !== req.user.id) {
        return res.status(403).json({ message: 'Only the provider can confirm this booking' });
      }

      const updated = await Booking.updateStatus(req.params.id, 'confirmed');

      res.json({
        message: 'Booking confirmed successfully',
        booking: updated
      });

    } catch (error) {
      console.error('Confirm booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Reject a booking (providers only)
  async rejectBooking(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Only the provider can reject
      if (booking.provider_id !== req.user.id) {
        return res.status(403).json({ message: 'Only the provider can reject this booking' });
      }

      const updated = await Booking.updateStatus(req.params.id, 'rejected');

      res.json({
        message: 'Booking rejected',
        booking: updated
      });

    } catch (error) {
      console.error('Reject booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Cancel a booking (customers only)
  async cancelBooking(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Only the customer can cancel
      if (booking.customer_id !== req.user.id) {
        return res.status(403).json({ message: 'Only the customer can cancel this booking' });
      }

      const updated = await Booking.updateStatus(req.params.id, 'cancelled');

      res.json({
        message: 'Booking cancelled',
        booking: updated
      });

    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = bookingController;