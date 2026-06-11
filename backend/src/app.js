const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const profileRoutes = require('./routes/profile');

// Add with your other imports at the top
const bookingRoutes = require('./routes/bookings');

dotenv.config();

const db = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');

// Import middleware
const authMiddleware = require('./middleware/auth');
const rbac = require('./middleware/rbac');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/bookings', bookingRoutes);

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