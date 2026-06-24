const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Availability = require('../models/Availability');

const bookingController = {
  // Create a new booking (customers only)
  async createBooking(req, res) {
    try {
      const { providerId, serviceDescription, bookingDate, bookingTime, notes } = req.body;

      if (!providerId || !serviceDescription || !bookingDate || !bookingTime) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if provider has set any availability
      const providerAvailability = await Availability.findByProvider(providerId);
      if (providerAvailability.length === 0) {
        return res.status(400).json({
          message: 'This provider has not set their availability yet'
        });
      }

      // Check provider availability for that day and time
      const bookingDayOfWeek = new Date(bookingDate)
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();

      const isAvailable = await Availability.checkAvailability(
        providerId,
        bookingDayOfWeek,
        bookingTime
      );

      if (!isAvailable) {
        return res.status(400).json({
          message: `Provider is not available on ${bookingDayOfWeek} at ${bookingTime}. Please choose another time.`
        });
      }

      // Check for double booking conflicts
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

      // Notify the provider
      await Notification.create(
        providerId,
        'New Booking Request',
        `You have a new booking request for ${serviceDescription} on ${bookingDate} at ${bookingTime}`,
        'new_booking'
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

      if (booking.provider_id !== req.user.id) {
        return res.status(403).json({ message: 'Only the provider can confirm this booking' });
      }

      const updated = await Booking.updateStatus(req.params.id, 'confirmed');

      await Notification.create(
        booking.customer_id,
        'Booking Confirmed',
        `Your booking for ${booking.service_description} on ${booking.booking_date} has been confirmed!`,
        'booking_confirmed'
      );

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

      if (booking.provider_id !== req.user.id) {
        return res.status(403).json({ message: 'Only the provider can reject this booking' });
      }

      const updated = await Booking.updateStatus(req.params.id, 'rejected');

      await Notification.create(
        booking.customer_id,
        'Booking Rejected',
        `Your booking for ${booking.service_description} on ${booking.booking_date} was rejected.`,
        'booking_rejected'
      );

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

      if (booking.customer_id !== req.user.id) {
        return res.status(403).json({ message: 'Only the customer can cancel this booking' });
      }

      const updated = await Booking.updateStatus(req.params.id, 'cancelled');

      await Notification.create(
        booking.provider_id,
        'Booking Cancelled',
        `The booking for ${booking.service_description} on ${booking.booking_date} has been cancelled.`,
        'booking_cancelled'
      );

      res.json({
        message: 'Booking cancelled',
        booking: updated
      });

    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  // Complete a booking (providers only)
  async completeBooking(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (booking.provider_id !== req.user.id) {
        return res.status(403).json({ message: 'Only the provider can complete this booking' });
      }

      // Only a confirmed booking can be completed
      if (booking.status !== 'confirmed') {
        return res.status(400).json({ message: 'Only confirmed bookings can be marked complete' });
      }

      const updated = await Booking.updateStatus(req.params.id, 'completed');

      await Notification.create(
        booking.customer_id,
        'Service Completed',
        `Your booking for ${booking.service_description} has been completed. You can now leave a review.`,
        'booking_confirmed'
      );

      res.json({
        message: 'Booking marked as completed',
        booking: updated
      });

    } catch (error) {
      console.error('Complete booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  // Reschedule a booking (PUT /api/bookings/:id/reschedule) — customers only, owner only
  async rescheduleBooking(req, res) {
    try {
      const bookingId = req.params.id;
      const { booking_date, booking_time } = req.body;

      // Required fields
      if (!booking_date || !booking_time) {
        return res.status(400).json({ message: 'New date and time are required' });
      }

      // Check booking exists
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Only the customer who made the booking can reschedule
      if (booking.customer_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only reschedule your own booking' });
      }

      // Cannot reschedule a finished or cancelled booking
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        return res.status(400).json({ message: `Cannot reschedule a ${booking.status} booking` });
      }

      // Prevent double-booking the provider at the new slot
      const conflict = await Booking.checkConflict(
        booking.provider_id,
        booking_date,
        booking_time
      );
      if (conflict) {
        return res.status(409).json({ message: 'Provider is not available at the selected time' });
      }

      const updated = await Booking.reschedule(bookingId, booking_date, booking_time);

      // Notify the provider of the reschedule
      await Notification.create(
        booking.provider_id,
        'Booking Rescheduled',
        `A customer rescheduled their booking to ${booking_date} at ${booking_time}.`,
        'new_booking'
      );

      res.json({
        message: 'Booking rescheduled successfully',
        booking: updated
      });

    } catch (error) {
      console.error('Reschedule booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
};

module.exports = bookingController;