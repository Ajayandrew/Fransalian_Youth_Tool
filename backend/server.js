const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to Database (with automatic fallback to in-memory store)
connectDB();

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Express server running on port ${PORT}`);
});
