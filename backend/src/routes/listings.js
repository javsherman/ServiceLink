const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// Public routes (still need to be logged in)
router.get('/', authMiddleware, listingController.searchListings);
router.get('/my', authMiddleware, rbac('provider'), listingController.getMyListings);
router.get('/geocode', authMiddleware, listingController.geocodeAddress);   // ABOVE /:id
router.get('/:id', authMiddleware, listingController.getListingById);

// Provider only routes
router.post('/', authMiddleware, rbac('provider'), listingController.createListing);
router.put('/:id', authMiddleware, rbac('provider'), listingController.updateListing);
router.delete('/:id', authMiddleware, rbac('provider'), listingController.deleteListing);

module.exports = router;