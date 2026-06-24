const Availability = require('../models/Availability');

const availabilityController = {
  async setAvailability(req, res) {
    try {
      const { dayOfWeek, startTime, endTime } = req.body;
      if (!dayOfWeek || !startTime || !endTime) {
        return res.status(400).json({ message: 'Day, start time and end time are required' });
      }
      const availability = await Availability.create(req.user.id, dayOfWeek, startTime, endTime);
      res.status(201).json({ message: 'Availability set successfully', availability });
    } catch (error) {
      console.error('Set availability error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getMyAvailability(req, res) {
    try {
      const availability = await Availability.findByProvider(req.user.id);
      res.json(availability);
    } catch (error) {
      console.error('Get availability error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getProviderAvailability(req, res) {
    try {
      const availability = await Availability.findByProvider(req.params.providerId);
      res.json(availability);
    } catch (error) {
      console.error('Get provider availability error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async toggleDay(req, res) {
    try {
      const { dayOfWeek, isAvailable } = req.body;
      const availability = await Availability.toggleDay(req.user.id, dayOfWeek, isAvailable);
      if (!availability) {
        return res.status(404).json({ message: 'Availability not found for that day' });
      }
      res.json({ message: `${dayOfWeek} availability updated`, availability });
    } catch (error) {
      console.error('Toggle availability error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async deleteDay(req, res) {
    try {
      await Availability.deleteDay(req.user.id, req.params.day);
      res.json({ message: 'Availability removed for that day' });
    } catch (error) {
      console.error('Delete availability error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = availabilityController;