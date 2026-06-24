const Listing = require('../models/Listing');

const { geocode } = require('../utils/geocode');

const listingController = {
  // Create a listing (providers only)
  // Create a listing (providers only)
  async createListing(req, res) {
    try {
      const { title, description, category, price, location, latitude, longitude } = req.body;

      if (!title || !description || !category || !price || !location) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const listing = await Listing.create(
        req.user.id,
        title,
        description,
        category,
        price,
        location,
        latitude,
        longitude
      );

      res.status(201).json({
        message: 'Listing created successfully',
        listing
      });

    } catch (error) {
      console.error('Create listing error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Search listings (all users)
  // Search listings (all users)
  async searchListings(req, res) {
    try {
      const { category, location, keyword, lat, lng, boost } = req.query;
      const applyBoost = boost !== 'false';

      const listings = await Listing.search(category, location, keyword, lat, lng, applyBoost);

      res.json({
        count: listings.length,
        listings
      });
    } catch (error) {
      console.error('Search listings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get a single listing by id
  async getListingById(req, res) {
    try {
      const listing = await Listing.findById(req.params.id);

      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      res.json(listing);

    } catch (error) {
      console.error('Get listing error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get all listings by the logged in provider
  async getMyListings(req, res) {
    try {
      const listings = await Listing.findByProvider(req.user.id);
      res.json(listings);

    } catch (error) {
      console.error('Get my listings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  // Geocode an address into coordinates (for manual location entry)
  async geocodeAddress(req, res) {
    try {
      const { address } = req.query;

      if (!address) {
        return res.status(400).json({ message: 'Address is required' });
      }

      const coords = await geocode(address);

      if (!coords) {
        return res.status(404).json({ message: 'Location not found' });
      }

      res.json(coords);

    } catch (error) {
      console.error('Geocode error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update a listing (providers only)
 // Update a listing (providers only)
  async updateListing(req, res) {
    try {
      const { title, description, category, price, location, isAvailable, latitude, longitude } = req.body;

      // Check listing exists
      const existing = await Listing.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Make sure only the owner can update
      if (existing.provider_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only update your own listings' });
      }

      const listing = await Listing.update(
        req.params.id,
        title || existing.title,
        description || existing.description,
        category || existing.category,
        price || existing.price,
        location || existing.location,
        isAvailable !== undefined ? isAvailable : existing.is_available,
        latitude !== undefined ? latitude : existing.latitude,
        longitude !== undefined ? longitude : existing.longitude
      );

      res.json({
        message: 'Listing updated successfully',
        listing
      });

    } catch (error) {
      console.error('Update listing error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete a listing (providers only)
  async deleteListing(req, res) {
    try {
      const existing = await Listing.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Make sure only the owner can delete
      if (existing.provider_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only delete your own listings' });
      }

      await Listing.delete(req.params.id);

      res.json({ message: 'Listing deleted successfully' });

    } catch (error) {
      console.error('Delete listing error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = listingController;