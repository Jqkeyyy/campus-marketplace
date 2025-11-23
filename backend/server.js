const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const db = require('./database'); // 👈 add this near the top with other requires

// ...

// DB debug endpoint
app.get('/api/debug/db', async (req, res, next) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      ok: true,
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error('DB debug error:', err);
    next(err);
  }
});


// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import routes
const usersRoutes = require('./routes/users');
const listingsRoutes = require('./routes/listings');
const categoriesRoutes = require('./routes/categories');
const favoritesRoutes = require('./routes/favorites');
const messagesRoutes = require('./routes/messages');
const imagesRoutes = require('./routes/images');

// API Routes
app.use('/api/users', usersRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/images', imagesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Campus Marketplace API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      listings: '/api/listings',
      categories: '/api/categories',
      favorites: '/api/favorites',
      messages: '/api/messages',
      images: '/api/images',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`Campus Marketplace API Server`);
  console.log(`=================================`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}`);
  console.log(`=================================\n`);
});

module.exports = app;
