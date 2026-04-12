require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const passport = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5001;


// Security Middleware
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests, please try again later.' });
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Session (for Passport)
const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_LOCAL_URI;
if (!mongoUrl) {
  throw new Error('MONGODB_URI or MONGODB_LOCAL_URI must be defined in .env file');
}
app.use(session({
  secret: process.env.SESSION_SECRET || 'resumecraft_session_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl }),
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve client (optional - when deploying as single app)
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/portfolio', require('./routes/portfolio'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ResumeCraft API is running 🚀', timestamp: new Date() });
});

// Serve frontend for any non-API route
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 ResumeCraft Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🌐 Client: http://localhost:${PORT}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use. Please stop the process using this port or set a different PORT in your .env file.`);
    } else {
      console.error('❌ Server startup error:', err);
    }
    process.exit(1);
  });
};

startServer();

module.exports = app;
