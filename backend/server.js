const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(mongoSanitize()); // Prevent NoSQL injection

// Custom XSS sanitization middleware (xss-clean is incompatible with Express 4.x getter-only req.query)
const xssFilters = require('xss-filters');
app.use((req, res, next) => {
  if (req.body) {
    const sanitize = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = xssFilters.inHTMLData(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const teamRoutes = require('./routes/teamRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const activityRoutes = require('./routes/activityRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const searchRoutes = require('./routes/searchRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'TaskFlow API is running...' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.message);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
  }

  // Multer other errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate field value entered' });
  }

  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
