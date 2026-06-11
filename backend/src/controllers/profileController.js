const Profile = require('../models/Profile');

const profileController = {
  // Get your own profile
  async getProfile(req, res) {
    try {
      const profile = await Profile.findByUserId(req.user.id);

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update your own profile
  async updateProfile(req, res) {
    try {
      const { bio, phone, location } = req.body;

      const profile = await Profile.update(
        req.user.id,
        bio,
        phone,
        location
      );

      res.json({
        message: 'Profile updated successfully',
        profile
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get any user's profile by id
  async getProfileById(req, res) {
    try {
      const profile = await Profile.findByUserId(req.params.id);

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('Get profile by id error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = profileController;