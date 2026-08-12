const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

const sanitizeInput = require('./middleware/sanitize');
const { savePersistentStore } = require('./store/persistentStore');

dotenv.config();

const app = express();

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Compression, Body Parsers & Sanitization
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// Static uploads with caching headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' }));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' }));

// Connect to Database (with automatic fallback to in-memory store)
connectDB();

// Apply Rate Limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Root endpoint test
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Fransalian Youth Management API is running cleanly' });
});

// Serve frontend static build files in production if available
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

// Global Central Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error. Please try again later.'
  });
});

// Process Data Safety Handlers
process.on('uncaughtException', (err) => {
  console.error('[Process Error] Uncaught Exception:', err);
  try { savePersistentStore(); } catch (e) {}
});

process.on('unhandledRejection', (reason) => {
  console.error('[Process Error] Unhandled Rejection:', reason);
  try { savePersistentStore(); } catch (e) {}
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Express server running on port ${PORT}`);
});
