const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

//Profile import
const profileRoutes = require('./routes/profile');

//Listing import
const listingRoutes = require('./routes/listings');

//Message import
const messageRoutes = require('./routes/messages');

//Review import
const reviewRoutes = require('./routes/reviews');

// Booking route
const bookingRoutes = require('./routes/bookings');

// Notification route
const notificationRoutes = require('./routes/notifications');

// Admin route
const adminRoutes = require('./routes/admin');

dotenv.config();

// Database connection
const db = require('./config/db');

// Test DB connection
const authRoutes = require('./routes/auth');

// Import middleware
const authMiddleware = require('./middleware/auth');
const rbac = require('./middleware/rbac');

// Availability routes
const availabilityRoutes = require('./routes/availability');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());



// Routes
app.use('/api/auth', authRoutes);

// Profile routes
app.use('/api/profile', profileRoutes);

// Booking routes
app.use('/api/bookings', bookingRoutes);

// Listing routes
app.use('/api/listings', listingRoutes);

// Review routes
app.use('/api/reviews', reviewRoutes);

// Message routes
app.use('/api/messages', messageRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Availability routes
app.use('/api/availability', availabilityRoutes);



// Test protected routes
app.get('/api/test/customer', authMiddleware, rbac('customer', 'admin'), (req, res) => {
  res.json({ message: `Hello ${req.user.role}, you are authorized!` });
});

app.get('/api/test/admin', authMiddleware, rbac('admin'), (req, res) => {
  res.json({ message: 'Hello admin, you are authorized!' });
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'ServiceLink API is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;